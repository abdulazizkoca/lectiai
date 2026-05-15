from socketio import AsyncServer
import asyncio, json, random, string
from datetime import datetime
import os
import redis.asyncio as redis

# Redis setup for SET NX race condition prevention
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
redis_client = redis.Redis.from_url(REDIS_URL)

sio = AsyncServer(
    async_mode='asgi',
    cors_allowed_origins=["http://localhost:3000", "https://lectioai.uz"]
)
rooms: dict = {}
room_locks: dict = {}

def generate_room_code() -> str:
    return "LECTIO-" + "".join(random.choices(string.ascii_uppercase + string.digits, k=4))

class RoomState:
    def __init__(self, session_id, professor_sid, questions, config):
        self.session_id = session_id
        self.professor_sid = professor_sid
        self.questions = questions
        self.config = config
        self.current_q_index = -1
        self.participants: dict = {}
        self.teams: dict = {}
        self.status = "waiting"
        self.question_start_time = None
        self.question_answers: dict = {}
        self.streak_tracker: dict = {}
        self.powerups: dict = {}
    
    @property
    def current_question(self):
        if 0 <= self.current_q_index < len(self.questions):
            return self.questions[self.current_q_index]
        return None
    
    def calculate_points(self, sid: str, is_correct: bool, elapsed: float) -> int:
        if not is_correct:
            self.streak_tracker[sid] = 0
            return 0
        
        q = self.current_question
        base = q.get("points", 100)
        time_bonus = max(0, 1 - elapsed / q["time_limit"])
        
        self.streak_tracker[sid] = self.streak_tracker.get(sid, 0) + 1
        streak = self.streak_tracker[sid]
        streak_bonus = min(streak * 10, 50)
        
        points = int(base * (0.5 + 0.5 * time_bonus) + streak_bonus)
        return points
    
    def get_leaderboard(self):
        sorted_p = sorted(self.participants.items(), key=lambda x: x[1]["score"], reverse=True)
        return [
            {"rank": i+1, "name": p[1]["name"], "score": p[1]["score"], "streak": self.streak_tracker.get(p[0], 0)}
            for i, p in enumerate(sorted_p)
        ]
    
    def get_team_leaderboard(self):
        team_scores = {}
        for sid, p in self.participants.items():
            team = p.get("team", "no_team")
            team_scores[team] = team_scores.get(team, 0) + p["score"]
        return sorted(team_scores.items(), key=lambda x: x[1], reverse=True)

@sio.event
async def connect(sid, environ):
    # JWT authentication check would go here via middleware/connect
    pass

@sio.event
async def disconnect(sid):
    for room_code, room in list(rooms.items()):
        if room.professor_sid == sid:
            await sio.emit("error", {"message": "Professor tark etdi"}, room=room_code)
            del rooms[room_code]
            if room_code in room_locks:
                del room_locks[room_code]
            break
            
        if sid in room.participants:
            name = room.participants[sid]["name"]
            del room.participants[sid]
            await sio.emit("participant_left", {"name": name, "count": len(room.participants)}, room=room_code)
            
            # Remove empty room to prevent memory leaks
            if len(room.participants) == 0 and room.status == "ended":
                del rooms[room_code]
                if room_code in room_locks:
                    del room_locks[room_code]
            break

@sio.event
async def create_room(sid, data):
    room_code = generate_room_code()
    rooms[room_code] = RoomState(data["session_id"], sid, data["questions"], data.get("config", {}))
    room_locks[room_code] = asyncio.Lock()
    await sio.enter_room(sid, room_code)
    await sio.emit("room_created", {"room_code": room_code}, to=sid)

@sio.event
async def join_room(sid, data):
    room_code = data["room_code"].upper()
    room = rooms.get(room_code)
    if not room:
        await sio.emit("error", {"message": "Room topilmadi"}, to=sid)
        return
    if room.status != "waiting":
        await sio.emit("error", {"message": "Test boshlangan"}, to=sid)
        return
    
    nickname = data.get("nickname", "O'quvchi")
    await sio.enter_room(sid, room_code)
    room.participants[sid] = {
        "name": nickname, "student_id": data.get("student_id"), "score": 0, "answers": [], "team": data.get("team")
    }
    room.streak_tracker[sid] = 0
    
    await sio.emit("participant_joined", {"nickname": nickname, "count": len(room.participants)}, room=room_code)
    await sio.emit("joined_successfully", {"room_code": room_code, "nickname": nickname}, to=sid)

@sio.event
async def start_question(sid, data):
    room_code = data["room_code"]
    room = rooms.get(room_code)
    if not room or room.professor_sid != sid:
        return
    
    room.current_q_index += 1
    if room.current_q_index >= len(room.questions):
        await end_quiz(room_code, room)
        return
    
    room.status = "active"
    room.question_start_time = asyncio.get_event_loop().time()
    room.question_answers = {}
    
    q = room.current_question
    await sio.emit("question_started", {
        "question_number": room.current_q_index + 1, "total_questions": len(room.questions),
        "question": q["question"], "type": q["type"], "options": q["options"],
        "time_limit": q["time_limit"], "image_url": q.get("image_url"), "points": q.get("points", 100),
    }, room=room_code)
    
    asyncio.create_task(auto_end_question(room_code, q["time_limit"]))

@sio.event
async def submit_answer(sid, data):
    room_code = data["room_code"]
    room = rooms.get(room_code)
    lock = room_locks.get(room_code)
    
    if not room or not lock or room.status != "active":
        return
        
    # Prevent duplicate submission via Redis SET NX
    lock_key = f"quiz_answer:{room_code}:{room.current_q_index}:{sid}"
    is_first_submission = await redis_client.set(lock_key, "1", nx=True, ex=30)
    
    if not is_first_submission:
        return # Duplicate submission, silently ignore

    async with lock:
        answer = data["answer"]
        q = room.current_question
        elapsed = asyncio.get_event_loop().time() - room.question_start_time
        is_correct = str(answer).upper() == str(q["correct"]).upper()
        points = room.calculate_points(sid, is_correct, elapsed)
        
        room.question_answers[sid] = {"answer": answer, "is_correct": is_correct}
        if is_correct:
            room.participants[sid]["score"] += points
        
        room.participants[sid]["answers"].append({
            "question_index": room.current_q_index, "answer": answer, "is_correct": is_correct, "points": points
        })
        streak = room.streak_tracker.get(sid, 0)
        
    await sio.emit("answer_received", {
        "is_correct": is_correct, "points_earned": points, "current_score": room.participants[sid]["score"], "streak": streak,
    }, to=sid)
    
    await sio.emit("answer_count_update", {"answered": len(room.question_answers), "total": len(room.participants)}, to=room.professor_sid)

async def auto_end_question(room_code: str, time_limit: int):
    await asyncio.sleep(time_limit)
    room = rooms.get(room_code)
    if room and room.status == "active":
        await show_question_results(room_code)

async def show_question_results(room_code: str):
    room = rooms.get(room_code)
    if not room: return
    room.status = "showing_results"
    q = room.current_question
    
    option_counts = {}
    for opt in (q["options"] or []):
        key = opt[0] if opt else opt
        option_counts[key] = sum(1 for ans in room.question_answers.values() if ans["answer"] == key)
    
    correct_count = sum(1 for ans in room.question_answers.values() if ans["is_correct"])
    
    await sio.emit("question_ended", {
        "correct_answer": q["correct"], "explanation": q.get("explanation", ""),
        "total_answered": len(room.question_answers), "correct_count": correct_count,
        "option_counts": option_counts, "leaderboard": room.get_leaderboard()[:5],
    }, room=room_code)

async def end_quiz(room_code: str, room: RoomState):
    room.status = "ended"
    await sio.emit("quiz_ended", {
        "final_leaderboard": room.get_leaderboard(), "team_leaderboard": room.get_team_leaderboard(), "total_participants": len(room.participants),
    }, room=room_code)
