"""
Learning Chain Router
======================
Barcha o'quv bosqichlarini birlashtiruvchi API.

POST /api/chain/flashcards          → AI flashcard generatsiya (1→2 qadam)
POST /api/chain/quiz-from-cards     → Flashcarddan quiz generatsiya (2→3 qadam)
POST /api/chain/complete            → Quiz natijasini qayta ishlash (3→4→5 qadam)
GET  /api/chain/session/{id}        → Sessiya natijalarini olish
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
from services.learning_chain import (
    generate_flashcards_from_topic,
    save_flashcards_to_db,
    generate_quiz_from_flashcards,
    complete_learning_chain,
)
from models.flashcard import FlashCard
from models.student_progress import StudentProgress
from models.user import User, UserRole
from routers.auth import get_current_user
import json

router = APIRouter()


def _check_student_access(current_user: User, target_student_id: int) -> None:
    """Student faqat o'z ma'lumotlariga kirishi mumkin; professor/admin istalgan talabaga."""
    if current_user.role in (UserRole.professor, UserRole.admin):
        return
    if current_user.id != target_student_id:
        raise HTTPException(status_code=403, detail="Faqat o'z ma'lumotlaringizga kira olasiz")


# ─────────────────────────────────────────────────────────────────────────────
# Pydantic sxemalar
# ─────────────────────────────────────────────────────────────────────────────

class FlashcardGenRequest(BaseModel):
    student_id: int
    topic: str
    subject: str = ""
    count: int = 5
    difficulty: str = "medium"   # easy | medium | hard
    lesson_id: Optional[int] = None
    save_to_db: bool = True


class QuizGenRequest(BaseModel):
    topic: str
    flashcards: list[dict]       # front/back/hint listi
    count: int = 5


class QuizResult(BaseModel):
    card_index: int
    is_correct: bool
    time_ms: int = 10000


class CompleteChainRequest(BaseModel):
    student_id: int
    topic: str
    subject: str = ""
    quiz_results: list[QuizResult]
    flashcard_ids: list[int] = []
    lesson_id: Optional[int] = None


# ─────────────────────────────────────────────────────────────────────────────
# QADAM 1 → 2: AI Flashcard generatsiya
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/flashcards")
async def generate_flashcards(
    req: FlashcardGenRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    AI orqali mavzu bo'yicha flashcard yaratadi.
    Agar save_to_db=True bo'lsa, DB ga ham saqlaydi.
    """
    _check_student_access(current_user, req.student_id)

    try:
        cards_data = await generate_flashcards_from_topic(
            topic=req.topic,
            subject=req.subject,
            count=req.count,
            difficulty=req.difficulty
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI xatosi: {str(e)}")

    saved_ids = []
    if req.save_to_db and req.student_id:
        try:
            saved = await save_flashcards_to_db(
                db=db,
                student_id=req.student_id,
                cards_data=cards_data,
                topic=req.topic,
                subject=req.subject,
                lesson_id=req.lesson_id
            )
            saved_ids = [fc.id for fc in saved]
        except Exception as e:
            # DB xatosi bo'lsa ham kartalarni qaytaramiz
            saved_ids = []

    return {
        "success": True,
        "flashcards": cards_data,
        "saved_ids": saved_ids,
        "count": len(cards_data),
        "topic": req.topic,
        "next_step": "quiz"   # Frontend uchun keyingi qadam ko'rsatkich
    }


# ─────────────────────────────────────────────────────────────────────────────
# QADAM 2 → 3: Flashcarddan Quiz generatsiya
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/quiz-from-cards")
async def generate_quiz(
    req: QuizGenRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Mavjud flashcardlar asosida test savollari yaratadi.
    """
    if not req.flashcards:
        raise HTTPException(status_code=400, detail="Flashcardlar bo'sh")

    try:
        questions = await generate_quiz_from_flashcards(
            flashcards=req.flashcards,
            topic=req.topic,
            count=req.count
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Quiz generatsiya xatosi: {str(e)}")

    return {
        "success": True,
        "questions": questions,
        "count": len(questions),
        "topic": req.topic,
        "next_step": "complete"   # Frontend uchun keyingi qadam
    }


# ─────────────────────────────────────────────────────────────────────────────
# QADAM 3 → 4 → 5: Quiz natijasini qayta ishlash (to'liq zanjir)
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/complete")
async def complete_chain(
    req: CompleteChainRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Quiz tugagandan keyin chaqiriladi:
    1. SM-2 algoritmini har bir kartaga qo'llaydi
    2. StudentProgress ni yangilaydi
    3. Achievement tekshiradi va beradi
    """
    _check_student_access(current_user, req.student_id)

    try:
        result = await complete_learning_chain(
            db=db,
            student_id=req.student_id,
            topic=req.topic,
            subject=req.subject,
            quiz_results=[r.model_dump() for r in req.quiz_results],
            flashcard_ids=req.flashcard_ids,
            lesson_id=req.lesson_id
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Zanjir xatosi: {str(e)}")

    return {
        "success": True,
        **result,
        "next_step": "review" if result["quiz_score"] < 70 else "done"
    }


# ─────────────────────────────────────────────────────────────────────────────
# Qo'shimcha: Talaba progress va flashcardlarini olish
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/progress/{student_id}")
async def get_student_chain_progress(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Talabaning barcha mavzular bo'yicha progress ma'lumotlari."""
    _check_student_access(current_user, student_id)
    progresses = db.query(StudentProgress).filter(
        StudentProgress.student_id == student_id
    ).all()

    total_cards = db.query(FlashCard).filter(
        FlashCard.student_id == student_id
    ).count()

    due_cards = 0
    try:
        now = datetime.now(timezone.utc)
        due_cards = db.query(FlashCard).filter(
            FlashCard.student_id == student_id,
            FlashCard.next_review <= now,
        ).count()
    except Exception:
        pass

    return {
        "student_id": student_id,
        "total_flashcards": total_cards,
        "due_for_review": due_cards,
        "subjects": [
            {
                "subject": p.subject,
                "topic": p.topic,
                "mastery_level": round(p.mastery_level, 1),
                "sessions_count": p.sessions_count,
                "last_studied": p.last_studied.isoformat() if p.last_studied else None,
                "weak_points": json.loads(p.weak_points or "[]"),
                "strong_points": json.loads(p.strong_points or "[]"),
            }
            for p in progresses
        ]
    }


@router.get("/due-flashcards/{student_id}")
async def get_due_flashcards(
    student_id: int,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Bugun takrorlanishi kerak bo'lgan flashcardlar."""
    _check_student_access(current_user, student_id)
    now = datetime.now(timezone.utc)
    cards = db.query(FlashCard).filter(
        FlashCard.student_id == student_id,
        FlashCard.next_review <= now
    ).limit(limit).all()

    return {
        "cards": [
            {
                "id": c.id,
                "front": c.question,
                "back": c.answer,
                "hint": c.hint,
                "subject": c.subject,
                "interval_days": c.interval,
                "ease_factor": round(c.ease_factor, 2),
                "repetitions": c.repetitions,
            }
            for c in cards
        ],
        "count": len(cards)
    }
