import anthropic
import json
import os
from typing import Dict, Any

# Initialize Claude client
api_key = os.getenv("ANTHROPIC_API_KEY") or "mock-key"
client = anthropic.AsyncAnthropic(api_key=api_key)

async def generate_lesson(topic: str, duration: int = 45, level: str = "Bakalavr") -> Dict[str, Any]:
    """Generate full lesson from topic"""
    if not os.getenv("ANTHROPIC_API_KEY"):
        raise ValueError("ANTHROPIC_API_KEY environment variable is not set. Please add it to your .env file.")
    if not topic or len(topic.strip()) < 3:
        raise ValueError("Topic must be at least 3 characters long")
    
    if duration < 10 or duration > 180:
        raise ValueError("Duration must be between 10 and 180 minutes")
    
    try:
        response = await client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=3000,
            messages=[{"role": "user", "content": f"""
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
"""}]
        )
        
        content = response.content[0].text
        result = json.loads(content)
        
        # Validate the structure
        if not isinstance(result, dict):
            raise ValueError("AI response is not a valid dictionary")
        
        return result
        
    except json.JSONDecodeError as e:
        print(f"JSON parsing error: {e}")
        # Fallback empty structure
        return {
            "title": topic,
            "wow_fact": "O'zbekistonda bu texnologiya rivojlanmoqda.",
            "slides": [],
            "quiz": [],
            "flashcards": [],
            "summary": "Dars xulosasi."
        }
    except anthropic.APIError as e:
        print(f"Anthropic API error: {e}")
        # Fallback empty structure
        return {
            "title": topic,
            "wow_fact": "O'zbekistonda bu texnologiya rivojlanmoqda.",
            "slides": [],
            "quiz": [],
            "flashcards": [],
            "summary": "Dars xulosasi."
        }
    except Exception as e:
        print(f"Unexpected error generating lesson: {e}")
        # Fallback empty structure
        return {
            "title": topic,
            "wow_fact": "O'zbekistonda bu texnologiya rivojlanmoqda.",
            "slides": [],
            "quiz": [],
            "flashcards": [],
            "summary": "Dars xulosasi."
        }

async def analyze_material(text: str) -> Dict[str, Any]:
    """Parse uploaded metodichka"""
    if not os.getenv("ANTHROPIC_API_KEY"):
        raise ValueError("ANTHROPIC_API_KEY environment variable is not set. Please add it to your .env file.")
    if not text or len(text.strip()) < 10:
        raise ValueError("Text must be at least 10 characters long")
    
    try:
        response = await client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=4000,
            messages=[{"role": "user", "content": f"""
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
"""}]
        )
        
        content = response.content[0].text
        result = json.loads(content)
        
        # Validate the structure
        if not isinstance(result, dict):
            raise ValueError("AI response is not a valid dictionary")
        
        return result
        
    except json.JSONDecodeError as e:
        print(f"JSON parsing error in material analysis: {e}")
        return {
            "title": "Noma'lum",
            "subject": "Noma'lum",
            "topics": [],
            "suggested_lessons": 0,
            "wow_facts": [],
            "exam_topics": []
        }
    except anthropic.APIError as e:
        print(f"Anthropic API error in material analysis: {e}")
        return {
            "title": "Noma'lum",
            "subject": "Noma'lum",
            "topics": [],
            "suggested_lessons": 0,
            "wow_facts": [],
            "exam_topics": []
        }
    except Exception as e:
        print(f"Unexpected error analyzing material: {e}")
        return {
            "title": "Noma'lum",
            "subject": "Noma'lum",
            "topics": [],
            "suggested_lessons": 0,
            "wow_facts": [],
            "exam_topics": []
        }
