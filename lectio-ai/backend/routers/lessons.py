from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.lesson import Lesson
from models.card import Card
from models.user import User
from services.ai_service import generate_lesson
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import logging
from routers.auth import get_current_user

logger = logging.getLogger("lectio.lessons")
router = APIRouter()


class LessonCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    topic: str = Field(..., min_length=1, max_length=500)
    duration_minutes: int = Field(default=45, ge=1, le=480)


class LessonResponse(BaseModel):
    id: int
    title: str
    topic: str
    wow_fact: Optional[str]
    presentation_data: Optional[dict]
    created_at: Optional[datetime]
    duration_minutes: Optional[int]

    class Config:
        from_attributes = True


@router.post("/create", response_model=LessonResponse)
async def create_lesson(
    lesson_data: LessonCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Yangi dars yaratish:
    1. AI prezentatsiya yaratadi
    2. WOW fakt qo'shiladi
    3. Database ga saqlanadi
    """
    # Role tekshirish - faqat professorlar dars yaratishi mumkin
    if current_user.role.value != "professor" and current_user.role.value != "admin":
        raise HTTPException(
            status_code=403,
            detail="Faqat professorlar dars yaratishi mumkin"
        )
    
    # AI orqali kontent yaratish
    try:
        ai_content = await generate_lesson(
            lesson_data.topic,
            lesson_data.duration_minutes
        )
    except Exception as e:
        logger.exception(f"AI lesson generation failed for topic={lesson_data.topic}")
        raise HTTPException(
            status_code=500,
            detail="AI kontent yaratishda xatolik yuz berdi. Iltimos qayta urinib ko'ring."
        )

    # Darsni saqlash
    try:
        lesson = Lesson(
            title=lesson_data.title,
            topic=lesson_data.topic,
            wow_fact=ai_content.get("wow_fact", ""),
            presentation_data=ai_content,
            professor_id=current_user.id  # Joriy foydalanuvchi ID si
        )
        db.add(lesson)
        db.commit()
        db.refresh(lesson)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Darsni saqlashda xatolik yuz berdi"
        )

    # Avtomatik kartalar yaratish (spaced repetition uchun)
    try:
        flashcards = ai_content.get("flashcards", [])
        for f in flashcards:
            card = Card(
                question=f.get("front", ""),
                answer=f.get("back", ""),
                lesson_id=lesson.id
            )
            db.add(card)
        db.commit()
    except Exception as e:
        db.rollback()
        logger.warning(f"Kartalar yaratishda xatolik (lesson_id={lesson.id}): {e}")

    return lesson


@router.get("/{lesson_id}")
async def get_lesson(
    lesson_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Bitta darsni olish"""
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Dars topilmadi")
    
    # Faqat professor o'zi yaratgan darsni ko'rishi mumkin (admin ham)
    if lesson.professor_id != current_user.id and current_user.role.value != "admin":
        raise HTTPException(
            status_code=403,
            detail="Bu darsga ruxsat yo'q"
        )
    
    return lesson


@router.get("/professor/{professor_id}")
async def get_professor_lessons(
    professor_id: int,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Professorning darslari (sahifalash bilan)"""
    if professor_id != current_user.id and current_user.role.value != "admin":
        raise HTTPException(
            status_code=403,
            detail="Bu darslarni ko'rishga ruxsat yo'q"
        )
    limit = min(limit, 100)
    lessons = db.query(Lesson).filter(
        Lesson.professor_id == professor_id
    ).order_by(Lesson.created_at.desc()).offset(skip).limit(limit).all()
    return {"lessons": _serialize_lessons(lessons), "skip": skip, "limit": limit}


@router.get("/")
async def get_all_lessons(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Barcha darslar ro'yxati - faqat admin uchun (sahifalash bilan)"""
    if current_user.role.value != "admin":
        raise HTTPException(
            status_code=403,
            detail="Barcha darslarni ko'rish faqat admin uchun ruxsat etilgan"
        )
    limit = min(limit, 100)
    lessons = db.query(Lesson).order_by(Lesson.created_at.desc()).offset(skip).limit(limit).all()
    return {"lessons": _serialize_lessons(lessons), "skip": skip, "limit": limit}


def _serialize_lessons(lessons: list) -> list:
    return [
        {
            "id": l.id,
            "title": l.title,
            "topic": l.topic,
            "wow_fact": l.wow_fact,
            "duration_minutes": l.duration_minutes,
            "created_at": l.created_at.isoformat() if l.created_at else None,
            "presentation_data": l.presentation_data,
        }
        for l in lessons
    ]
