import os
import redis.asyncio as redis
import json
import base64
from typing import List, Dict, Any, Optional
import pytesseract
from PIL import Image
import io
from services.ai_mentor import get_ai_response as get_claude_response
from sqlalchemy.orm import Session
from sqlalchemy import func

# --- FEATURE FLAGS ---
redis_client = redis.Redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379/0"))


async def is_feature_enabled(institution_id: str, feature_name: str) -> bool:
    flag = await redis_client.get(f"features:{institution_id}:{feature_name}")
    if flag is None:
        return True
    return flag.decode("utf-8") == "true"


# --- 1. SNAP & LEARN (Camera OCR) ---
async def process_snap_and_learn(image_base64: str) -> List[Dict[str, str]]:
    """Rasmdan matn chiqarib flashcard yaratadi."""
    try:
        image_data = base64.b64decode(image_base64)
        image = Image.open(io.BytesIO(image_data))
        extracted_text = pytesseract.image_to_string(image, lang="uzb+eng+rus")
        if not extracted_text.strip():
            return []
        prompt = f"""Extract 3-5 high-quality flashcard question-answer pairs from this educational text.
Format exactly as JSON array: [{{"q": "question", "a": "answer"}}]
Text: {extracted_text[:2000]}"""
        ai_response = await get_claude_response(prompt)
        start = ai_response.find("[")
        end = ai_response.rfind("]") + 1
        if start != -1 and end > start:
            return json.loads(ai_response[start:end])
        return []
    except Exception as e:
        return []


# --- 2. LECTIO WRAPPED ---
async def generate_lectio_wrapped(student_id: int, db: Session) -> Dict[str, Any]:
    """
    Spotify-uslubidagi yillik shaxsiy hisobot.
    DB dan haqiqiy ma'lumotlar olinadi.
    """
    from models.user import User
    from models.student_progress import StudentProgress
    from models.flashcard import FlashCard
    from models.answer import Answer
    from datetime import datetime, timezone

    user = db.query(User).filter(User.id == student_id).first()
    if not user:
        return {"error": "Foydalanuvchi topilmadi"}

    # Jami flashcardlar
    total_cards = db.query(FlashCard).filter(FlashCard.student_id == student_id).count()

    # To'g'ri javoblar
    correct_answers = db.query(Answer).filter(
        Answer.student_id == student_id,
        Answer.is_correct == True,
    ).count()
    total_answers = db.query(Answer).filter(Answer.student_id == student_id).count()

    # Progress bo'yicha eng yaxshi va eng yaxshilashgan fan
    progresses = db.query(StudentProgress).filter(
        StudentProgress.student_id == student_id
    ).order_by(StudentProgress.mastery_level.desc()).all()

    best_subject = progresses[0].subject if progresses else "—"
    most_sessions = max(progresses, key=lambda p: p.sessions_count, default=None)
    most_studied = most_sessions.subject if most_sessions else "—"

    accuracy = round(correct_answers / max(total_answers, 1) * 100, 1)

    return {
        "student_id": student_id,
        "full_name": user.full_name,
        "xp_earned": user.xp_points or 0,
        "longest_streak": user.streak_days or 0,
        "total_flashcards": total_cards,
        "correct_answers": correct_answers,
        "total_answers": total_answers,
        "accuracy_pct": accuracy,
        "best_subject": best_subject,
        "most_studied_subject": most_studied,
        "subjects_count": len(progresses),
    }


# --- 3. AI DEBATE MODE ---
async def evaluate_debate_arguments(
    topic: str, team_a_args: str, team_b_args: str
) -> Dict[str, Any]:
    prompt = f"""Evaluate this debate objectively.
Topic: {topic}
Team A Arguments: {team_a_args}
Team B Arguments: {team_b_args}

Rate each team on: Logic, Evidence, Persuasiveness (0-10).
Generate 1 counter-argument for each team.
Return JSON format."""

    ai_response = await get_claude_response(prompt)
    try:
        start = ai_response.find("{")
        end = ai_response.rfind("}") + 1
        if start != -1 and end > start:
            return json.loads(ai_response[start:end])
    except Exception:
        pass
    return {
        "team_a_scores": {"logic": 0, "evidence": 0, "persuasiveness": 0},
        "team_b_scores": {"logic": 0, "evidence": 0, "persuasiveness": 0},
        "team_a_counter": "",
        "team_b_counter": "",
        "winner": "Noma'lum",
        "raw": ai_response,
    }


# --- 4. FORMULA WHISPER ---
async def explain_formula(formula: str) -> str:
    prompt = f"""Explain this formula in simple Uzbek with a real-world analogy.
Formula: {formula}
Format:
- Odiy til bilan: ...
- O'zbek hayotidan misol: ...
- Nima uchun muhim: ...
- Yodlash usuli (Mnemonic): ..."""
    return await get_claude_response(prompt)


# --- 5. STUDY BUDDY MATCHING ---
async def find_study_buddy(student_id: int, db: Session) -> Dict[str, Any]:
    """
    Talabaning zaif fanlarini kuchli faniga ega boshqa talaba bilan birlashtiradi.
    """
    from models.student_progress import StudentProgress
    from models.user import User

    # Joriy talabaning zaif mavzulari
    my_progresses = db.query(StudentProgress).filter(
        StudentProgress.student_id == student_id,
    ).all()

    if not my_progresses:
        return {"match_found": False, "reason": "Hali o'qish tarixi yo'q"}

    my_weak = {p.subject for p in my_progresses if p.mastery_level < 40}
    my_strong = {p.subject for p in my_progresses if p.mastery_level >= 70}

    if not my_weak:
        return {"match_found": False, "reason": "Zaif fanlar aniqlanmadi"}

    # Boshqa talabalar ichidan zaif fanlarimda kuchli birini topamiz
    candidates = (
        db.query(StudentProgress)
        .filter(
            StudentProgress.student_id != student_id,
            StudentProgress.subject.in_(my_weak),
            StudentProgress.mastery_level >= 70,
        )
        .all()
    )

    if not candidates:
        return {"match_found": False, "reason": "Mos o'qish sherigi topilmadi"}

    # Eng mos nomzod: o'zimiz kuchli bo'lgan fanida zaif bo'lsin (o'zaro yordam)
    best: Optional[StudentProgress] = None
    best_score = -1
    for c in candidates:
        buddy_weak = db.query(StudentProgress).filter(
            StudentProgress.student_id == c.student_id,
            StudentProgress.subject.in_(my_strong),
            StudentProgress.mastery_level < 40,
        ).count()
        if buddy_weak > best_score:
            best_score = buddy_weak
            best = c

    if not best:
        best = candidates[0]

    buddy_user = db.query(User).filter(User.id == best.student_id).first()
    if not buddy_user:
        return {"match_found": False, "reason": "Foydalanuvchi topilmadi"}

    shared_weak = my_weak & {p.subject for p in db.query(StudentProgress).filter(
        StudentProgress.student_id == best.student_id,
        StudentProgress.mastery_level >= 70,
    ).all()}

    return {
        "match_found": True,
        "buddy_id": buddy_user.id,
        "buddy_name": buddy_user.full_name,
        "synergy": f"Siz {', '.join(list(shared_weak)[:2])} da kuchli, u sizga yordam bera oladi.",
        "match_score": min(100, 60 + best_score * 10),
    }


# --- 6. PROFESSOR MARKETPLACE ---
async def list_marketplace_items(subject: str = None) -> List[Dict[str, Any]]:
    """
    Kelajakda Marketplace jadvali qo'shilgandan keyin real DB query bo'ladi.
    Hozircha namuna ma'lumotlar qaytariladi.
    """
    items = [
        {
            "id": "item_1",
            "title": "To'liq Fizika kursi (1-semestr)",
            "professor": "Prof. R. Tursunov",
            "price": 50000,
            "rating": 4.9,
            "sales": 120,
            "includes": ["Slides", "Flashcards", "Quizzes"],
        },
        {
            "id": "item_2",
            "title": "Tarix: Amir Temur davri",
            "professor": "Docent M. Karimov",
            "price": 0,
            "rating": 4.7,
            "sales": 345,
            "includes": ["Interactive Scenarios", "Quizzes"],
        },
    ]
    if subject:
        items = [i for i in items if subject.lower() in i["title"].lower()]
    return items
