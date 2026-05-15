from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from services.creative_features import (
    is_feature_enabled,
    process_snap_and_learn,
    generate_lectio_wrapped,
    evaluate_debate_arguments,
    explain_formula,
    find_study_buddy,
    list_marketplace_items
)

router = APIRouter(prefix="/api/v1/creative", tags=["Creative Features"])

class SnapRequest(BaseModel):
    institution_id: str
    image_base64: str

@router.post("/snap-and-learn")
async def snap_and_learn(req: SnapRequest):
    if not await is_feature_enabled(req.institution_id, "snap_and_learn"):
        raise HTTPException(status_code=403, detail="Feature disabled")
    
    cards = await process_snap_and_learn(req.image_base64)
    return {"status": "success", "flashcards": cards}

@router.get("/wrapped/{student_id}")
async def lectio_wrapped(student_id: int, institution_id: str):
    if not await is_feature_enabled(institution_id, "lectio_wrapped"):
        raise HTTPException(status_code=403, detail="Feature disabled")
    
    data = await generate_lectio_wrapped(student_id, None)
    return {"status": "success", "data": data}

class FormulaRequest(BaseModel):
    institution_id: str
    formula: str

@router.post("/formula-whisper")
async def formula_whisper(req: FormulaRequest):
    if not await is_feature_enabled(req.institution_id, "formula_whisper"):
        raise HTTPException(status_code=403, detail="Feature disabled")
    
    explanation = await explain_formula(req.formula)
    return {"status": "success", "explanation": explanation}

@router.get("/marketplace")
async def marketplace(institution_id: str, subject: Optional[str] = None):
    if not await is_feature_enabled(institution_id, "marketplace"):
        raise HTTPException(status_code=403, detail="Feature disabled")
    
    items = await list_marketplace_items(subject)
    return {"status": "success", "items": items}
