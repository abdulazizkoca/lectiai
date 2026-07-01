"""Live Quiz sessiyalar router"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from database import get_db
from models import LiveSession, SessionParticipant, Question, Answer, Lesson, SessionStatus
from models.user import User
from datetime import datetime, timezone
import random, string, re
import logging
from routers.auth import get_current_user

logger = logging.getLogger("lectio.sessions")
router = APIRouter()

def _gen_code():
    return f"LECTIO-{''.join(random.choices(string.ascii_uppercase+string.digits,k=4))}"


_LETTERS = ["A", "B", "C", "D", "E"]


def _check_answer_correct(student_answer: str, q) -> bool:
    """
    Javob to'g'riligini tekshiradi.
    q.correct ikki formatda bo'lishi mumkin:
      - Harf ("A") — questions.py orqali yaratilganda
      - To'liq matn — material_parser orqali yaratilganda
    Talaba ham harf, ham to'liq matn yuborishi mumkin.
    """
    sa = student_answer.strip()
    correct = (q.correct or "").strip()
    options = q.options or []

    # 1. To'g'ridan-to'g'ri solishtirish (case-insensitive)
    if sa.upper() == correct.upper():
        return True

    # 2. Talaba harf yuborgan, q.correct to'liq matn — options dan qidirish
    if len(sa) == 1 and sa.upper() in _LETTERS and options:
        idx = _LETTERS.index(sa.upper())
        if idx < len(options):
            option_text = str(options[idx]).strip()
            if option_text.upper() == correct.upper():
                return True

    # 3. Talaba to'liq matn yuborgan, q.correct harf — options dan qidirish
    if len(correct) == 1 and correct.upper() in _LETTERS and options:
        idx = _LETTERS.index(correct.upper())
        if idx < len(options):
            option_text = str(options[idx]).strip()
            if option_text.upper() == sa.upper():
                return True

    return False


def _sanitize_nickname(nickname: str) -> str:
    """Laqabni tozalash va tekshirish"""
    nickname = nickname.strip()
    if not nickname or len(nickname) < 2:
        raise HTTPException(400, "Laqab kamida 2 ta belgidan iborat bo'lishi kerak")
    if len(nickname) > 50:
        raise HTTPException(400, "Laqab 50 belgidan oshmasligi kerak")
    if not re.match(r'^[\w\s\-\.\']+$', nickname, re.UNICODE):
        raise HTTPException(400, "Laqabda ruxsatsiz belgilar bor")
    return nickname

@router.post("/create")
async def create_session(
    lesson_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Role tekshirish - faqat professorlar sessiya yaratishi mumkin
    if current_user.role.value != "professor" and current_user.role.value != "admin":
        raise HTTPException(
            status_code=403,
            detail="Faqat professorlar sessiya yaratishi mumkin"
        )
    
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(404, "Dars topilmadi")
    
    # Professor o'zi yaratgan darsni tekshirish
    if lesson.professor_id != current_user.id and current_user.role.value != "admin":
        raise HTTPException(
            status_code=403,
            detail="Bu dars uchun sessiya yaratishga ruxsat yo'q"
        )
    
    try:
        code = _gen_code()
        while db.query(LiveSession).filter(LiveSession.room_code == code).first():
            code = _gen_code()
        
        s = LiveSession(
            room_code=code, 
            lesson_id=lesson_id, 
            professor_id=current_user.id, 
            status=SessionStatus.waiting
        )
        db.add(s)
        db.commit()
        db.refresh(s)
        
        qcount = db.query(Question).filter(Question.lesson_id == lesson_id).count()
        return {
            "success": True, 
            "session_id": s.id, 
            "room_code": code, 
            "lesson_title": lesson.title, 
            "questions_count": qcount
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Sessiya yaratishda xatolik yuz berdi"
        )

@router.get("/{room_code}")
async def get_session(room_code: str, db: Session = Depends(get_db)):
    s = db.query(LiveSession).filter(LiveSession.room_code == room_code.upper()).first()
    if not s: 
        raise HTTPException(404, "Sessiya topilmadi")
    
    parts = db.query(SessionParticipant).filter(SessionParticipant.session_id == s.id).all()
    return {
        "id": s.id, 
        "room_code": s.room_code, 
        "status": s.status.value if s.status else "waiting",
        "lesson_id": s.lesson_id, 
        "participants_count": len(parts),
        "participants": [{"id": p.id, "nickname": p.nickname, "score": p.score} for p in parts]
    }

class JoinSessionRequest(BaseModel):
    nickname: str = "O'quvchi"
    student_id: Optional[int] = None


@router.post("/{room_code}/join")
async def join_session(
    room_code: str,
    body: JoinSessionRequest,
    db: Session = Depends(get_db)
):
    nickname = _sanitize_nickname(body.nickname)

    s = db.query(LiveSession).filter(LiveSession.room_code == room_code.upper()).first()
    if not s:
        raise HTTPException(404, "Room topilmadi")

    if s.status.value not in ("waiting", "active"):
        raise HTTPException(400, "Sessiya hali boshlanmagan yoki allaqachon tugagan")

    # Duplicate nickname check
    existing = db.query(SessionParticipant).filter(
        SessionParticipant.session_id == s.id,
        SessionParticipant.nickname == nickname
    ).first()
    if existing:
        raise HTTPException(400, "Bu laqab allaqachon band. Boshqa laqab tanlang")

    try:
        p = SessionParticipant(
            session_id=s.id,
            student_id=body.student_id,
            nickname=nickname,
            score=0
        )
        db.add(p)
        db.commit()
        db.refresh(p)
        return {"success": True, "participant_id": p.id, "nickname": nickname}
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Sessiyaga qo'shilishda xatolik yuz berdi")

@router.post("/{session_id}/start")
async def start_session(
    session_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    s = db.query(LiveSession).filter(LiveSession.id == session_id).first()
    if not s: 
        raise HTTPException(404, "Sessiya topilmadi")
    
    if s.professor_id != current_user.id and current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Sessiyani boshlashga ruxsat yo'q")

    if s.status.value == "active":
        return {"success": True, "status": "active", "message": "Sessiya allaqachon faol"}
    if s.status.value == "ended":
        raise HTTPException(400, "Bu sessiya allaqachon tugatilgan")

    try:
        s.status = SessionStatus.active
        s.started_at = datetime.now(timezone.utc)
        db.commit()
        return {"success": True, "status": "active"}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Sessiyani boshlashda xatolik yuz berdi"
        )

@router.post("/{session_id}/end")
async def end_session(
    session_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    s = db.query(LiveSession).filter(LiveSession.id == session_id).first()
    if not s: 
        raise HTTPException(404, "Sessiya topilmadi")
    
    # Faqat sessiya yaratuvchisi tugatishi mumkin (admin ham)
    if s.professor_id != current_user.id and current_user.role.value != "admin":
        raise HTTPException(
            status_code=403,
            detail="Sessiyani tugatishga ruxsat yo'q"
        )
    
    try:
        s.status = SessionStatus.ended
        s.ended_at = datetime.now(timezone.utc)
        db.commit()
        return {"success": True, "status": "ended"}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Sessiyani tugatishda xatolik yuz berdi"
        )

@router.get("/{session_id}/results")
async def get_results(
    session_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    s = db.query(LiveSession).filter(LiveSession.id == session_id).first()
    if not s: 
        raise HTTPException(404, "Sessiya topilmadi")
    
    # Faqat sessiya yaratuvchisi natijalarni ko'rishi mumkin (admin ham)
    if s.professor_id != current_user.id and current_user.role.value != "admin":
        raise HTTPException(
            status_code=403,
            detail="Natijalarni ko'rishga ruxsat yo'q"
        )
    
    parts = db.query(SessionParticipant).filter(SessionParticipant.session_id == session_id).order_by(SessionParticipant.score.desc()).all()
    return {
        "session_id": session_id, 
        "room_code": s.room_code, 
        "total_participants": len(parts),
        "leaderboard": [{"rank": i+1, "nickname": p.nickname, "score": p.score} for i,p in enumerate(parts)]
    }

class SubmitAnswerRequest(BaseModel):
    question_id: int
    student_answer: str
    time_taken: int = 5000


@router.post("/{session_id}/answer")
async def submit_answer(
    session_id: int,
    body: SubmitAnswerRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    question_id = body.question_id
    student_answer = body.student_answer
    time_taken = body.time_taken

    if not student_answer or len(student_answer.strip()) == 0:
        raise HTTPException(400, "Javob bo'sh bo'lishi mumkin emas")

    s = db.query(LiveSession).filter(LiveSession.id == session_id).first()
    if not s:
        raise HTTPException(404, "Sessiya topilmadi")
    if s.status.value != "active":
        raise HTTPException(400, "Sessiya faol emas yoki allaqachon tugagan")

    q = db.query(Question).filter(Question.id == question_id).first()
    if not q:
        raise HTTPException(404, "Savol topilmadi")

    # participant_id ni body'dan emas, token'dan aniqlanadi
    p = db.query(SessionParticipant).filter(
        SessionParticipant.session_id == session_id,
        SessionParticipant.student_id == current_user.id,
    ).first()
    if not p:
        raise HTTPException(404, "Siz bu sessiyaga qo'shilmagansiz")
    
    # Vaqt tekshiruvi
    if time_taken < 0:
        time_taken = 0
    
    try:
        correct = _check_answer_correct(student_answer, q)
        base = q.points or 100
        tlimit = (q.time_limit or 20) * 1000
        bonus = max(0, 1 - time_taken/tlimit)
        pts = int(base*(0.5+0.5*bonus)) if correct else 0
        
        a = Answer(
            session_id=session_id, 
            question_id=question_id, 
            student_id=p.student_id,
            answer=student_answer.strip(), 
            is_correct=correct, 
            time_taken=time_taken, 
            points_earned=pts
        )
        db.add(a)
        p.score += pts
        db.commit()
        
        return {
            "success": True, 
            "is_correct": correct, 
            "points_earned": pts, 
            "current_score": p.score,
            "correct_answer": q.correct, 
            "explanation": q.explanation
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Javobni saqlashda xatolik yuz berdi"
        )
