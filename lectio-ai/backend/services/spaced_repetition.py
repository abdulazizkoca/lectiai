from datetime import datetime, timedelta
from models.card import Card


def calculate_next_review(card: Card, quality: int) -> Card:
    """
    SM-2 algoritmi
    quality: 0-5 (0=umuman bilmadi, 5=juda yaxshi bildi)
    """
    if quality < 3:
        # Noto'g'ri javob — boshidan boshlash
        card.repetitions = 0
        card.interval = 1
    else:
        # To'g'ri javob — intervalni hisoblash
        if card.repetitions == 0:
            card.interval = 1
        elif card.repetitions == 1:
            card.interval = 6
        else:
            card.interval = round(card.interval * card.difficulty)

        card.repetitions += 1

    # Qiyinchilik darajasini yangilash (EF - Easiness Factor)
    card.difficulty = max(
        1.3,
        card.difficulty + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)
    )

    # Keyingi takrorlash sanasi
    card.next_review = datetime.utcnow() + timedelta(days=card.interval)

    return card


def get_due_cards(db, student_id: int, limit: int = 20):
    """Bugun takrorlanishi kerak bo'lgan kartalar"""
    now = datetime.utcnow()
    return db.query(Card).filter(
        Card.student_id == student_id,
        Card.next_review <= now
    ).limit(limit).all()
