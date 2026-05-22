import os
import json
import redis
from celery_app import celery_app
from PyPDF2 import PdfReader
import docx
from pptx import Presentation
import pytesseract
from pdf2image import convert_from_path
from anthropic import Anthropic
import asyncio

redis_client = redis.Redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379/0"), decode_responses=True)
anthropic_client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

def update_progress(material_id: str, stage: str, percent: int, message: str):
    redis_client.set(f"material_progress:{material_id}", json.dumps({
        "stage": stage,
        "percent": percent,
        "message": message
    }))

def extract_text(file_path: str, ext: str) -> str:
    text = ""
    try:
        if ext == ".pdf":
            reader = PdfReader(file_path)
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
            
            # Agar text chiqmasa, OCR ishlatamiz (scanned PDF)
            if len(text.strip()) < 50:
                images = convert_from_path(file_path)
                for img in images:
                    text += pytesseract.image_to_string(img) + "\n"
                    
        elif ext == ".docx":
            doc = docx.Document(file_path)
            for para in doc.paragraphs:
                text += para.text + "\n"
                
        elif ext == ".pptx":
            prs = Presentation(file_path)
            for slide in prs.slides:
                for shape in slide.shapes:
                    if hasattr(shape, "text"):
                        text += shape.text + "\n"
                        
        elif ext == ".txt":
            with open(file_path, "r", encoding="utf-8") as f:
                text = f.read()
    except Exception as e:
        raise Exception(f"Extract xatosi: {str(e)}")
        
    return text

def chunk_text(text: str, max_tokens: int = 3000, overlap: int = 200) -> list[str]:
    # Juda sodda chunking (aslida tokenizator ishlatish kerak)
    # 1 token o'rtacha 4 ta belgi deb olamiz
    chunk_size = max_tokens * 4
    overlap_size = overlap * 4
    
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start += chunk_size - overlap_size
    return chunks

def analyze_chunk_with_ai(chunk: str) -> str:
    prompt = f"""
Iltimos, quyidagi ta'lim materialining matn qismini tahlil qiling:
{chunk}

Eng muhim tushunchalarni ajratib oling.
"""
    response = anthropic_client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=1000,
        messages=[{"role": "user", "content": prompt}]
    )
    return response.content[0].text

def synthesize_with_ai(chunk_analyses: list[str]) -> dict:
    combined_text = "\\n---\\n".join(chunk_analyses)
    
    prompt = f"""
Sen professioanl AI ustozi va darslik tuzuvchisan. Quyiagi material analizini birlashtirib, aniq JSON formatida qaytar:

Birlashgan Analizlar:
{combined_text}

JSON strukturasi xuddi shunday bo'lishi shart:
{{
  "title": "Mavzu nomi",
  "subject": "Fan",
  "level": "Kurs",
  "total_pages": 10,
  "main_topics": [
    {{"title": "Mavzu 1", "subtopics": [], "key_concepts": [], "definitions": [], "formulas": [], "examples": []}}
  ],
  "suggested_lesson_plan": [
    {{"lesson_number": 1, "title": "Dars 1", "topics": [], "duration_minutes": 80}}
  ],
  "difficulty_distribution": {{"easy": 40, "medium": 40, "hard": 20}},
  "key_terms_glossary": [{{"term": "Atama", "definition": "Ma'nosi"}}],
  "wow_facts": ["Fakt 1"],
  "exam_likely_topics": ["Imtihonga tushishi mumkin mavzu"]
}}
Qat'iy ravishda faqat JSON yubor! Hech qanday qo'shimcha matn qo'shma.
"""
    response = anthropic_client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=4000,
        messages=[{"role": "user", "content": prompt}]
    )
    
    try:
        content = response.content[0].text
        # Cleanup json formatting if any
        if content.startswith("```json"):
            content = content[7:-3]
        return json.loads(content)
    except Exception as e:
        raise Exception(f"AI JSON formatlash xatosi: {str(e)}")


@celery_app.task(bind=True, name="services.material_parser.process_material_task")
def process_material_task(self, material_id: str, professor_id: int, object_name: str, file_path: str, ext: str):
    try:
        # 1. Extraction
        update_progress(material_id, "extracting", 10, "Matn ajratib olinmoqda...")
        text = extract_text(file_path, ext)
        
        # 2. Chunking
        chunks = chunk_text(text)
        
        # 3. Analyzing chunks
        update_progress(material_id, "analyzing", 30, f"{len(chunks)} ta qism AI orqali tahlil qilinmoqda...")
        chunk_analyses = []
        for i, chunk in enumerate(chunks):
            analysis = analyze_chunk_with_ai(chunk)
            chunk_analyses.append(analysis)
            progress = 30 + int(40 * ((i + 1) / len(chunks)))
            update_progress(material_id, "analyzing", progress, f"{i+1}/{len(chunks)} qism tahlil qilindi.")
            
        # 4. Synthesis
        update_progress(material_id, "generating", 80, "Tahlillar birlashtirilib, reja tuzilmoqda...")
        final_json = synthesize_with_ai(chunk_analyses)
        
        # 5. DB ga saqlash
        update_progress(material_id, "generating", 90, "Darslar, Flashcardlar va Testlar generatsiyasi...")
        
        from database import SessionLocal
        from models.lesson import Lesson
        from models.flashcard import FlashCard
        from models.question import Question, QuestionType
        from datetime import datetime

        db = SessionLocal()
        try:
            # Darsni yaratish
            title = final_json.get("title", "Yangi dars")
            subject = final_json.get("subject", "Umumiy")
            wow_facts = final_json.get("wow_facts", [])
            wow_fact = wow_facts[0] if wow_facts else "Fakt topilmadi"
            
            lesson = Lesson(
                title=title,
                topic=subject,
                content=json.dumps(final_json),
                wow_fact=wow_fact,
                professor_id=professor_id,
                created_at=datetime.utcnow()
            )
            db.add(lesson)
            db.commit()
            db.refresh(lesson)

            # Glossary asosida Flashcardlar yaratish
            glossary = final_json.get("key_terms_glossary", [])
            for term in glossary:
                fc = FlashCard(
                    question=term.get("term", ""),
                    answer=term.get("definition", ""),
                    lesson_id=lesson.id,
                    student_id=professor_id, # Actually professor creates them
                    subject=subject,
                    tags=json.dumps([subject]),
                    difficulty=2.5,
                    ease_factor=2.5,
                    interval=1,
                    repetitions=0,
                    next_review=datetime.utcnow()
                )
                db.add(fc)

            # Testlar generatsiyasi
            q = Question(
                lesson_id=lesson.id,
                question=f"{title} mavzusidagi eng muhim qism nima?",
                type=QuestionType.multiple_choice,
                options=["Bilmadim", "Muhim", "Soha", "Asosiy tushuncha"],
                correct="Asosiy tushuncha",
                points=100,
                time_limit=30,
                explanation="Har bir fanda asosiy tushuncha muhim."
            )
            db.add(q)
            db.commit()

        except Exception as db_e:
            db.rollback()
            raise Exception(f"DB xatosi: {str(db_e)}")
        finally:
            db.close()
            
        # Tugatish
        update_progress(material_id, "done", 100, "Muvaffaqiyatli yakunlandi!")
        
        # Clean temp file
        if os.path.exists(file_path):
            os.remove(file_path)
            
        return final_json

    except Exception as e:
        update_progress(material_id, "error", 0, f"Xatolik: {str(e)}")
        raise e
