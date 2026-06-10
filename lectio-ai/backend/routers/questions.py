"""Test savollari router"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Question, QuestionType, Difficulty
from models.user import User, UserRole
from routers.auth import get_current_user
from pydantic import BaseModel
from typing import Optional, List

router = APIRouter()


def _require_professor(user: User) -> None:
    if user.role not in (UserRole.professor, UserRole.admin):
        raise HTTPException(status_code=403, detail="Faqat professorlar savol boshqara oladi")


class QuestionCreate(BaseModel):
    lesson_id: Optional[int] = None
    material_id: Optional[int] = None
    question: str
    type: str = "multiple_choice"
    options: list = []
    correct: str
    explanation: Optional[str] = None
    difficulty: str = "medium"
    time_limit: int = 20
    points: int = 100


@router.post("/create")
def create_question(
    data: QuestionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_professor(current_user)
    q = Question(
        lesson_id=data.lesson_id, material_id=data.material_id,
        question=data.question, type=QuestionType(data.type),
        options=data.options, correct=data.correct,
        explanation=data.explanation, difficulty=Difficulty(data.difficulty),
        time_limit=data.time_limit, points=data.points,
    )
    db.add(q); db.commit(); db.refresh(q)
    return {"success": True, "question_id": q.id}


@router.post("/bulk-create")
def bulk_create(
    questions: List[QuestionCreate],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_professor(current_user)
    ids = []
    for data in questions:
        q = Question(
            lesson_id=data.lesson_id, material_id=data.material_id,
            question=data.question, type=QuestionType(data.type),
            options=data.options, correct=data.correct,
            explanation=data.explanation, difficulty=Difficulty(data.difficulty),
            time_limit=data.time_limit, points=data.points,
        )
        db.add(q); db.commit(); db.refresh(q); ids.append(q.id)
    return {"success": True, "question_ids": ids, "count": len(ids)}


@router.get("/lesson/{lesson_id}")
def get_lesson_questions(
    lesson_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    qs = db.query(Question).filter(Question.lesson_id == lesson_id).all()
    return [{"id": q.id, "question": q.question, "type": q.type.value if q.type else "multiple_choice",
             "options": q.options, "correct": q.correct, "explanation": q.explanation,
             "difficulty": q.difficulty.value if q.difficulty else "medium",
             "time_limit": q.time_limit, "points": q.points} for q in qs]


@router.put("/{question_id}")
def update_question(
    question_id: int,
    data: QuestionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_professor(current_user)
    q = db.query(Question).filter(Question.id == question_id).first()
    if not q:
        raise HTTPException(404, "Savol topilmadi")
    q.question = data.question; q.options = data.options; q.correct = data.correct
    q.explanation = data.explanation; q.time_limit = data.time_limit; q.points = data.points
    db.commit()
    return {"success": True, "question_id": q.id}


@router.delete("/{question_id}")
def delete_question(
    question_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_professor(current_user)
    q = db.query(Question).filter(Question.id == question_id).first()
    if not q:
        raise HTTPException(404, "Savol topilmadi")
    db.delete(q); db.commit()
    return {"success": True}
