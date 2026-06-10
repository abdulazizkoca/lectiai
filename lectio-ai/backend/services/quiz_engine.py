from socketio import AsyncServer
import asyncio
import json
import random
import string
import time
import os
import redis.asyncio as redis
import google.generativeai as genai
import cv2
import numpy as np
import base64
from services.camera_service import camera

sio = AsyncServer(
    async_mode='asgi',
    cors_allowed_origins=["http://localhost:3000", "https://lectioai.uz"]
)

# Redis for horizontal scaling and state management
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

try:
    # Add timeouts for remote connection
    redis_client = redis.from_url(
        REDIS_URL, 
        decode_responses=True,
        socket_timeout=5,
        socket_connect_timeout=5,
        retry_on_timeout=True
    )
except Exception as e:
    print(f"Failed to connect to Redis at {REDIS_URL}: {e}")
    redis_client = None

# Gemini for AI grading
genai.configure(api_key=os.getenv("GEMINI_API_KEY") or "mock-key")
gemini_model = genai.GenerativeModel('gemini-1.5-pro')

def generate_room_code() -> str:
    chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    return "".join(random.choices(chars, k=6))

# In-memory fallback when Redis is unavailable (development)
_mem_rooms: dict = {}
_mem_sid_room: dict = {}

async def get_room(room_code: str):
    if redis_client:
        data = await redis_client.get(f"quiz:room:{room_code}")
        return json.loads(data) if data else None
    return _mem_rooms.get(room_code)

async def save_room(room_code: str, room_data: dict):
    if redis_client:
        await redis_client.setex(f"quiz:room:{room_code}", 4 * 3600, json.dumps(room_data))
    else:
        _mem_rooms[room_code] = room_data

async def delete_room(room_code: str):
    if redis_client:
        await redis_client.delete(f"quiz:room:{room_code}")
    else:
        _mem_rooms.pop(room_code, None)

async def get_sid_room(sid: str) -> str | None:
    if redis_client:
        return await redis_client.get(f"quiz:sid_room:{sid}")
    return _mem_sid_room.get(sid)

async def set_sid_room(sid: str, room_code: str):
    if redis_client:
        await redis_client.setex(f"quiz:sid_room:{sid}", 4 * 3600, room_code)
    else:
        _mem_sid_room[sid] = room_code

async def del_sid_room(sid: str):
    if redis_client:
        await redis_client.delete(f"quiz:sid_room:{sid}")
    else:
        _mem_sid_room.pop(sid, None)

async def ai_grade_short_answer(correct_answer: str, student_answer: str) -> float:
    # returns score between 0.0 and 1.0
    prompt = f"""
Siz o'qituvchisiz. O'quvchining qisqa javobini baholang (0.0 dan 1.0 gacha bo'lgan raqam qaytaring, faqat raqam, boshqa matn yo'q).
To'g'ri javob: {correct_answer}
O'quvchi javobi: {student_answer}
"""
    if not os.getenv("GEMINI_API_KEY"):
        return 1.0 if correct_answer.strip().lower() == student_answer.strip().lower() else 0.0
        
    try:
        response = await gemini_model.generate_content_async(
            prompt,
            generation_config=genai.types.GenerationConfig(max_output_tokens=10)
        )
        score_str = response.text.strip()
        score = float(score_str)
        return max(0.0, min(1.0, score))
    except Exception:
        return 0.0

def calculate_score(q_data: dict, time_taken_ms: int, streak: int, correctness: float = 1.0) -> int:
    if correctness <= 0:
        return 0
    
    base_points = 1000
    time_limit_ms = q_data.get("time_limit", 30) * 1000
    
    # Speed bonus up to 500
    time_ratio = max(0, 1 - (time_taken_ms / time_limit_ms))
    speed_bonus = 500 * time_ratio
    
    raw_points = base_points + speed_bonus
    
    # Streak multiplier
    multiplier = 1.0
    if streak >= 5:
        multiplier = 2.0
    elif streak >= 3:
        multiplier = 1.5
        
    return int((raw_points * multiplier) * correctness)

def get_leaderboard(room: dict):
    parts = list(room.get("participants", {}).values())
    sorted_parts = sorted(parts, key=lambda x: x["score"], reverse=True)
    return [
        {
            "rank": i + 1,
            "name": p["name"],
            "score": p["score"],
            "streak": p.get("streak", 0),
            "student_id": p.get("student_id")
        }
        for i, p in enumerate(sorted_parts)
    ]

# SOCKET.IO EVENTS

@sio.event
async def connect(sid, environ):
    """
    Token query string yoki Authorization header orqali yuboriladi.
    Misol: io("ws://...", { auth: { token: "Bearer ..." } })
    yoki   io("ws://...?token=...")
    """
    # 1) query string'dan token olish
    qs = environ.get("QUERY_STRING", "")
    token = None
    for part in qs.split("&"):
        if part.startswith("token="):
            token = part[6:]
            break

    # 2) Authorization headerdan olish
    if not token:
        auth_header = environ.get("HTTP_AUTHORIZATION", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]

    # 3) socket.io auth dict'dan olish (frontend auth: {token: "..."})
    if not token:
        http_auth = environ.get("HTTP_AUTH", "")
        if http_auth:
            import json as _json
            try:
                auth_obj = _json.loads(http_auth)
                raw = auth_obj.get("token", "")
                token = raw.replace("Bearer ", "") if raw else None
            except Exception:
                pass

    if not token:
        return False  # ulanishni rad etadi

    try:
        from jose import jwt, JWTError
        SECRET_KEY = os.getenv("SECRET_KEY")
        ALGORITHM = os.getenv("ALGORITHM", "HS256")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if not payload.get("sub"):
            return False
    except Exception:
        return False

@sio.event
async def disconnect(sid):
    room_code = await get_sid_room(sid)
    if not room_code:
        return
    room = await get_room(room_code)
    if room and sid in room["participants"]:
        del room["participants"][sid]
        await save_room(room_code, room)
        nicknames = [p["name"] for p in room["participants"].values()]
        await sio.emit("participant_left", {
            "participant_count": len(room["participants"]),
            "nickname_list": nicknames
        }, room=room_code)
    await del_sid_room(sid)

# PROFESSOR EVENTS
@sio.event
async def create_room(sid, data):
    room_code = generate_room_code()
    # Check uniqueness
    while await get_room(room_code):
        room_code = generate_room_code()
        
    room_data = {
        "status": "waiting",
        "room_code": room_code,
        "professor_sid": sid,
        "lesson_id": data.get("lesson_id"),
        "questions": data.get("questions", []),
        "settings": data.get("settings", {}),
        "current_q_index": -1,
        "participants": {}, # sid -> {name, score, streak, ...}
        "answers": {}, # q_index -> {sid -> {answer, score, time_taken}}
        "question_start_time": None
    }
    await save_room(room_code, room_data)
    await sio.enter_room(sid, room_code)
    await sio.emit("room_created", {"room_code": room_code}, to=sid)

@sio.event
async def set_phone_permission(sid, data):
    """Professor allows/disallows phone usage"""
    room_code = data.get("room_code")
    if not room_code:
        return
        
    room = await get_room(room_code)
    if not room or room.get("professor_sid") != sid:
        return
    
    room["phone_allowed"] = data.get("allowed", False)
    await save_room(room_code, room)
    
    # Broadcast to all students in room
    await sio.emit("phone_permission", {"allowed": data["allowed"]}, room=room_code)

@sio.event
async def start_question(sid, data):
    room_code = data["room_code"]
    room = await get_room(room_code)
    if not room or room["professor_sid"] != sid:
        return

    q_idx = data["question_index"]
    if q_idx >= len(room["questions"]):
        return
        
    room["current_q_index"] = q_idx
    room["status"] = "active"
    room["question_start_time"] = time.time()
    
    if str(q_idx) not in room["answers"]:
        room["answers"][str(q_idx)] = {}
        
    await save_room(room_code, room)
    
    q_data = room["questions"][q_idx]
    
    # Strip correct answer for broadcast
    safe_q_data = {k: v for k, v in q_data.items() if k not in ["correct_answer", "explanation"]}
    
    await sio.emit("question_started", {
        "question": safe_q_data,
        "time_limit": q_data.get("time_limit", 30)
    }, room=room_code)

@sio.event
async def end_question(sid, data):
    room_code = data["room_code"]
    room = await get_room(room_code)
    if not room or room["professor_sid"] != sid:
        return
        
    room["status"] = "showing_results"
    await save_room(room_code, room)
    
    q_idx = room["current_q_index"]
    q_data = room["questions"][q_idx]
    
    # Calculate stats
    ans_dict = room["answers"].get(str(q_idx), {})
    stats = {}
    correct_count = 0
    for a in ans_dict.values():
        val = a["answer"]
        stats[val] = stats.get(val, 0) + 1
        if a["score"] > 0:
            correct_count += 1
            
    await sio.emit("question_results", {
        "correct_answer": q_data.get("correct_answer"),
        "explanation": q_data.get("explanation"),
        "stats": stats,
        "correct_count": correct_count,
        "top5_leaderboard": get_leaderboard(room)[:5]
    }, room=room_code)

@sio.event
async def end_quiz(sid, data):
    room_code = data["room_code"]
    room = await get_room(room_code)
    if not room or room["professor_sid"] != sid:
        return
        
    room["status"] = "ended"
    await save_room(room_code, room)
    
    leaderboard = get_leaderboard(room)
    await sio.emit("quiz_ended", {
        "final_leaderboard": leaderboard,
    }, room=room_code)
    await delete_room(room_code)


# STUDENT EVENTS
@sio.event
async def join_room(sid, data):
    room_code = data["room_code"].upper()
    room = await get_room(room_code)
    
    if not room:
        await sio.emit("error", {"message": "Room not found"}, to=sid)
        return
        
    nickname = data["nickname"]
    student_id = data.get("student_id")
    
    # Handle rejoining by matching student_id or nickname
    existing_sid = None
    for p_sid, p_data in room["participants"].items():
        if (student_id and p_data.get("student_id") == student_id) or p_data["name"] == nickname:
            existing_sid = p_sid
            break
            
    if existing_sid and existing_sid != sid:
        room["participants"][sid] = room["participants"].pop(existing_sid)
    elif sid not in room["participants"]:
        room["participants"][sid] = {
            "name": nickname,
            "student_id": student_id,
            "score": 0,
            "streak": 0,
            "correct_answers": 0,
            "total_time_ms": 0
        }
        
    await save_room(room_code, room)
    await sio.enter_room(sid, room_code)
    await set_sid_room(sid, room_code)

    nicknames = [p["name"] for p in room["participants"].values()]

    await sio.emit("room_joined", {
        "participant_count": len(room["participants"]),
        "nickname_list": nicknames
    }, room=room_code)
    
    await sio.emit("join_success", {"nickname": nickname}, to=sid)

@sio.event
async def submit_answer(sid, data):
    room_code = data["room_code"]
    room = await get_room(room_code)
    if not room or room["status"] != "active":
        return
        
    q_idx = str(room["current_q_index"])
    if sid in room["answers"].get(q_idx, {}):
        return # Duplicate submission
        
    # Duplicate submission check (in-memory fallback when Redis unavailable)
    if redis_client:
        nx_key = f"quiz:submit:{room_code}:{q_idx}:{sid}"
        is_first = await redis_client.setnx(nx_key, "1")
        if not is_first:
            return
        await redis_client.expire(nx_key, 60)
    elif sid in room["answers"].get(q_idx, {}):
        return
    
    answer = data["answer"]
    
    # Server-side timing (anti-cheat)
    server_time_taken_ms = int((time.time() - room["question_start_time"]) * 1000)
    # Take the larger time to prevent client cheating (saying they took 1ms)
    client_time_taken_ms = data.get("time_taken_ms", server_time_taken_ms)
    time_taken_ms = max(server_time_taken_ms, client_time_taken_ms)
    
    q_data = room["questions"][int(q_idx)]
    q_type = q_data.get("type", "multiple_choice")
    correct_ans = q_data.get("correct_answer")
    
    correctness = 0.0
    if q_type == "short_answer":
        correctness = await ai_grade_short_answer(correct_ans, answer)
    else:
        correctness = 1.0 if str(answer).upper() == str(correct_ans).upper() else 0.0
        
    participant = room["participants"][sid]
    streak = participant.get("streak", 0)
    
    if correctness > 0:
        streak += 1
        participant["correct_answers"] += 1
    else:
        streak = 0
        
    points = calculate_score(q_data, time_taken_ms, streak, correctness)
    
    participant["streak"] = streak
    participant["score"] += points
    participant["total_time_ms"] += time_taken_ms
    
    room["answers"][q_idx][sid] = {
        "answer": answer,
        "score": points,
        "time_taken": time_taken_ms
    }
    
    await save_room(room_code, room)
    
    # Get rank
    leaderboard = get_leaderboard(room)
    rank = next((i + 1 for i, p in enumerate(leaderboard) if p["name"] == participant["name"]), 0)
    
    await sio.emit("answer_confirmed", {
        "is_correct": correctness > 0.5,
        "points_earned": points,
        "current_score": participant["score"],
        "rank": rank,
        "streak": streak
    }, to=sid)
    
    # Update professor stats
    await sio.emit("answer_stats", {
        "answered_count": len(room["answers"][q_idx]),
        "total_count": len(room["participants"])
    }, to=room["professor_sid"])

@sio.event
async def ask_question(sid, data):
    room_code = data["room_code"]
    room = await get_room(room_code)
    if not room:
        return
        
    await sio.emit("student_asked", {
        "question_text": data["text"]
    }, to=room["professor_sid"])

@sio.event
async def camera_frame(sid, data):
    room_code = data.get("room_code")
    frame_b64 = data.get("frame")
    student_id = data.get("student_id")
    nickname = data.get("nickname")
    
    if not room_code or not frame_b64:
        return
        
    room = await get_room(room_code)
    if not room:
        return
        
    try:
        # Decode base64 frame
        if "," in frame_b64:
            frame_b64 = frame_b64.split(",")[1]
            
        frame_bytes = base64.b64decode(frame_b64)
        nparr = np.frombuffer(frame_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if frame is None:
            return
            
        # Analyze frame for attention
        attention_data = camera.analyze_frame(frame)
        
        # Emit to professor
        await sio.emit("student_attention", {
            "student_id": student_id,
            "nickname": nickname,
            "attention": attention_data.attention_level,
            "boredom": attention_data.boredom_detected,
            "confusion": attention_data.confusion_detected
        }, to=room["professor_sid"])
        
    except Exception as e:
        print(f"Error processing camera frame: {e}")

