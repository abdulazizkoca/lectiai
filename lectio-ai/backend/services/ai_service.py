import google.generativeai as genai
import json
import os
from typing import Dict, Any

# Initialize Gemini client
api_key = os.getenv("GEMINI_API_KEY") or "mock-key"
genai.configure(api_key=api_key)
gemini_model = genai.GenerativeModel('gemini-1.5-pro')

async def generate_lesson(topic: str, duration: int = 45, level: str = "Bakalavr") -> Dict[str, Any]:
    """Generate full lesson from topic"""
    if not os.getenv("GEMINI_API_KEY"):
        raise ValueError("GEMINI_API_KEY environment variable is not set. Please add it to your .env file.")
    if not topic or len(topic.strip()) < 3:
        raise ValueError("Topic must be at least 3 characters long")
    
    if duration < 10 or duration > 180:
        raise ValueError("Duration must be between 10 and 180 minutes")
    
    try:
        prompt = f"""
O'zbek universiteti uchun dars tayyorla.
Mavzu: {topic}
Davomiylik: {duration} daqiqa
Daraja: {level}

JSON formatda qaytargin:
{{
  "title": "string",
  "wow_fact": "string (O'zbek hayotidan hayratlanarli misol)",
  "slides": [
    {{"id": 1, "title": "string", "content": "string", "notes": "string", "duration_min": 5}}
  ],
  "quiz": [
    {{
      "question": "string",
      "options": ["A) string", "B) string", "C) string", "D) string"],
      "correct": "A",
      "explanation": "string",
      "time_limit": 20,
      "points": 1000
    }}
  ],
  "flashcards": [{{"front": "string", "back": "string"}}],
  "summary": "60 soniyalik xulosa matni"
}}
Faqat JSON. Boshqa narsa yozma.
"""
        response = await gemini_model.generate_content_async(
            prompt,
            generation_config=genai.types.GenerationConfig(
                max_output_tokens=3000,
                response_mime_type="application/json"
            )
        )
        
        content = response.text
        result = json.loads(content)
        
        # Validate the structure
        if not isinstance(result, dict):
            raise ValueError("AI response is not a valid dictionary")
        
        return result

    except json.JSONDecodeError as e:
        raise ValueError(f"AI javobi noto'g'ri JSON formatida: {e}")
    except Exception as e:
        raise RuntimeError(f"Gemini API xatosi (generate_lesson): {e}")

async def analyze_material(text: str) -> Dict[str, Any]:
    """Parse uploaded metodichka"""
    if not os.getenv("GEMINI_API_KEY"):
        raise ValueError("GEMINI_API_KEY environment variable is not set. Please add it to your .env file.")
    if not text or len(text.strip()) < 10:
        raise ValueError("Text must be at least 10 characters long")
    
    try:
        prompt = f"""
Metodichka matni:
{text[:6000]}

JSON formatda tahlil qil:
{{
  "title": "string",
  "subject": "string",
  "topics": [
    {{
      "title": "string",
      "concepts": ["string"],
      "definitions": [{{"term": "string", "definition": "string"}}],
      "formulas": ["string"]
    }}
  ],
  "suggested_lessons": 5,
  "wow_facts": ["string"],
  "exam_topics": ["string"]
}}
Faqat JSON.
"""
        response = await gemini_model.generate_content_async(
            prompt,
            generation_config=genai.types.GenerationConfig(
                max_output_tokens=4000,
                response_mime_type="application/json"
            )
        )
        
        content = response.text
        result = json.loads(content)
        
        # Validate the structure
        if not isinstance(result, dict):
            raise ValueError("AI response is not a valid dictionary")
        
        return result

    except json.JSONDecodeError as e:
        raise ValueError(f"AI javobi noto'g'ri JSON formatida: {e}")
    except Exception as e:
        raise RuntimeError(f"Gemini API xatosi (analyze_material): {e}")
