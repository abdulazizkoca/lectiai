from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.lesson import Lesson
from models.card import Card
from models.user import User
from services.ai_service import generate_lesson
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from routers.auth import get_current_user

router = APIRouter()


class LessonCreate(BaseModel):
    title: str
    topic: str
    duration_minutes: int = 45


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
        raise HTTPException(
            status_code=500,
            detail=f"AI kontent yaratishda xatolik: {str(e)}"
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
        # Karta yaratish xatoligi dars yaratishini to'xtatmasligi kerak
        print(f"Kartalar yaratishda xatolik: {e}")

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
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Professorning barcha darslari"""
    # Faqat o'zi yoki admin ko'rishi mumkin
    if professor_id != current_user.id and current_user.role.value != "admin":
        raise HTTPException(
            status_code=403,
            detail="Bu darslarni ko'rishga ruxsat yo'q"
        )
    
    lessons = db.query(Lesson).filter(
        Lesson.professor_id == professor_id
    ).order_by(Lesson.created_at.desc()).all()
    return {"lessons": _serialize_lessons(lessons)}


@router.get("/")
async def get_all_lessons(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Barcha darslar ro'yxati - faqat admin uchun"""
    if current_user.role.value != "admin":
        raise HTTPException(
            status_code=403,
            detail="Barcha darslarni ko'rish faqat admin uchun ruxsat etilgan"
        )

    lessons = db.query(Lesson).order_by(Lesson.created_at.desc()).all()
    return {"lessons": _serialize_lessons(lessons)}


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
