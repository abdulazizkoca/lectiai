from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models.card import Card
from models.lesson import Lesson
from models.user import User
from datetime import datetime, timedelta, timezone
from routers.auth import get_current_user

router = APIRouter()


@router.get("/student/{student_id}")
async def get_student_analytics(
    student_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Talaba o'qish statistikasi"""
    # Faqat o'zi yoki admin ko'rishi mumkin
    if student_id != current_user.id and current_user.role.value != "admin":
        raise HTTPException(
            status_code=403,
            detail="Bu statistikani ko'rishga ruxsat yo'q"
        )
    
    # Umumiy kartalar soni
    total_cards = db.query(Card).filter(Card.student_id == student_id).count()
    
    # Bugun takrorlanishi kerak bo'lgan kartalar
    now = datetime.now(timezone.utc)
    due_cards = db.query(Card).filter(
        Card.student_id == student_id,
        Card.next_review <= now
    ).count()
    
    # O'zlashtirilgan kartalar (interval >= 21 kun)
    mastered_cards = db.query(Card).filter(
        Card.student_id == student_id,
        Card.interval >= 21
    ).count()
    
    # O'rtacha qiyinchilik
    avg_difficulty = db.query(func.avg(Card.difficulty)).filter(
        Card.student_id == student_id
    ).scalar() or 0
    
    # Haftalik statistika (oxirgi 7 kun)
    week_ago = now - timedelta(days=7)
    reviewed_this_week = db.query(Card).filter(
        Card.student_id == student_id,
        Card.next_review >= week_ago,
        Card.repetitions > 0
    ).count()

    return {
        "student_id": student_id,
        "total_cards": total_cards,
        "due_today": due_cards,
        "mastered": mastered_cards,
        "mastery_rate": round(mastered_cards / max(total_cards, 1) * 100, 1),
        "avg_difficulty": round(float(avg_difficulty), 2),
        "reviewed_this_week": reviewed_this_week,
        "streak_message": "Davom eting! 💪" if reviewed_this_week > 0 else "Bugun boshlang! 🚀"
    }


@router.get("/lesson/{lesson_id}")
async def get_lesson_analytics(
    lesson_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Dars bo'yicha statistika"""
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Dars topilmadi")
    
    # Faqat professor o'zi yaratgan darsni ko'rishi mumkin (admin ham)
    if lesson.professor_id != current_user.id and current_user.role.value != "admin":
        raise HTTPException(
            status_code=403,
            detail="Bu dars statistikasini ko'rishga ruxsat yo'q"
        )
    
    # Dars uchun yaratilgan kartalar
    total_cards = db.query(Card).filter(Card.lesson_id == lesson_id).count()
    
    # Talabalar soni (bu dars kartalarini o'rganayotganlar)
    students_studying = db.query(func.count(func.distinct(Card.student_id))).filter(
        Card.lesson_id == lesson_id,
        Card.student_id.isnot(None)
    ).scalar() or 0
    
    # O'rtacha o'zlashtirish darajasi
    avg_interval = db.query(func.avg(Card.interval)).filter(
        Card.lesson_id == lesson_id
    ).scalar() or 0

    return {
        "lesson_id": lesson_id,
        "lesson_title": lesson.title,
        "total_cards": total_cards,
        "students_studying": students_studying,
        "avg_retention_days": round(float(avg_interval), 1),
        "difficulty_level": "Oson" if avg_interval > 14 else "O'rtacha" if avg_interval > 7 else "Qiyin"
    }


@router.get("/overview")
async def get_platform_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Platforma umumiy ko'rsatkichlari. Admin: barchasi, Professor: o'z darslari."""
    if current_user.role.value == "admin":
        total_users = db.query(User).count()
        total_lessons = db.query(Lesson).count()
        total_cards = db.query(Card).count()
        return {
            "total_users": total_users,
            "total_lessons": total_lessons,
            "total_cards": total_cards,
            "active_students": total_users,
            "avg_attention": 75,
            "platform": "Lectio AI"
        }

    if current_user.role.value == "professor":
        professor_lessons = db.query(Lesson).filter(
            Lesson.professor_id == current_user.id
        ).count()
        return {
            "total_lessons": professor_lessons,
            "active_students": 0,
            "avg_attention": 75,
            "platform": "Lectio AI"
        }

    raise HTTPException(
        status_code=403,
        detail="Platforma statistikasini ko'rishga ruxsat yo'q"
    )
