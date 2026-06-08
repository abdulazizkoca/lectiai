import os
import google.generativeai as genai

genai.configure(api_key=os.getenv("GEMINI_API_KEY") or "mock-key")
gemini_model = genai.GenerativeModel('gemini-1.5-pro')

async def get_ai_mentor_response(
    student_id: int,
    message: str,
    conversation_history: list,
    student_profile: dict
) -> str:
    if not os.getenv("GEMINI_API_KEY"):
        raise ValueError("GEMINI_API_KEY environment variable is not set. Please add it to your .env file.")
    
    system_prompt = f"""
Sen Lectio AI — {student_profile.get('name', 'Talaba')} ning shaxsiy o'quv yo'ldoshisan.

O'quvchi profili:
- Ism: {student_profile.get('name', 'Talaba')}
- Sinf/Kurs: {student_profile.get('level', "Noma'lum")}
- Kuchli fanlari: {', '.join(student_profile.get('strong_subjects', []))}
- Zaif fanlari: {', '.join(student_profile.get('weak_subjects', []))}
- Streak: {student_profile.get('streak', 0)} kun
- XP: {student_profile.get('xp', 0)}
- Oxirgi session natijalari: {student_profile.get('last_scores', {{}})}

Qoidalar:
1. DOIMO O'zbek tilida javob ber (ilmiy atamalar rus/lotin bo'lishi mumkin)
2. Yoshga mos, sodda va qiziqarli tushuntirishlar ber
3. Agar zaif mavzu bo'lsa, alohida e'tibor ber
4. Qisqa, aniq, motivatsion bo'l
5. Zarur bo'lsa misol va qadamlar bilan tushuntir
6. O'quvchini rag'batlantirib tur
"""
    
    model = genai.GenerativeModel('gemini-1.5-pro', system_instruction=system_prompt)
    
    gemini_messages = []
    for msg in conversation_history:
        role = 'model' if msg.get('role') in ['assistant', 'model'] else 'user'
        gemini_messages.append({"role": role, "parts": [msg.get('content', '')]})
    gemini_messages.append({"role": "user", "parts": [message]})
    
    response = await model.generate_content_async(
        gemini_messages,
        generation_config=genai.types.GenerationConfig(max_output_tokens=800)
    )
    
    return response.text


async def generate_study_plan(
    student_id: int,
    goal: str,
    available_hours_per_day: float,
    deadline_days: int,
    weak_topics: list
) -> dict:
    if not os.getenv("GEMINI_API_KEY"):
        raise ValueError("GEMINI_API_KEY environment variable is not set. Please add it to your .env file.")
    
    prompt = f"""
O'quvchi uchun individual o'qish rejasi tuz.

Maqsad: {goal}
Kunlik vaqt: {available_hours_per_day} soat
Muddat: {deadline_days} kun
Zaif mavzular: {', '.join(weak_topics)}

JSON formatda qaytargin:
{{
  "total_plan": {{
    "title": "Reja nomi",
    "daily_hours": {available_hours_per_day},
    "total_days": {deadline_days},
    "success_probability": "yaxshi/o'rta/qiyin"
  }},
  "weekly_schedule": [
    {{
      "week": 1,
      "focus": "Asosiy mavzu",
      "daily_tasks": [
        {{
          "day": "Dushanba",
          "tasks": ["10 matematika savol", "3 ta formula yodla"],
          "duration_min": 45
        }}
      ]
    }}
  ],
  "milestones": [
    {{"day": 7, "goal": "Birinchi mavzu yakunlandi", "test": true}}
  ],
  "tips": ["Maslahat 1", "Maslahat 2"]
}}
"""
    
    # JSON format required, adding json specification if needed
    response = await gemini_model.generate_content_async(
        prompt,
        generation_config=genai.types.GenerationConfig(
            max_output_tokens=2000,
            response_mime_type="application/json"
        )
    )
    
    import json
    return json.loads(response.text)

async def get_ai_response(prompt: str) -> str:
    """Gemini yordamida umumiy AI javob olish."""
    if not os.getenv("GEMINI_API_KEY"):
        raise ValueError("GEMINI_API_KEY environment variable is not set. Please add it to your .env file.")
    response = await gemini_model.generate_content_async(
        prompt,
        generation_config=genai.types.GenerationConfig(max_output_tokens=1500)
    )
    return response.text
