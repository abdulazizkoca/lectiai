"""
Learning Chain Service
======================
Bu servis o'quv jarayonining barcha bosqichlarini bir-biriga bog'laydi:

  Material Upload
      ↓
  AI Flashcard Generation
      ↓
  Quiz (Mini Test)
      ↓
  SM-2 Spaced Repetition (natijaga qarab)
      ↓
  StudentProgress yangilash + Achievement tekshirish

Har bir qadam oldingi qadamning natijasiga asoslanadi.
"""

import json
import os
from datetime import datetime, timedelta
from typing import Optional
import google.generativeai as genai
from sqlalchemy.orm import Session
from models.card import Card
from models.flashcard import FlashCard
from models.student_progress import StudentProgress
from models.achievement import Achievement, UserAchievement

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
gemini_model = genai.GenerativeModel('gemini-1.5-pro')


# ─────────────────────────────────────────────────────────────────────────────
# QADAM 1 → QADAM 2: Material matnidan AI Flashcard yaratish
# ─────────────────────────────────────────────────────────────────────────────

async def generate_flashcards_from_topic(
    topic: str,
    subject: str = "",
    count: int = 5,
    difficulty: str = "medium"
) -> list[dict]:
    """
    AI yordamida mavzu bo'yicha flashcard savol-javoblar yaratadi.
    Bu 1-qadam (AI Usto) tugagandan keyin chaqiriladi.
    """
    diff_instruction = {
        "easy": "oddiy va tushunarlish",
        "medium": "o'rtacha murakkablikdagi",
        "hard": "chuqur va murakkab"
    }.get(difficulty, "o'rtacha murakkablikdagi")

    prompt = f"""Sen tajribali o'qituvchisan. Quyidagi mavzu bo'yicha {count} ta {diff_instruction} flashcard yarat.
    
Mavzu: {topic}
Fan: {subject or "Umumiy"}

Har bir flashcard uchun:
- front: savol yoki tushuncha (qisqa, aniq)
- back: to'liq va tushunarli javob
- hint: maslahat (ixtiyoriy, qisqa)

Faqat JSON massiv qaytargin, boshqa matn yo'q:
[
  {{"front": "savol 1", "back": "javob 1", "hint": "maslahat 1"}},
  ...
]"""

    try:
        response = await gemini_model.generate_content_async(
            prompt,
            generation_config=genai.types.GenerationConfig(
                max_output_tokens=2000,
                response_mime_type="application/json"
            )
        )
        content = response.text.strip()
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
        return json.loads(content)
    except Exception:
        # Fallback: mavzuga asoslangan umumiy kartalar
        return [
            {"front": f"{topic}: asosiy ta'rif nima?", "back": f"{topic} — bu {subject or 'fan'}ning muhim tushunchasi.", "hint": "Ta'rifdan boshlang"},
            {"front": f"{topic}: qanday xususiyatlari bor?", "back": "Tizimlilik, amaliylik va nazariy asoslanganlik.", "hint": "3 xususiyatni eslang"},
            {"front": f"{topic}: qayerda qo'llaniladi?", "back": "Ilm-fan, texnologiya va kundalik hayotda.", "hint": "Misollar keltiring"},
            {"front": f"{topic}: kimlar o'rganishi kerak?", "back": "Bu soha bilan qiziquvchi va amaliyotchi barcha mutaxassislar.", "hint": "Maqsad auditoriyasi"},
            {"front": f"{topic}: boshqa mavzular bilan aloqasi?", "back": "Ko'plab soha va fanlar bilan chambarchas bog'liq.", "hint": "Fanlararo bog'liqlik"},
        ]


async def save_flashcards_to_db(
    db: Session,
    student_id: int,
    cards_data: list[dict],
    topic: str,
    subject: str = "",
    lesson_id: Optional[int] = None
) -> list[FlashCard]:
    """Yaratilgan flashcardlarni DB ga saqlaydi (2-qadam natijasi)."""
    saved = []
    for c in cards_data:
        fc = FlashCard(
            question=c["front"],
            answer=c["back"],
            hint=c.get("hint"),
            lesson_id=lesson_id,
            student_id=student_id,
            subject=subject or topic,
            tags=json.dumps([topic, subject] if subject else [topic]),
            difficulty=2.5,
            ease_factor=2.5,
            interval=1,
            repetitions=0,
            next_review=datetime.utcnow()
        )
        db.add(fc)
        saved.append(fc)
    db.commit()
    return saved


# ─────────────────────────────────────────────────────────────────────────────
# QADAM 2 → QADAM 3: Flashcard natijalaridan Quiz savollari generatsiya
# ─────────────────────────────────────────────────────────────────────────────

async def generate_quiz_from_flashcards(
    flashcards: list[dict],
    topic: str,
    count: int = 5
) -> list[dict]:
    """
    Mavjud flashcardlar asosida test savollari yaratadi.
    Bu 2-qadam (Flashcards) tugagandan keyin chaqiriladi.
    """
    fc_text = "\n".join(
        f"Savol: {fc['front']}\nJavob: {fc['back']}"
        for fc in flashcards[:10]
    )

    prompt = f"""Sen tajribali o'qituvchisan. Quyidagi flashcardlar asosida {count} ta test savoli yarat.
    
Flashcardlar:
{fc_text}

Mavzu: {topic}

Har bir savol uchun 4 ta variant, 1 ta to'g'ri javob va tushuntirish kerak.

Faqat JSON massiv qaytargin:
[
  {{
    "question": "Savol matni",
    "options": ["A variant", "B variant", "C variant", "D variant"],
    "correct": 0,
    "explanation": "Tushuntirish"
  }},
  ...
]"""

    try:
        response = await gemini_model.generate_content_async(
            prompt,
            generation_config=genai.types.GenerationConfig(
                max_output_tokens=3000,
                response_mime_type="application/json"
            )
        )
        content = response.text.strip()
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
        return json.loads(content)
    except Exception:
        # Fallback: flashcardlardan oddiy savollar
        questions = []
        for i, fc in enumerate(flashcards[:count]):
            questions.append({
                "question": fc["front"],
                "options": [
                    fc["back"],
                    "Bu mavzu bilan bog'liq emas",
                    "Boshqa bir tushuncha",
                    "Noto'g'ri ta'rif"
                ],
                "correct": 0,
                "explanation": f"To'g'ri javob: {fc['back']}"
            })
        return questions


# ─────────────────────────────────────────────────────────────────────────────
# QADAM 3 → QADAM 4: Quiz natijasini SM-2 algoritmga uzatish
# ─────────────────────────────────────────────────────────────────────────────

def quiz_score_to_sm2_quality(score_percent: float) -> int:
    """
    Quiz natijasini (0-100%) SM-2 quality (0-5) ga aylantiradi.
    
    SM-2 quality:
      0 = umuman bilmadi (complete blackout)
      1 = deyarli bilmadi
      2 = qiyin esladi
      3 = qiyin, lekin to'g'ri
      4 = kichik xato bilan
      5 = juda yaxshi bildi
    """
    if score_percent >= 95:
        return 5
    elif score_percent >= 80:
        return 4
    elif score_percent >= 65:
        return 3
    elif score_percent >= 50:
        return 2
    elif score_percent >= 30:
        return 1
    else:
        return 0


def apply_quiz_result_to_cards(
    db: Session,
    student_id: int,
    quiz_results: list[dict],
    flashcard_ids: list[int]
) -> list[dict]:
    """
    Quiz javoblariga qarab SM-2 algoritmini har bir kartaga qo'llaydi.
    Quiz natijasi → SM-2 → keyingi takrorlash sanasi.
    
    quiz_results: [{"card_index": 0, "is_correct": True, "time_ms": 5000}, ...]
    flashcard_ids: SM-2 qo'llaniladigan FlashCard ID lari
    """
    updates = []

    for result in quiz_results:
        idx = result.get("card_index", 0)
        if idx >= len(flashcard_ids):
            continue

        fc_id = flashcard_ids[idx]
        fc = db.query(FlashCard).filter(
            FlashCard.id == fc_id,
            FlashCard.student_id == student_id
        ).first()

        if not fc:
            continue

        is_correct = result.get("is_correct", False)
        time_ms = result.get("time_ms", 10000)
        time_limit_ms = 30000  # 30 soniya standart

        # Tezlikka asoslangan quality
        if is_correct:
            time_ratio = min(1.0, time_ms / time_limit_ms)
            if time_ratio < 0.3:
                quality = 5  # Juda tez va to'g'ri
            elif time_ratio < 0.6:
                quality = 4
            else:
                quality = 3
        else:
            quality = 1  # Noto'g'ri

        # SM-2 qo'llash
        _apply_sm2_to_flashcard(fc, quality)
        updates.append({
            "flashcard_id": fc_id,
            "quality": quality,
            "next_review": fc.next_review.isoformat(),
            "interval_days": fc.interval
        })

    db.commit()
    return updates


def _apply_sm2_to_flashcard(fc: FlashCard, quality: int) -> FlashCard:
    """SM-2 algoritmini FlashCard modeline qo'llaydi."""
    if quality < 3:
        fc.repetitions = 0
        fc.interval = 1
    else:
        if fc.repetitions == 0:
            fc.interval = 1
        elif fc.repetitions == 1:
            fc.interval = 6
        else:
            fc.interval = round(fc.interval * fc.ease_factor)
        fc.repetitions += 1

    # Ease Factor yangilash
    fc.ease_factor = max(
        1.3,
        fc.ease_factor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)
    )
    fc.next_review = datetime.utcnow() + timedelta(days=fc.interval)
    return fc


# ─────────────────────────────────────────────────────────────────────────────
# QADAM 4 → QADAM 5: Progress yangilash va Achievement tekshirish
# ─────────────────────────────────────────────────────────────────────────────

def update_student_progress(
    db: Session,
    student_id: int,
    subject: str,
    topic: str,
    quiz_score_percent: float,
    cards_studied: int
) -> dict:
    """
    SM-2 natijasidan keyin StudentProgress ni yangilaydi.
    """
    progress = db.query(StudentProgress).filter(
        StudentProgress.student_id == student_id,
        StudentProgress.subject == subject,
        StudentProgress.topic == topic
    ).first()

    if not progress:
        progress = StudentProgress(
            student_id=student_id,
            subject=subject,
            topic=topic,
            mastery_level=0.0,
            sessions_count=0
        )
        db.add(progress)

    # Mastery darajasini yangilash (eski + yangi o'rtacha)
    old_mastery = progress.mastery_level
    # Weighted average: yangi sessiya 30% ta'sir qiladi
    progress.mastery_level = min(100.0, old_mastery * 0.7 + quiz_score_percent * 0.3)
    progress.sessions_count += 1
    progress.last_studied = datetime.utcnow()

    # Zaif va kuchli tomonlarni yangilash
    weak = json.loads(progress.weak_points or "[]")
    strong = json.loads(progress.strong_points or "[]")

    if quiz_score_percent < 60 and topic not in weak:
        weak.append(topic)
        if topic in strong:
            strong.remove(topic)
    elif quiz_score_percent >= 80 and topic not in strong:
        strong.append(topic)
        if topic in weak:
            weak.remove(topic)

    progress.weak_points = json.dumps(weak[:10])   # max 10 ta
    progress.strong_points = json.dumps(strong[:10])

    db.commit()
    db.refresh(progress)

    return {
        "mastery_level": round(progress.mastery_level, 1),
        "sessions_count": progress.sessions_count,
        "weak_points": weak,
        "strong_points": strong,
        "improvement": round(progress.mastery_level - old_mastery, 1)
    }


def check_and_grant_achievements(
    db: Session,
    student_id: int,
    quiz_score_percent: float,
    sessions_count: int,
    mastery_level: float,
    cards_count: int
) -> list[dict]:
    """
    Natijaga qarab achievement beradi.
    Bu 5-qadam — zanjirning oxiri.
    """
    granted = []
    now = datetime.utcnow()

    # Achievement shartlari
    ACHIEVEMENT_CONDITIONS = [
        {
            "code": "first_session",
            "title": "Birinchi qadam! 🚀",
            "description": "Birinchi o'quv sessiyangizni tugatdingiz",
            "icon": "🚀",
            "xp": 50,
            "condition": lambda: sessions_count >= 1
        },
        {
            "code": "quiz_ace",
            "title": "Bilimdon! 🏆",
            "description": "Testda 90% dan yuqori ball oldingiz",
            "icon": "🏆",
            "xp": 100,
            "condition": lambda: quiz_score_percent >= 90
        },
        {
            "code": "perfectionist",
            "title": "Mukammal! ⭐",
            "description": "Testda 100% ball oldingiz",
            "icon": "⭐",
            "xp": 200,
            "condition": lambda: quiz_score_percent >= 100
        },
        {
            "code": "mastery_50",
            "title": "Yarim yo'l! 💪",
            "description": "Mavzuni 50% darajada o'zlashtirdingiz",
            "icon": "💪",
            "xp": 75,
            "condition": lambda: mastery_level >= 50
        },
        {
            "code": "mastery_80",
            "title": "Ustoz darajasi! 🎓",
            "description": "Mavzuni 80% darajada o'zlashtirdingiz",
            "icon": "🎓",
            "xp": 150,
            "condition": lambda: mastery_level >= 80
        },
        {
            "code": "card_collector_10",
            "title": "Kollektor! 🃏",
            "description": "10 ta flashcard yaratdingiz",
            "icon": "🃏",
            "xp": 60,
            "condition": lambda: cards_count >= 10
        },
        {
            "code": "five_sessions",
            "title": "Doimiy o'quvchi! 📚",
            "description": "5 ta o'quv sessiyani tugatdingiz",
            "icon": "📚",
            "xp": 120,
            "condition": lambda: sessions_count >= 5
        },
    ]

    for ach_def in ACHIEVEMENT_CONDITIONS:
        if not ach_def["condition"]():
            continue

        # Achievement mavjudligini tekshirish
        existing = db.query(Achievement).filter(
            Achievement.code == ach_def["code"]
        ).first()

        if not existing:
            existing = Achievement(
                code=ach_def["code"],
                title=ach_def["title"],
                description=ach_def["description"],
                icon=ach_def["icon"],
                xp_reward=ach_def["xp"],
                condition=json.dumps({"auto": True})
            )
            db.add(existing)
            db.flush()

        # Talabaga berilganmi tekshirish
        already_earned = db.query(UserAchievement).filter(
            UserAchievement.user_id == student_id,
            UserAchievement.achievement_id == existing.id
        ).first()

        if not already_earned:
            ua = UserAchievement(
                user_id=student_id,
                achievement_id=existing.id,
                earned_at=now
            )
            db.add(ua)
            granted.append({
                "code": ach_def["code"],
                "title": ach_def["title"],
                "description": ach_def["description"],
                "icon": ach_def["icon"],
                "xp": ach_def["xp"]
            })

    if granted:
        db.commit()

    return granted


# ─────────────────────────────────────────────────────────────────────────────
# TO'LIQ ZANJIR: Bir API chaqiruvi bilan barcha qadamlar
# ─────────────────────────────────────────────────────────────────────────────

async def complete_learning_chain(
    db: Session,
    student_id: int,
    topic: str,
    subject: str,
    quiz_results: list[dict],   # [{"card_index": 0, "is_correct": True, "time_ms": 5000}, ...]
    flashcard_ids: list[int],   # Avvalgi sessiyada yaratilgan flashcard IDlar
    lesson_id: Optional[int] = None
) -> dict:
    """
    To'liq o'quv zanjirini bajaradi:
    Quiz natijasi → SM-2 → Progress → Achievement
    
    Returns: barcha qadamlarning natijasi (frontend uchun)
    """
    # 1. Quiz natijasini hisoblash
    total = len(quiz_results)
    correct = sum(1 for r in quiz_results if r.get("is_correct", False))
    score_percent = round((correct / max(total, 1)) * 100, 1)

    # 2. SM-2 algoritmini qo'llash (quiz natijasiga qarab)
    sm2_updates = []
    if flashcard_ids:
        sm2_updates = apply_quiz_result_to_cards(
            db, student_id, quiz_results, flashcard_ids
        )

    # 3. Jami kartalar sonini olish
    total_cards = db.query(FlashCard).filter(
        FlashCard.student_id == student_id
    ).count()

    # 4. StudentProgress yangilash
    progress_data = update_student_progress(
        db, student_id, subject, topic,
        score_percent, total
    )

    # 5. Achievement tekshirish
    new_achievements = check_and_grant_achievements(
        db,
        student_id=student_id,
        quiz_score_percent=score_percent,
        sessions_count=progress_data["sessions_count"],
        mastery_level=progress_data["mastery_level"],
        cards_count=total_cards
    )

    return {
        "quiz_score": score_percent,
        "correct_answers": correct,
        "total_questions": total,
        "sm2_updates": sm2_updates,
        "progress": progress_data,
        "new_achievements": new_achievements,
        "next_review_cards": [
            u for u in sm2_updates if u["interval_days"] == 1
        ],
        "message": _generate_completion_message(score_percent, progress_data["improvement"])
    }


def _generate_completion_message(score_percent: float, improvement: float) -> str:
    if score_percent >= 90:
        return "Ajoyib! Siz bu mavzuni juda yaxshi o'zlashtirdingiz! 🏆"
    elif score_percent >= 70:
        return f"Yaxshi natija! Bilimingiz {improvement:+.1f}% oshdi. Davom eting! 💪"
    elif score_percent >= 50:
        return "O'rtacha natija. Flashcardlarni yana bir marta ko'rib chiqing va qayta sinab ko'ring! 📚"
    else:
        return "Qiyin bo'ldi, lekin bu ham o'rganish! AI usto bilan boshlang va yana sinab ko'ring. 🚀"
