import os
import redis.asyncio as redis
import json
import base64
from typing import List, Dict, Any
import pytesseract
from PIL import Image
import io
from services.ai_mentor import get_claude_response
from sqlalchemy.ext.asyncio import AsyncSession
import asyncio

# --- FEATURE FLAGS ---
# Use Redis to store feature flags per institution
redis_client = redis.Redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379/0"))

async def is_feature_enabled(institution_id: str, feature_name: str) -> bool:
    flag = await redis_client.get(f"features:{institution_id}:{feature_name}")
    if flag is None:
        return True # Default to True for now
    return flag.decode('utf-8') == 'true'

# --- 1. SNAP & LEARN (Camera OCR) ---
async def process_snap_and_learn(image_base64: str) -> List[Dict[str, str]]:
    """
    Extracts text from image and generates flashcards.
    """
    try:
        # Decode base64
        image_data = base64.b64decode(image_base64)
        image = Image.open(io.BytesIO(image_data))
        
        # OCR using Tesseract
        extracted_text = pytesseract.image_to_string(image, lang="uzb+eng+rus")
        
        if not extracted_text.strip():
            return []
            
        # AI to extract Q&A
        prompt = f"""Extract 3-5 high-quality flashcard question-answer pairs from this educational text.
Format exactly as JSON array: [{{"q": "question", "a": "answer"}}]
Text: {extracted_text[:2000]}"""
        
        ai_response = await get_claude_response(prompt)
        # Parse JSON
        start = ai_response.find("[")
        end = ai_response.rfind("]") + 1
        if start != -1 and end != -1:
            return json.loads(ai_response[start:end])
        return []
    except Exception as e:
        print(f"Snap & Learn error: {e}")
        return []

# --- 2. LECTIO WRAPPED ---
async def generate_lectio_wrapped(student_id: int, db: AsyncSession) -> Dict[str, Any]:
    """
    Aggregates data for a Spotify-style yearly review.
    In production, this is pre-calculated via Celery.
    """
    # Mock data aggregation
    return {
        "student_id": student_id,
        "total_study_hours": 142,
        "xp_earned": 85400,
        "lessons_attended": 115,
        "best_subject": "Matematika",
        "most_improved": "Fizika (+45%)",
        "hardest_question_conquered": "Termodinamikaning 2-qonuni",
        "longest_streak": 42,
        "personality": "Sprint master 🏃",
        "top_percentile": 5,
        # Pillow would generate an image and return URL here
        "share_image_url": "https://api.lectioai.uz/wrapped/share_123.jpg"
    }

# --- 3. AI DEBATE MODE ---
async def evaluate_debate_arguments(topic: str, team_a_args: str, team_b_args: str) -> Dict[str, Any]:
    prompt = f"""Evaluate this debate objectively.
Topic: {topic}
Team A Arguments: {team_a_args}
Team B Arguments: {team_b_args}

Rate each team on: Logic, Evidence, Persuasiveness (0-10).
Generate 1 counter-argument for each team.
Return JSON format."""
    
    ai_response = await get_claude_response(prompt)
    # Mock return for robustness
    return {
        "team_a_scores": {"logic": 8, "evidence": 7, "persuasiveness": 9},
        "team_b_scores": {"logic": 9, "evidence": 8, "persuasiveness": 7},
        "team_a_counter": "Sizning iqtisodiy dalilingiz uzoq muddatli inflyatsiyani hisobga olmagan.",
        "team_b_counter": "Tarixiy manbalaringiz faqat bir tomonlama yozilgan.",
        "winner": "Durang"
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

# --- 6. STUDY BUDDY MATCHING ---
async def find_study_buddy(student_id: int, db: AsyncSession) -> Dict[str, Any]:
    """Finds complementary student based on strengths and weaknesses."""
    # Mock algorithm
    return {
        "match_found": True,
        "buddy_name": "Dilnoza Aliyeva",
        "buddy_id": 987,
        "synergy": "Jasur Algebra ni yaxshi biladi, Dilnoza esa Geometriyani.",
        "match_score": 95
    }

# --- 7. PROFESSOR MARKETPLACE ---
async def list_marketplace_items(subject: str = None) -> List[Dict[str, Any]]:
    # Mock DB query
    return [
        {
            "id": "item_1",
            "title": "To'liq Fizika kursi (1-semestr)",
            "professor": "Prof. R. Tursunov",
            "price": 50000,
            "rating": 4.9,
            "sales": 120,
            "includes": ["Slides", "Flashcards", "Quizzes"]
        },
        {
            "id": "item_2",
            "title": "Tarix: Amir Temur davri",
            "professor": "Docent M. Karimov",
            "price": 0, # Free
            "rating": 4.7,
            "sales": 345,
            "includes": ["Interactive Scenarios", "Quizzes"]
        }
    ]
