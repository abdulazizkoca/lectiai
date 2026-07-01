from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from models.flashcard import FlashCard
from models.student_progress import StudentProgress
from models.achievement import UserAchievement, Achievement
from datetime import datetime, timedelta, timezone
from routers.auth import get_current_user
import json

router = APIRouter()


@router.get("/{id}/dashboard")
async def get_dashboard(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if id != current_user.id and current_user.role.value != "admin":
        raise HTTPException(403, "Bu ma'lumotlarni ko'rishga ruxsat yo'q")
    user = db.query(User).filter(User.id == id).first()
    if not user:
        raise HTTPException(404, "Talaba topilmadi")

    total_cards = db.query(FlashCard).filter(FlashCard.student_id == id).count()
    due_cards = db.query(FlashCard).filter(
        FlashCard.student_id == id,
        FlashCard.next_review <= datetime.now(timezone.utc)
    ).count()

    achievements = db.query(UserAchievement).filter(
        UserAchievement.user_id == id
    ).count()

    return {
        "student_id": id,
        "full_name": user.full_name,
        "xp": user.xp_points,
        "streak": user.streak_days,
        "total_flashcards": total_cards,
        "due_for_review": due_cards,
        "achievements_count": achievements,
    }


@router.get("/{id}/knowledge-map")
async def get_knowledge_map(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if id != current_user.id and current_user.role.value != "admin":
        raise HTTPException(403, "Bu ma'lumotlarni ko'rishga ruxsat yo'q")
    progresses = db.query(StudentProgress).filter(
        StudentProgress.student_id == id
    ).all()

    if not progresses:
        return {"topics": [], "subject": "Umumiy"}

    # Fanlar bo'yicha guruhlash: har bir fan → uning mavzulari children sifatida
    subject_map: dict = {}
    for i, p in enumerate(progresses):
        subj = p.subject or "Boshqa"
        if subj not in subject_map:
            subject_map[subj] = []
        subject_map[subj].append({
            "id": f"t{i+1}",
            "name": p.topic,
            "mastery": round(p.mastery_level),
            "sessions": p.sessions_count,
            "children": [],
        })

    topics = []
    for j, (subj, sub_topics) in enumerate(subject_map.items()):
        avg_mastery = round(sum(t["mastery"] for t in sub_topics) / len(sub_topics))
        topics.append({
            "id": f"s{j+1}",
            "name": subj,
            "subject": subj,
            "mastery": avg_mastery,
            "sessions": sum(t["sessions"] for t in sub_topics),
            "children": sub_topics,
        })

    subject = progresses[0].subject if progresses else "Umumiy"
    return {"topics": topics, "subject": subject}


@router.post("/{id}/daily-quest/complete")
async def complete_daily_quest(
    id: int,
    quest_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if id != current_user.id and current_user.role.value != "admin":
        raise HTTPException(403, "Bu amalni bajarishga ruxsat yo'q")
    user = db.query(User).filter(User.id == id).first()
    if not user:
        raise HTTPException(404, "Talaba topilmadi")

    # Kunlik cheklov: last_active kuniga bir marta XP beramiz
    now = datetime.now(timezone.utc)
    if user.last_active:
        last = user.last_active
        if last.date() == now.date():
            return {
                "success": False,
                "xp_earned": 0,
                "total_xp": user.xp_points or 0,
                "message": "Bugungi vazifani allaqachon bajardingiz!"
            }

    xp_reward = 50
    user.xp_points = (user.xp_points or 0) + xp_reward
    user.last_active = now
    db.commit()

    return {"success": True, "xp_earned": xp_reward, "total_xp": user.xp_points, "message": "Vazifa bajarildi!"}
