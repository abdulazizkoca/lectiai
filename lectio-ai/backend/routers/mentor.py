from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List
from services.ai_mentor import get_ai_mentor_response, generate_study_plan
from routers.auth import get_current_user
from models.user import User

router = APIRouter()


class ChatRequest(BaseModel):
    student_id: int
    message: str
    conversation_history: List[dict]
    student_profile: dict


class StudyPlanRequest(BaseModel):
    student_id: int
    goal: str
    available_hours_per_day: float
    deadline_days: int
    weak_topics: List[str]


@router.post("/chat")
async def mentor_chat(
    req: ChatRequest,
    current_user: User = Depends(get_current_user),
):
    response = await get_ai_mentor_response(
        student_id=req.student_id,
        message=req.message,
        conversation_history=req.conversation_history,
        student_profile=req.student_profile,
    )
    return {"reply": response}


@router.post("/study-plan")
async def mentor_study_plan(
    req: StudyPlanRequest,
    current_user: User = Depends(get_current_user),
):
    plan = await generate_study_plan(
        student_id=req.student_id,
        goal=req.goal,
        available_hours_per_day=req.available_hours_per_day,
        deadline_days=req.deadline_days,
        weak_topics=req.weak_topics,
    )
    return {"plan": plan}
