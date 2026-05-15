import os
from anthropic import AsyncAnthropic

client = AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

async def get_ai_mentor_response(
    student_id: int,
    message: str,
    conversation_history: list,
    student_profile: dict
) -> str:
    
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
    
    messages = conversation_history + [{"role": "user", "content": message}]
    
    response = await client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=800,
        system=system_prompt,
        messages=messages
    )
    
    return response.content[0].text


async def generate_study_plan(
    student_id: int,
    goal: str,
    available_hours_per_day: float,
    deadline_days: int,
    weak_topics: list
) -> dict:
    
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
    
    response = await client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=2000,
        messages=[{"role": "user", "content": prompt}]
    )
    
    import json
    return json.loads(response.content[0].text)

async def get_claude_response(prompt: str) -> str:
    response = await client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=1500,
        messages=[{"role": "user", "content": prompt}]
    )
    return response.content[0].text
