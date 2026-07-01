from datetime import datetime, timedelta, timezone
from models.card import Card


def calculate_next_review(card: Card, quality: int) -> Card:
    """
    SM-2 algoritmi.
    quality: 0-5 (0=umuman bilmadi, 5=juda yaxshi bildi)
    Eslatma: Card.difficulty maydoni SM-2 ease_factor sifatida ishlatiladi (boshlang'ich qiymat 2.5).
    """
    # SM-2 ease_factor sifatida ishlatiladi (maydon nomi "difficulty" bo'lsa ham)
    ef = card.difficulty

    if quality < 3:
        card.repetitions = 0
        card.interval = 1
    else:
        if card.repetitions == 0:
            card.interval = 1
        elif card.repetitions == 1:
            card.interval = 6
        else:
            card.interval = round(card.interval * ef)
        card.repetitions += 1

    # Ease factor yangilash
    card.difficulty = max(1.3, ef + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))

    card.next_review = datetime.now(timezone.utc) + timedelta(days=card.interval)
    return card


def get_due_cards(db, student_id: int, limit: int = 20):
    """Bugun takrorlanishi kerak bo'lgan kartalar"""
    now = datetime.now(timezone.utc)
    return db.query(Card).filter(
        Card.student_id == student_id,
        Card.next_review <= now
    ).limit(limit).all()
