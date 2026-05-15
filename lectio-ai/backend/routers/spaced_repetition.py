from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from services.spaced_repetition import calculate_next_review, get_due_cards
from models.card import Card
from models.user import User
from pydantic import BaseModel

router = APIRouter()


class ReviewRequest(BaseModel):
    card_id: int
    quality: int  # 0-5


@router.get("/due-cards/{student_id}")
def get_cards_to_review(student_id: int, db: Session = Depends(get_db)):
    """Bugun o'rganilishi kerak bo'lgan kartalarni olish"""
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
def review_card(request: ReviewRequest, db: Session = Depends(get_db)):
    """Kartani ko'rib chiqish va keyingi sanani hisoblash"""
    card = db.query(Card).filter(Card.id == request.card_id).first()
    if not card:
        return {"error": "Karta topilmadi"}

    updated = calculate_next_review(card, request.quality)
    db.commit()
    db.refresh(updated)

    return {
        "next_review": str(updated.next_review),
        "interval_days": updated.interval,
        "message": f"{updated.interval} kundan keyin takrorlanadi"
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
