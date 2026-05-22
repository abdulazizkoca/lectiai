import os
import uuid
from fastapi import APIRouter, UploadFile, File, BackgroundTasks, HTTPException, Request
from sse_starlette.sse import EventSourceResponse
import asyncio
from minio import Minio
from celery.result import AsyncResult
from services.material_parser import process_material_task
import redis
import json

router = APIRouter()

MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT", "localhost:9000")
MINIO_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
MINIO_SECRET_KEY = os.getenv("MINIO_SECRET_KEY", "minioadmin")
MINIO_SECURE = os.getenv("MINIO_SECURE", "False").lower() == "true"

minio_client = Minio(
    MINIO_ENDPOINT,
    access_key=MINIO_ACCESS_KEY,
    secret_key=MINIO_SECRET_KEY,
    secure=MINIO_SECURE
)

BUCKET_NAME = "materials"

def ensure_bucket():
    try:
        if not minio_client.bucket_exists(BUCKET_NAME):
            minio_client.make_bucket(BUCKET_NAME)
    except Exception as e:
        print(f"MinIO bucket error: {e}")

redis_client = redis.Redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379/0"), decode_responses=True)

MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
ALLOWED_EXTENSIONS = {".pdf", ".docx", ".pptx", ".txt"}

@router.post("/upload")
async def upload_material(
    professor_id: int,
    file: UploadFile = File(...)
):
    # 1. Validation
    ensure_bucket()
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Faqat PDF, DOCX, PPTX va TXT ruxsat etilgan.")
    
    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="Fayl hajmi 50MB dan oshmasligi kerak.")
    
    # 2. MinIO ga yuklash
    material_id = str(uuid.uuid4())
    object_name = f"{professor_id}/{material_id}/{file.filename}"
    
    # Save to temp file to upload
    temp_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "tmp")
    os.makedirs(temp_dir, exist_ok=True)
    temp_path = os.path.join(temp_dir, f"{material_id}{ext}")
    with open(temp_path, "wb") as f:
        f.write(file_bytes)
        
    minio_client.fput_object(BUCKET_NAME, object_name, temp_path)
    
    # Update Redis state
    redis_client.set(f"material_progress:{material_id}", json.dumps({
        "stage": "started",
        "percent": 0,
        "message": "Fayl qabul qilindi, navbatga qo'shildi..."
    }))

    # 3. Background processing via Celery
    task = process_material_task.delay(material_id, professor_id, object_name, temp_path, ext)
    
    return {
        "material_id": material_id,
        "task_id": task.id,
        "message": "Fayl muvaffaqiyatli qabul qilindi va tahlil boshlandi."
    }

@router.get("/{material_id}/progress")
async def get_progress(request: Request, material_id: str):
    """ Server-Sent Events (SSE) endpoint for real-time progress """
    async def event_generator():
        last_data = None
        while True:
            # Agar klient aloqani uzsa, to'xtatish
            if await request.is_disconnected():
                break
                
            raw_data = redis_client.get(f"material_progress:{material_id}")
            if raw_data and raw_data != last_data:
                yield {"data": raw_data}
                last_data = raw_data
                
                data_dict = json.loads(raw_data)
                if data_dict.get("stage") in ["done", "error"]:
                    break
                    
            await asyncio.sleep(1)
            
    return EventSourceResponse(event_generator())
