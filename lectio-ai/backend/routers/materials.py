import os
import uuid
import asyncio
import json
from fastapi import APIRouter, UploadFile, File, HTTPException, Request, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse
from database import get_db
from models.user import User
from routers.auth import get_current_user
from services.material_parser import (
    start_extract_topics,
    start_generate_lesson,
    get_progress,
    get_topics,
    get_lesson_result,
    parse_pptx_to_slides,
)

router = APIRouter()

MAX_FILE_SIZE = 50 * 1024 * 1024   # 50 MB
ALLOWED_EXTENSIONS = {".pdf", ".docx", ".pptx", ".txt"}


def _temp_dir() -> str:
    base = os.path.join(os.path.dirname(os.path.dirname(__file__)), "tmp")
    os.makedirs(base, exist_ok=True)
    return base


# ─────────────────────────────────────────────────────────────
# POST /upload  —  Upload file, start topic extraction
# ─────────────────────────────────────────────────────────────
@router.post("/upload")
async def upload_material(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    if current_user.role.value not in ("professor", "admin"):
        raise HTTPException(status_code=403, detail="Faqat professorlar fayl yuklashi mumkin")
    professor_id = current_user.id
    # 1. Validate extension
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Faqat PDF, DOCX, PPTX va TXT ruxsat etilgan. Siz: '{ext}'"
        )

    # 2. Read and validate size
    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="Fayl hajmi 50MB dan oshmasligi kerak.")
    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="Fayl bo'sh.")

    # 3. Save to temp
    material_id = str(uuid.uuid4())
    temp_path = os.path.join(_temp_dir(), f"{material_id}{ext}")
    try:
        with open(temp_path, "wb") as f:
            f.write(file_bytes)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Faylni saqlashda xatolik: {str(e)}")

    # 4. Start background processing (thread — no Celery/MinIO needed)
    from services.material_parser import update_progress
    update_progress(material_id, "started", 5, "Fayl qabul qilindi, tahlil boshlanmoqda...")
    start_extract_topics(material_id, professor_id, temp_path, ext)

    return {
        "material_id": material_id,
        "message": "Fayl muvaffaqiyatli qabul qilindi. Tahlil boshlandi.",
        "filename": file.filename,
        "size_kb": round(len(file_bytes) / 1024, 1)
    }


# ─────────────────────────────────────────────────────────────
# GET /{material_id}/progress  —  SSE real-time progress stream
# ─────────────────────────────────────────────────────────────
@router.get("/{material_id}/progress")
async def progress_stream(request: Request, material_id: str):
    async def generator():
        last_sent = None
        idle_ticks = 0

        while True:
            if await request.is_disconnected():
                break

            data = get_progress(material_id)
            payload = json.dumps(data) if data else None

            if payload and payload != last_sent:
                yield {"data": payload}
                last_sent = payload
                idle_ticks = 0

                if data and data.get("stage") in ("done", "error"):
                    break
            else:
                idle_ticks += 1
                # Stop after 5 minutes of no change
                if idle_ticks > 300:
                    break

            await asyncio.sleep(1)

    return EventSourceResponse(generator())


# ─────────────────────────────────────────────────────────────
# GET /{material_id}/topics  —  Return extracted topics
# ─────────────────────────────────────────────────────────────
@router.get("/{material_id}/topics")
async def get_topics_endpoint(material_id: str):
    data = get_topics(material_id)
    if not data:
        # Check if there's a progress entry (still running)
        progress = get_progress(material_id)
        if progress and progress.get("stage") == "error":
            raise HTTPException(status_code=500, detail=progress.get("message", "Xatolik yuz berdi."))
        raise HTTPException(status_code=404, detail="Mavzular hali tayyor emas. Iltimos kuting.")
    return data


# ─────────────────────────────────────────────────────────────
# POST /generate-topic-lesson  —  Generate lesson for one topic
# ─────────────────────────────────────────────────────────────
class GenerateLessonRequest(BaseModel):
    material_id: str
    professor_id: int
    topic_name: str


@router.post("/generate-topic-lesson")
async def generate_topic_lesson(
    req: GenerateLessonRequest,
    current_user: User = Depends(get_current_user)
):
    if current_user.role.value not in ("professor", "admin"):
        raise HTTPException(status_code=403, detail="Faqat professorlar dars yaratishi mumkin")
    req.professor_id = current_user.id
    # Get stored topics & text_path
    data = get_topics(req.material_id)
    if not data:
        raise HTTPException(status_code=404, detail="Avval faylni yuklang va mavzular tayyorlanishini kuting.")

    text_path = data.get("text_path")
    if not text_path or not os.path.exists(text_path):
        raise HTTPException(
            status_code=404,
            detail="Matn fayli topilmadi. Iltimos faylni qayta yuklang."
        )

    if not req.topic_name.strip():
        raise HTTPException(status_code=400, detail="Mavzu nomi bo'sh bo'lmasligi kerak.")

    # Set initial progress
    from services.material_parser import update_progress
    lesson_key = req.material_id + "_lesson"
    update_progress(lesson_key, "started", 5, f"'{req.topic_name}' uchun dars yaratish boshlanmoqda...")

    # Start background thread
    start_generate_lesson(req.material_id, req.professor_id, req.topic_name, text_path)

    return {"message": "Dars generatsiyasi boshlandi.", "topic": req.topic_name}


# ─────────────────────────────────────────────────────────────
# GET /{material_id}/lesson-progress  —  SSE for lesson creation
# ─────────────────────────────────────────────────────────────
@router.get("/{material_id}/lesson-progress")
async def lesson_progress_stream(request: Request, material_id: str):
    lesson_key = material_id + "_lesson"

    async def generator():
        last_sent = None
        idle_ticks = 0

        while True:
            if await request.is_disconnected():
                break

            data = get_progress(lesson_key)
            payload = json.dumps(data) if data else None

            if payload and payload != last_sent:
                yield {"data": payload}
                last_sent = payload
                idle_ticks = 0

                if data and data.get("stage") in ("done", "error"):
                    break
            else:
                idle_ticks += 1
                if idle_ticks > 600:
                    break

            await asyncio.sleep(1)

    return EventSourceResponse(generator())


# ─────────────────────────────────────────────────────────────
# GET /{material_id}/lesson-result  —  Return generated lesson
# ─────────────────────────────────────────────────────────────
@router.get("/{material_id}/lesson-result")
async def lesson_result(material_id: str):
    data = get_lesson_result(material_id)
    if not data:
        progress = get_progress(material_id + "_lesson")
        if progress and progress.get("stage") == "error":
            raise HTTPException(status_code=500, detail=progress.get("message", "Dars yaratishda xatolik."))
        raise HTTPException(status_code=404, detail="Dars natijasi hali tayyor emas.")
    return data


# ─────────────────────────────────────────────────────────────
# POST /parse-presentation  —  Parse PPTX file into slides
# ─────────────────────────────────────────────────────────────
@router.post("/parse-presentation")
async def parse_presentation(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """PPTX prezentatsiyasini slaydlar ro'yxatiga aylantiradi (AI ishlatmaydi)."""
    if current_user.role.value not in ("professor", "admin"):
        raise HTTPException(status_code=403, detail="Faqat professorlar fayl yuklashi mumkin")

    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext != ".pptx":
        raise HTTPException(status_code=400, detail="Faqat PPTX fayli qabul qilinadi")

    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="Fayl hajmi 50MB dan oshmasligi kerak")
    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="Fayl bo'sh")

    temp_path = os.path.join(_temp_dir(), f"{uuid.uuid4()}{ext}")
    try:
        with open(temp_path, "wb") as f:
            f.write(file_bytes)

        slides = parse_pptx_to_slides(temp_path)

        if not slides:
            raise HTTPException(status_code=400, detail="PPTX faylidan slaydlar topilmadi")

        return {
            "slides": slides,
            "count": len(slides),
            "filename": file.filename,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fayl parse qilishda xatolik: {str(e)}")
    finally:
        try:
            if os.path.exists(temp_path):
                os.remove(temp_path)
        except Exception:
            pass
