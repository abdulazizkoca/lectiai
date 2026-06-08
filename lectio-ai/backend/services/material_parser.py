"""
material_parser.py — DOCX/PDF/PPTX/TXT → Gemini AI → To'liq dars
=================================================================
Ish jarayoni:
  1. Fayldan matn ajratib olinadi
  2. Gemini mavzular ro'yxatini chiqaradi (yoki regex fallback)
  3. Tanlangan mavzu bo'yicha Gemini to'liq dars yaratadi:
     - title, subject, summary, wow_facts
     - slides (prezentatsiya)
     - quiz (test savollar)
     - flashcards (kartochkalar)
     - key_terms_glossary
     - exam_likely_topics
     - practice_questions
     - main_topics
     - suggested_lesson_plan
  4. Natija DB ga saqlanadi + in-memory/Redis store ga
"""

import os
import json
import re
import threading
import time
import logging
from typing import Optional

# ── fayl kutubxonalari ────────────────────────────────────────
try:
    from PyPDF2 import PdfReader
    HAS_PDF = True
except ImportError:
    HAS_PDF = False

try:
    import docx as python_docx
    HAS_DOCX = True
except ImportError:
    HAS_DOCX = False

try:
    from pptx import Presentation
    HAS_PPTX = True
except ImportError:
    HAS_PPTX = False

# ── Gemini ────────────────────────────────────────────────────
import google.generativeai as genai

_gemini_key = os.getenv("GEMINI_API_KEY", "")
if _gemini_key:
    genai.configure(api_key=_gemini_key)

logger = logging.getLogger("lectio.material_parser")


def _get_model():
    """Har safar yangi model olish — thread-safe"""
    if not _gemini_key:
        raise RuntimeError("GEMINI_API_KEY sozlanmagan. .env fayliga qo'shing.")
    return genai.GenerativeModel("gemini-1.5-pro")


# ── Redis / In-memory store ───────────────────────────────────
_memory_store: dict = {}
_redis_client = None
_use_redis = False

try:
    import redis as _redis_lib
    _rc = _redis_lib.Redis.from_url(
        os.getenv("REDIS_URL", "redis://localhost:6379/0"),
        decode_responses=True,
        socket_connect_timeout=2,
        socket_timeout=2,
    )
    _rc.ping()
    _redis_client = _rc
    _use_redis = True
    logger.info("[material_parser] Redis: ulandi ✓")
except Exception:
    logger.info("[material_parser] Redis yo'q — xotirada saqlanadi")


def _store_set(key: str, value: str):
    if _use_redis and _redis_client:
        try:
            _redis_client.setex(key, 7200, value)   # 2 soat TTL
            return
        except Exception:
            pass
    _memory_store[key] = value


def _store_get(key: str) -> Optional[str]:
    if _use_redis and _redis_client:
        try:
            return _redis_client.get(key)
        except Exception:
            pass
    return _memory_store.get(key)


# ── Progress ──────────────────────────────────────────────────
def update_progress(material_id: str, stage: str, percent: int, message: str):
    _store_set(
        f"material_progress:{material_id}",
        json.dumps({"stage": stage, "percent": percent, "message": message}),
    )


def get_progress(material_id: str) -> Optional[dict]:
    raw = _store_get(f"material_progress:{material_id}")
    return json.loads(raw) if raw else None


def get_topics(material_id: str) -> Optional[dict]:
    raw = _store_get(f"material_topics:{material_id}")
    return json.loads(raw) if raw else None


def get_lesson_result(material_id: str) -> Optional[dict]:
    raw = _store_get(f"material_lesson_result:{material_id}")
    return json.loads(raw) if raw else None


# ── Matn ajratish ─────────────────────────────────────────────
def extract_text(file_path: str, ext: str) -> str:
    """Fayl turini aniqlab, matni ajratib oladi."""
    text = ""
    ext = ext.lower()

    try:
        if ext == ".pdf":
            if not HAS_PDF:
                raise RuntimeError("PyPDF2 o'rnatilmagan")
            reader = PdfReader(file_path)
            for page in reader.pages:
                t = page.extract_text()
                if t:
                    text += t + "\n"
            # Skanerlangan PDF uchun OCR
            if len(text.strip()) < 100:
                try:
                    from pdf2image import convert_from_path
                    import pytesseract
                    for img in convert_from_path(file_path):
                        text += pytesseract.image_to_string(img, lang="uzb+rus+eng") + "\n"
                except Exception as ocr_e:
                    logger.warning(f"OCR xatosi: {ocr_e}")

        elif ext == ".docx":
            if not HAS_DOCX:
                raise RuntimeError("python-docx o'rnatilmagan")
            d = python_docx.Document(file_path)
            # Sarlavha darajalari ham saqlanadi
            for para in d.paragraphs:
                if para.text.strip():
                    prefix = ""
                    if para.style.name.startswith("Heading"):
                        level = para.style.name.replace("Heading ", "").strip()
                        prefix = "#" * (int(level) if level.isdigit() else 1) + " "
                    text += prefix + para.text.strip() + "\n"
            # Jadvallar ichidagi matnlar
            for table in d.tables:
                for row in table.rows:
                    row_text = " | ".join(c.text.strip() for c in row.cells if c.text.strip())
                    if row_text:
                        text += row_text + "\n"

        elif ext == ".pptx":
            if not HAS_PPTX:
                raise RuntimeError("python-pptx o'rnatilmagan")
            prs = Presentation(file_path)
            for i, slide in enumerate(prs.slides, 1):
                text += f"\n--- Slayd {i} ---\n"
                for shape in slide.shapes:
                    if hasattr(shape, "text") and shape.text.strip():
                        text += shape.text.strip() + "\n"

        elif ext == ".txt":
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                text = f.read()
        else:
            raise ValueError(f"Noma'lum fayl turi: {ext}")

    except Exception as e:
        raise RuntimeError(f"Fayl o'qishda xatolik ({ext}): {e}")

    if len(text.strip()) < 20:
        raise RuntimeError(
            "Fayldan matn ajratib bo'lmadi — fayl bo'sh yoki skanerlangan. "
            "Matn asosida saqlangan hujjat yuboring."
        )

    return text.strip()


# ── Mavzular ajratish (AI + fallback) ────────────────────────
def extract_topics_from_text(text: str) -> list:
    """Gemini yordamida mavzular ro'yxatini chiqaradi."""
    # Birinchi 25000 belgi (sarlavhalar ko'pincha boshida)
    chunk = text[:25000]

    prompt = f"""Quyidagi ta'lim matni (darslik, metodichka yoki o'quv qo'llanma).
Barcha mavzular / bo'limlar ro'yxatini chiqar.

MUHIM:
- Har bir mavzu alohida element bo'lsin
- Qisqa, aniq sarlavhalar (3-80 ta belgi)
- Raqamlar yoki belgilarni olib tashlama
- Kamida 3, ko'pi bilan 40 ta mavzu
- Faqat JSON qaytargin

Format:
{{"topics": ["1. Kirish", "2. Asosiy tushunchalar", "3. Amaliy misol"]}}

Matn:
{chunk}"""

    try:
        model = _get_model()
        resp = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                response_mime_type="application/json",
                max_output_tokens=2000,
                temperature=0.2,
            ),
        )
        raw = resp.text.strip()
        # JSON tozalash
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)
        data = json.loads(raw)
        topics = data.get("topics", [])
        if isinstance(topics, list) and len(topics) >= 2:
            # Tozalash
            topics = [str(t).strip() for t in topics if str(t).strip()]
            return topics[:40]
        logger.warning("[topics] AI bo'sh natija qaytardi, fallback ishlatilyapti")
    except Exception as e:
        logger.error(f"[topics] Gemini xatosi: {e}")

    return _fallback_extract_topics(text)


def _fallback_extract_topics(text: str) -> list:
    """Regex asosida mavzular ajratish."""
    lines = text.splitlines()
    topics = []

    # 1. Raqamlangan ro'yxat (1. 2) 3- va h.k.)
    num_pattern = re.compile(r"^(\d{1,2}[.):\s]\s*.{5,80})$")
    for line in lines:
        m = num_pattern.match(line.strip())
        if m:
            topics.append(m.group(1).strip())
        if len(topics) >= 30:
            break

    if len(topics) >= 3:
        return topics

    # 2. Sarlavha belgilari (# ## ###)
    for line in lines:
        if line.startswith("#") and 5 < len(line.strip()) < 100:
            topics.append(line.lstrip("#").strip())
        if len(topics) >= 30:
            break

    if len(topics) >= 2:
        return topics

    # 3. KATTA HARF bilan yozilgan qatorlar
    for line in lines:
        stripped = line.strip()
        if stripped.isupper() and 5 < len(stripped) < 80:
            topics.append(stripped.title())
        if len(topics) >= 20:
            break

    if len(topics) >= 2:
        return topics

    # 4. ":" bilan tugagan qatorlar
    for line in lines:
        stripped = line.strip()
        if stripped.endswith(":") and 5 < len(stripped) < 80:
            topics.append(stripped[:-1])
        if len(topics) >= 20:
            break

    if topics:
        return topics

    # 5. Birinchi 10 ta bo'sh bo'lmagan qatorni mavzu sifatida
    first_lines = [l.strip() for l in lines if l.strip() and len(l.strip()) > 5][:10]
    if first_lines:
        return first_lines

    raise RuntimeError(
        "Mavzular topilmadi. Matnda sarlavha yoki raqamlangan ro'yxat bo'lishi kerak."
    )


# ── To'liq dars yaratish (AI) ────────────────────────────────
def synthesize_full_lesson(text: str, topic_name: str, professor_id: int) -> dict:
    """
    Berilgan matn va mavzu bo'yicha to'liq dars paketi yaratadi.
    Qaytaruvchi struktura create-lesson sahifasi bilan mos keladi.
    """
    # Mavzuga oid qismni ajratish (first 60k chars)
    chunk = text[:60000]

    prompt = f"""Sen professional O'zbekiston universiteti o'qituvchisi va AI usto darslik yaratuvchisan.

VAZIFA: Quyidagi matndan "{topic_name}" mavzusiga tegishli qismni topib, mukammal dars paketi yarat.

MATN:
{chunk}

TO'LIQ dars paketini QAT'IY JSON formatida yubor. Boshqa hech narsa yozma.

JSON strukturasi (barcha maydonlar to'ldirilishi SHART):
{{
  "title": "{topic_name}",
  "subject": "Fan nomi (masalan: Informatika, Fizika, Matematika...)",
  "level": "Kurs yoki daraja (masalan: Bakalavr 2-kurs)",
  "summary": "Mavzu haqida 3-5 gap qisqacha xulosa. O'zbekiston universitetlari uchun moslashtirilgan.",
  "wow_facts": [
    "Bu mavzu bilan bog'liq hayratlanarli fakt 1",
    "Bu mavzu bilan bog'liq hayratlanarli fakt 2",
    "Bu mavzu bilan bog'liq hayratlanarli fakt 3"
  ],
  "slides": [
    {{
      "id": 1,
      "slide_number": 1,
      "title": "Kirish: {topic_name}",
      "content": "Bu slaydning batafsil mazmuni. Kamida 3 gap.",
      "notes": "Professor uchun eslatma: bu qismda nima aytish kerak.",
      "duration_min": 5
    }},
    {{
      "id": 2,
      "slide_number": 2,
      "title": "Asosiy tushunchalar",
      "content": "Mavzuning asosiy tushunchalari va ta'riflari.",
      "notes": "Misol keltiring.",
      "duration_min": 10
    }},
    {{
      "id": 3,
      "slide_number": 3,
      "title": "Amaliy misol",
      "content": "Amaliy misol va tahlil.",
      "notes": "Talabalardan savol so'rang.",
      "duration_min": 10
    }},
    {{
      "id": 4,
      "slide_number": 4,
      "title": "Mustahkamlash",
      "content": "Asosiy fikrlar xulosasi va test savollari.",
      "notes": "Quiz vaqti.",
      "duration_min": 5
    }}
  ],
  "quiz": [
    {{
      "question": "Savol matni (aniq va tushunarli)?",
      "options": ["A) To'g'ri javob", "B) Noto'g'ri variant", "C) Boshqa variant", "D) Noto'g'ri variant 2"],
      "correct": "A",
      "explanation": "To'g'ri javob izohlanishi.",
      "time_limit": 20,
      "points": 1000
    }},
    {{
      "question": "Ikkinchi savol?",
      "options": ["A) Variant 1", "B) To'g'ri javob", "C) Variant 3", "D) Variant 4"],
      "correct": "B",
      "explanation": "Ikkinchi savol izohi.",
      "time_limit": 25,
      "points": 1000
    }},
    {{
      "question": "Uchinchi savol?",
      "options": ["A) Variant", "B) Variant", "C) To'g'ri", "D) Variant"],
      "correct": "C",
      "explanation": "Uchinchi savol izohi.",
      "time_limit": 20,
      "points": 1000
    }},
    {{
      "question": "To'rtinchi savol?",
      "options": ["A) Variant", "B) Variant", "C) Variant", "D) To'g'ri"],
      "correct": "D",
      "explanation": "To'rtinchi savol izohi.",
      "time_limit": 20,
      "points": 1000
    }},
    {{
      "question": "Beshinchi savol?",
      "options": ["A) To'g'ri", "B) Variant", "C) Variant", "D) Variant"],
      "correct": "A",
      "explanation": "Beshinchi savol izohi.",
      "time_limit": 30,
      "points": 1200
    }}
  ],
  "flashcards": [
    {{"front": "Atama yoki tushuncha", "back": "Ta'rif yoki izoh (to'liq)"}},
    {{"front": "Ikkinchi atama", "back": "Ikkinchi ta'rif"}},
    {{"front": "Uchinchi atama", "back": "Uchinchi ta'rif"}},
    {{"front": "To'rtinchi atama", "back": "To'rtinchi ta'rif"}},
    {{"front": "Beshinchi atama", "back": "Beshinchi ta'rif"}}
  ],
  "main_topics": [
    {{
      "title": "Kichik mavzu 1",
      "subtopics": ["Kichik mavzu 1.1", "Kichik mavzu 1.2"],
      "key_concepts": ["Tushuncha 1", "Tushuncha 2"],
      "definitions": [{{"term": "Atama", "definition": "Ta'rif"}}],
      "formulas": ["Formula yoki qoida (agar bo'lsa)"],
      "examples": ["Amaliy misol"]
    }}
  ],
  "suggested_lesson_plan": [
    {{"lesson_number": 1, "title": "1-dars sarlavhasi", "topics": ["mavzu 1", "mavzu 2"], "duration_minutes": 45}},
    {{"lesson_number": 2, "title": "2-dars sarlavhasi", "topics": ["mavzu 3"], "duration_minutes": 45}}
  ],
  "difficulty_distribution": {{"easy": 30, "medium": 50, "hard": 20}},
  "key_terms_glossary": [
    {{"term": "Birinchi atama", "definition": "To'liq ta'rif"}},
    {{"term": "Ikkinchi atama", "definition": "To'liq ta'rif"}},
    {{"term": "Uchinchi atama", "definition": "To'liq ta'rif"}},
    {{"term": "To'rtinchi atama", "definition": "To'liq ta'rif"}},
    {{"term": "Beshinchi atama", "definition": "To'liq ta'rif"}}
  ],
  "exam_likely_topics": [
    "Imtihonda chiqishi mumkin bo'lgan 1-mavzu",
    "Imtihonda chiqishi mumkin bo'lgan 2-mavzu",
    "Imtihonda chiqishi mumkin bo'lgan 3-mavzu",
    "Imtihonda chiqishi mumkin bo'lgan 4-mavzu",
    "Imtihonda chiqishi mumkin bo'lgan 5-mavzu"
  ],
  "practice_questions": [
    {{"question": "Amaliy savol 1?", "answer": "To'liq javob 1", "type": "short_answer"}},
    {{"question": "Amaliy savol 2?", "answer": "To'liq javob 2", "type": "short_answer"}},
    {{"question": "Amaliy savol 3?", "answer": "To'liq javob 3", "type": "short_answer"}}
  ],
  "total_pages": 10
}}

ESLATMALAR:
- Barcha matnlar O'ZBEK tilida bo'lsin
- Matndan olingan haqiqiy ma'lumotlardan foydalanin
- Har bir slide kamida 2-3 gap bo'lsin
- Quiz savollar haqiqiy materialga asoslangan bo'lsin
- Faqat JSON qaytargin, boshqa hech narsa yozma"""

    try:
        model = _get_model()
        resp = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                response_mime_type="application/json",
                max_output_tokens=8000,
                temperature=0.7,
            ),
        )
        raw = resp.text.strip()
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)
        result = json.loads(raw)

        # Minimal validation
        if not isinstance(result, dict):
            raise ValueError("AI noto'g'ri format qaytardi")

        # Ensure required keys exist
        _ensure_lesson_defaults(result, topic_name)
        return result

    except Exception as e:
        logger.error(f"[lesson] Gemini xatosi: {e}")
        return _fallback_full_lesson(text, topic_name)


def _ensure_lesson_defaults(result: dict, topic_name: str):
    """Kamida minimal struktura bo'lishini ta'minlaydi."""
    if not result.get("title"):
        result["title"] = topic_name
    if not result.get("summary"):
        result["summary"] = f"{topic_name} mavzusining qisqacha xulosasi."
    if not result.get("wow_facts"):
        result["wow_facts"] = [f"{topic_name} bo'yicha qiziqarli fakt!"]
    if not result.get("slides"):
        result["slides"] = _default_slides(topic_name)
    if not result.get("quiz"):
        result["quiz"] = _default_quiz(topic_name)
    if not result.get("flashcards"):
        result["flashcards"] = _default_flashcards(topic_name)
    if not result.get("key_terms_glossary"):
        result["key_terms_glossary"] = [{"term": topic_name, "definition": f"{topic_name} — o'quv materialining asosiy tushunchasi."}]
    if not result.get("exam_likely_topics"):
        result["exam_likely_topics"] = [topic_name, f"{topic_name} asosiy tushunchalari"]
    if not result.get("main_topics"):
        result["main_topics"] = [{"title": topic_name, "subtopics": [], "key_concepts": [], "definitions": [], "formulas": [], "examples": []}]


def _default_slides(topic: str) -> list:
    return [
        {"id": 1, "slide_number": 1, "title": f"Kirish: {topic}", "content": f"Bugungi mavzu: {topic}. Dars maqsadlari va rejasi bilan tanishamiz.", "notes": "Talabalarni mavzu bilan tanishtiring.", "duration_min": 5},
        {"id": 2, "slide_number": 2, "title": "Nazariy asoslar", "content": f"{topic} bo'yicha asosiy nazariy bilimlar va ta'riflar. Muhim tushunchalar va formulalar.", "notes": "Ta'riflarga e'tibor bering.", "duration_min": 15},
        {"id": 3, "slide_number": 3, "title": "Amaliy misollar", "content": f"{topic} ni amalda qo'llash. Misollar, masalalar va yechimlar.", "notes": "Talabalar bilan birga yechsin.", "duration_min": 15},
        {"id": 4, "slide_number": 4, "title": "Xulosa va test", "content": f"Bugungi dars xulosasi. {topic} bo'yicha asosiy fikrlar va test savollari.", "notes": "Quiz o'tkazing.", "duration_min": 10},
    ]


def _default_quiz(topic: str) -> list:
    return [
        {"question": f"{topic} nima?", "options": [f"{topic} — bu ta'lim tushunchasi", "Bu boshqa narsa", "Noto'g'ri ta'rif", "Umuman aloqasiz"], "correct": "A", "explanation": f"{topic} asosiy ta'rifi.", "time_limit": 20, "points": 1000},
        {"question": f"{topic} qayerda qo'llaniladi?", "options": ["Hech qayerda", "Faqat laboratoriyada", "Amaliyotda keng", "Faqat nazariyada"], "correct": "C", "explanation": "Amaliyotda keng qo'llaniladi.", "time_limit": 20, "points": 1000},
        {"question": f"{topic} o'rganish nima uchun muhim?", "options": ["Muhim emas", "Imtihon uchun", "Amaliy ko'nikmalar uchun", "Vaqt o'tkazish uchun"], "correct": "C", "explanation": "Amaliy ko'nikmalar kasb rivojida zarur.", "time_limit": 25, "points": 1000},
    ]


def _default_flashcards(topic: str) -> list:
    return [
        {"front": f"{topic} ta'rifi", "back": f"{topic} — bu o'quv dasturining muhim qismi bo'lib, amaliy va nazariy jihatlarga ega."},
        {"front": f"{topic} xususiyatlari", "back": "Tizimlilik, amaliylik, nazariy asoslanganlik."},
        {"front": f"{topic} qo'llanilishi", "back": "Ilm-fan, texnologiya, sanoat va kundalik hayotda."},
    ]


def _fallback_full_lesson(text: str, topic_name: str) -> dict:
    """Gemini ishlamasa ham to'liq struktura qaytaradi."""
    logger.warning(f"[lesson] Fallback ishlatilmoqda: {topic_name}")
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    lower = topic_name.lower()

    related = [l for l in lines if lower in l.lower()][:20]
    summary_parts = related[:4] if related else lines[:4]
    summary = " ".join(summary_parts)
    if len(summary) > 600:
        summary = summary[:600].rsplit(" ", 1)[0] + "..."

    headings = []
    for l in lines:
        if re.match(r"^(\d+[.):\s]|\#{1,3}\s).{5,80}$", l):
            clean = re.sub(r"^(\d+[.):\s]|\#{1,3}\s)", "", l).strip()
            if clean and len(clean) > 4:
                headings.append(clean)
        if len(headings) >= 6:
            break

    if not headings:
        headings = [topic_name, f"{topic_name} asoslari", f"{topic_name} amaliyoti", f"{topic_name} xulosasi"]

    slides = []
    for i, h in enumerate(headings[:5], 1):
        rel_lines = [l for l in lines if h.lower()[:5] in l.lower()][:3]
        content = " ".join(rel_lines) if rel_lines else f"{h} bo'yicha batafsil ma'lumot va misollar."
        if len(content) > 400:
            content = content[:400] + "..."
        slides.append({"id": i, "slide_number": i, "title": h, "content": content, "notes": f"{h} uchun eslatma.", "duration_min": 10})

    quiz = []
    for i, h in enumerate(headings[:5]):
        letters = ["A", "B", "C", "D"]
        opts = [f"{h} — to'g'ri ta'rif", f"Bu boshqa mavzu bilan bog'liq", f"Noto'g'ri ta'rif", f"Umuman aloqasiz narsa"]
        quiz.append({"question": f"{h} nima?", "options": opts, "correct": "A", "explanation": f"{h} — {topic_name} mavzusining muhim qismi.", "time_limit": 20, "points": 1000})

    flashcards = [{"front": h, "back": f"{h} — {topic_name} fanining asosiy tushunchasi."} for h in headings[:6]]

    glossary = [{"term": h, "definition": f"{h}: {topic_name} bilan bog'liq muhim atama."} for h in headings[:5]]

    return {
        "title": topic_name,
        "subject": "Umumiy fan",
        "level": "Bakalavr",
        "summary": summary or f"{topic_name} mavzusi bo'yicha qisqacha tavsif.",
        "wow_facts": [f"{topic_name} bo'yicha qiziqarli fakt: bu soha zamonaviy texnologiyada keng qo'llaniladi!"],
        "slides": slides or _default_slides(topic_name),
        "quiz": quiz or _default_quiz(topic_name),
        "flashcards": flashcards or _default_flashcards(topic_name),
        "main_topics": [{"title": h, "subtopics": [], "key_concepts": [h], "definitions": [{"term": h, "definition": f"{h} ta'rifi."}], "formulas": [], "examples": [f"{h} misol"]} for h in headings[:4]],
        "suggested_lesson_plan": [{"lesson_number": i + 1, "title": h, "topics": [h], "duration_minutes": 45} for i, h in enumerate(headings[:3])],
        "difficulty_distribution": {"easy": 40, "medium": 40, "hard": 20},
        "key_terms_glossary": glossary,
        "exam_likely_topics": headings[:5],
        "practice_questions": [{"question": f"{h} ni tushuntiring", "answer": f"{h} — {topic_name} bilan bog'liq tushuncha.", "type": "short_answer"} for h in headings[:3]],
        "total_pages": len(lines),
    }


# ── Background thread funksiyalari ────────────────────────────
def run_extract_topics(material_id: str, professor_id: int, file_path: str, ext: str):
    """Fayldan mavzular ajratish (background thread)."""
    try:
        update_progress(material_id, "extracting", 10, "Fayl o'qilmoqda...")
        time.sleep(0.3)

        text = extract_text(file_path, ext)
        char_count = len(text)
        update_progress(material_id, "extracting", 30, f"Matn ajratildi ({char_count:,} belgi). AI tahlil boshlanmoqda...")
        time.sleep(0.3)

        # Matnni keyingi bosqich uchun saqlash
        text_path = file_path + ".extracted.txt"
        with open(text_path, "w", encoding="utf-8") as f:
            f.write(text)

        update_progress(material_id, "analyzing", 55, "AI mavzular ro'yxatini aniqlamoqda...")

        topics = extract_topics_from_text(text)

        update_progress(material_id, "analyzing", 90, f"{len(topics)} ta mavzu topildi!")
        time.sleep(0.3)

        _store_set(f"material_topics:{material_id}", json.dumps({"topics": topics, "text_path": text_path}))
        update_progress(material_id, "done", 100, f"✅ {len(topics)} ta mavzu tayyor! Tanlang va dars yarating.")

        # Asl faylni o'chirish (extracted txt qoladi)
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
        except Exception:
            pass

    except Exception as e:
        logger.error(f"[extract_topics] Xatolik: {e}")
        update_progress(material_id, "error", 0, f"Xatolik: {str(e)}")


def run_generate_lesson(material_id: str, professor_id: int, topic_name: str, text_path: str):
    """Mavzu bo'yicha to'liq dars yaratish (background thread)."""
    lesson_key = material_id + "_lesson"
    try:
        update_progress(lesson_key, "reading", 15, f"'{topic_name}' — matn o'qilmoqda...")
        time.sleep(0.3)

        if not os.path.exists(text_path):
            raise FileNotFoundError(f"Matn fayli topilmadi: {text_path}")

        with open(text_path, "r", encoding="utf-8", errors="ignore") as f:
            text = f.read()

        update_progress(lesson_key, "generating", 35, "Gemini AI dars yaratmoqda (30-60 soniya)...")

        final_json = synthesize_full_lesson(text, topic_name, professor_id)

        update_progress(lesson_key, "saving", 80, "Dars DB va xotiraga saqlanmoqda...")
        time.sleep(0.3)

        # DB ga saqlash (ixtiyoriy — xatolik bo'lsa ham davom etadi)
        _save_to_db(final_json, topic_name, professor_id)

        # Store ga saqlash
        _store_set(
            f"material_lesson_result:{material_id}",
            json.dumps(final_json, ensure_ascii=False),
        )

        slides_count = len(final_json.get("slides", []))
        quiz_count = len(final_json.get("quiz", []))
        flash_count = len(final_json.get("flashcards", []))

        update_progress(
            lesson_key, "done", 100,
            f"✅ Dars tayyor! {slides_count} slayd · {quiz_count} test · {flash_count} karta"
        )

    except Exception as e:
        logger.error(f"[generate_lesson] Xatolik: {e}")
        update_progress(lesson_key, "error", 0, f"Xatolik: {str(e)}")


def _save_to_db(lesson_json: dict, topic_name: str, professor_id: int):
    """DB ga saqlash — xatolik bo'lsa ham dastur to'xtamaydi."""
    try:
        from database import SessionLocal
        from models.lesson import Lesson
        from models.flashcard import FlashCard
        from models.question import Question, QuestionType
        from datetime import datetime

        db = SessionLocal()
        try:
            title = lesson_json.get("title", topic_name)
            subject = lesson_json.get("subject", "Umumiy")
            wow_facts = lesson_json.get("wow_facts", [])
            wow_fact = wow_facts[0] if wow_facts else ""

            lesson = Lesson(
                title=title,
                topic=subject,
                content=json.dumps(lesson_json, ensure_ascii=False),
                wow_fact=wow_fact,
                professor_id=professor_id,
                created_at=datetime.utcnow(),
            )
            db.add(lesson)
            db.commit()
            db.refresh(lesson)
            lesson_json["lesson_id"] = lesson.id  # Frontend uchun

            # Flashcardlar
            for fc_data in lesson_json.get("flashcards", [])[:20]:
                fc = FlashCard(
                    question=fc_data.get("front", ""),
                    answer=fc_data.get("back", ""),
                    lesson_id=lesson.id,
                    student_id=professor_id,
                    subject=subject,
                    tags=json.dumps([subject, topic_name]),
                    difficulty=2.5,
                    ease_factor=2.5,
                    interval=1,
                    repetitions=0,
                    next_review=datetime.utcnow(),
                )
                db.add(fc)

            # Quiz savollar
            for q_data in lesson_json.get("quiz", [])[:10]:
                options = q_data.get("options", [])
                correct_letter = q_data.get("correct", "A")
                # Correct letter → actual answer text
                letters = ["A", "B", "C", "D", "E"]
                correct_idx = letters.index(correct_letter) if correct_letter in letters else 0
                correct_text = ""
                if options and correct_idx < len(options):
                    # Remove letter prefix if present: "A) text" → "text"
                    opt = options[correct_idx]
                    correct_text = re.sub(r"^[A-E][).\s]\s*", "", opt).strip() or opt

                q = Question(
                    lesson_id=lesson.id,
                    question=q_data.get("question", "Savol"),
                    type=QuestionType.multiple_choice,
                    options=[re.sub(r"^[A-E][).\s]\s*", "", o).strip() or o for o in options],
                    correct=correct_text or correct_letter,
                    points=q_data.get("points", 100),
                    time_limit=q_data.get("time_limit", 30),
                    explanation=q_data.get("explanation", ""),
                )
                db.add(q)

            db.commit()
            logger.info(f"[DB] Dars saqlandi: lesson_id={lesson.id}")

        except Exception as db_err:
            db.rollback()
            logger.warning(f"[DB] Saqlashda xatolik (non-fatal): {db_err}")
        finally:
            db.close()

    except Exception as import_err:
        logger.warning(f"[DB] Import xatoligi (non-fatal): {import_err}")


# ── Public API ────────────────────────────────────────────────
def start_extract_topics(material_id: str, professor_id: int, file_path: str, ext: str) -> threading.Thread:
    t = threading.Thread(
        target=run_extract_topics,
        args=(material_id, professor_id, file_path, ext),
        daemon=True,
        name=f"extract-{material_id[:8]}",
    )
    t.start()
    return t


def start_generate_lesson(material_id: str, professor_id: int, topic_name: str, text_path: str) -> threading.Thread:
    t = threading.Thread(
        target=run_generate_lesson,
        args=(material_id, professor_id, topic_name, text_path),
        daemon=True,
        name=f"lesson-{material_id[:8]}",
    )
    t.start()
    return t
