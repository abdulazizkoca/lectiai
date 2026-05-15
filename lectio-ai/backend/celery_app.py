import os
from celery import Celery

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# For Railway/production, ensure we handle possible TLS requirements or URL format differences
# Celery usually handles redis:// and rediss:// out of the box.

celery_app = Celery(
    "lectio_tasks",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=["services.material_parser"]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Tashkent",
    enable_utc=True,
    task_track_started=True,
)
