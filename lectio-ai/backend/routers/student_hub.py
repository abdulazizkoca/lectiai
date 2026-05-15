from fastapi import APIRouter

router = APIRouter()

@router.get("/{id}/dashboard")
async def get_dashboard(id: int):
    # O'quvchi haqida qisqacha statistika (namuna uchun yozildi)
    return {"student_id": id, "xp": 1500, "streak": 7, "level": 4}

@router.get("/{id}/knowledge-map")
async def get_knowledge_map(id: int):
    # Bilim xaritasi datalari d3 uchun
    topics = [
        {"id": "t1", "name": "Algebra asoslari", "subject": "Matematika", "mastery": 85, "children": ["t2", "t3"]},
        {"id": "t2", "name": "Kvadrat tenglamalar", "subject": "Matematika", "mastery": 60, "children": ["t4"]},
        {"id": "t3", "name": "Logarifmlar", "subject": "Matematika", "mastery": 30, "children": []},
        {"id": "t4", "name": "Viyet teoremasi", "subject": "Matematika", "mastery": 10, "children": []}
    ]
    return {"topics": topics, "subject": "Matematika"}

@router.post("/{id}/daily-quest/complete")
async def complete_daily_quest(id: int, quest_id: str):
    return {"success": True, "xp_earned": 50, "message": "Vazifa bajarildi!"}
