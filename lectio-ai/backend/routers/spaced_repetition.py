from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from services.spaced_repetition import calculate_next_review, get_due_cards
from models.card import Card
from models.flashcard import FlashCard
from models.user import User
from pydantic import BaseModel, Field
from routers.auth import get_current_user

router = APIRouter()


class ReviewRequest(BaseModel):
    card_id: int
    quality: int = Field(..., ge=0, le=5)


@router.get("/due-cards/{student_id}")
def get_cards_to_review(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Bugun o'rganilishi kerak bo'lgan kartalarni olish"""
    if student_id != current_user.id and current_user.role.value != "admin":
        raise HTTPException(403, "Bu kartalarni ko'rishga ruxsat yo'q")
    cards = get_due_cards(db, student_id)
    return {
        "cards": [
            {
                "id": c.id,
                "question": c.question,
                "answer": c.answer,
                "difficulty": c.difficulty,
                "interval": c.interval,
                "next_review": str(c.next_review)
            }
            for c in cards
        ],
        "count": len(cards)
    }


@router.get("/due-cards-by-telegram/{telegram_id}")
def get_cards_by_telegram(telegram_id: str, db: Session = Depends(get_db)):
    """Telegram ID orqali kartalarni olish"""
    user = db.query(User).filter(User.telegram_id == telegram_id).first()
    if not user:
        return {"cards": [], "count": 0}
    
    cards = get_due_cards(db, user.id)
    return {
        "cards": [
            {
                "id": c.id,
                "question": c.question,
                "answer": c.answer,
                "difficulty": c.difficulty,
                "interval": c.interval,
            }
            for c in cards
        ],
        "count": len(cards)
    }


@router.post("/review")
def review_card(
    request: ReviewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Kartani ko'rib chiqish va keyingi sanani hisoblash"""
    card = db.query(Card).filter(Card.id == request.card_id).first()
    if not card:
        raise HTTPException(404, "Karta topilmadi")
    if card.student_id != current_user.id and current_user.role.value != "admin":
        raise HTTPException(403, "Bu kartaga ruxsat yo'q")

    updated = calculate_next_review(card, request.quality)
    db.commit()
    db.refresh(updated)

    return {
        "next_review": str(updated.next_review),
        "interval_days": updated.interval,
        "message": f"{updated.interval} kundan keyin takrorlanadi"
    }


@router.post("/review-flashcard")
def review_flashcard(
    request: ReviewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """FlashCard (learning chain) kartasini ko'rib chiqish — SM-2 yangilash"""
    card = db.query(FlashCard).filter(FlashCard.id == request.card_id).first()
    if not card:
        raise HTTPException(404, "Flashcard topilmadi")
    if card.student_id != current_user.id and current_user.role.value not in ("admin", "professor"):
        raise HTTPException(403, "Bu kartaga ruxsat yo'q")

    from datetime import datetime, timedelta, timezone
    q = request.quality
    # SM-2
    card.ease_factor = max(1.3, card.ease_factor + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    if q < 3:
        card.repetitions = 0
        card.interval = 1
    else:
        if card.repetitions == 0:
            card.interval = 1
        elif card.repetitions == 1:
            card.interval = 6
        else:
            card.interval = round(card.interval * card.ease_factor)
        card.repetitions += 1
    card.next_review = datetime.now(timezone.utc) + timedelta(days=card.interval)
    db.commit()

    return {
        "next_review": card.next_review.isoformat(),
        "interval_days": card.interval,
        "message": f"{card.interval} kundan keyin takrorlanadi",
    }


@router.get("/cards/{card_id}")
def get_card(card_id: int, db: Session = Depends(get_db)):
    """Bitta kartani olish"""
    card = db.query(Card).filter(Card.id == card_id).first()
    if not card:
        return {"error": "Karta topilmadi"}
    return {
        "id": card.id,
        "question": card.question,
        "answer": card.answer,
        "difficulty": card.difficulty,
        "interval": card.interval,
        "next_review": str(card.next_review)
    }
