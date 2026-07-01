from fastapi import FastAPI
from fastapi import Request, Response
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, lessons, polling, spaced_repetition, analytics
from routers import materials, sessions, questions, camera, mentor, student_hub, creative, face_recognition
from routers import learning_chain
import socketio
from services.quiz_engine import sio
from database import engine, Base
from dotenv import load_dotenv
from rate_limiter import setup_rate_limiting
from monitoring import monitoring_router, metrics_middleware
from starlette.middleware.base import BaseHTTPMiddleware
from typing import Callable
import os
import logging

load_dotenv()

logger = logging.getLogger("lectio")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")

from contextlib import asynccontextmanager


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    logger.info("Lectio AI backend v2.0 started successfully — http://localhost:8000")
    yield
    logger.info("Lectio AI backend shutting down cleanly")


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Xavfsizlik sarlavhalari qo'shadi"""
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(self), geolocation=()"
        return response


app = FastAPI(
    title="Lectio AI API",
    description="O'zbekiston universitetlari uchun AI-asosidagi ta'lim platformasi",
    version="2.0.0",
    lifespan=lifespan
)


# CORS — CORS_ORIGINS env var dan olinadi (vergul bilan ajratilgan)
_cors_origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3000,https://lectioai.uz"
).split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in _cors_origins],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Requested-With", "X-Bot-Secret"],
)

# Xavfsizlik sarlavhalari
app.add_middleware(SecurityHeadersMiddleware)

# O'lchovlar va Rate Limiting
app.add_middleware(BaseHTTPMiddleware, dispatch=metrics_middleware)
setup_rate_limiting(app)

# Routerlarni ulash
app.include_router(monitoring_router, tags=["monitoring"]) # Includes /health and /metrics
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(lessons.router, prefix="/api/lessons", tags=["lessons"])
app.include_router(polling.router, prefix="/api/polling", tags=["polling"])
app.include_router(spaced_repetition.router, prefix="/api/sr", tags=["spaced-repetition"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])
app.include_router(materials.router, prefix="/api/materials", tags=["materials"])
app.include_router(sessions.router, prefix="/api/sessions", tags=["sessions"])
app.include_router(questions.router, prefix="/api/questions", tags=["questions"])
app.include_router(camera.router, tags=["camera"])
app.include_router(mentor.router, prefix="/api/mentor", tags=["ai-mentor"])
app.include_router(student_hub.router, prefix="/api/student", tags=["student-hub"])
app.include_router(creative.router, tags=["creative"])
app.include_router(face_recognition.router, prefix="/api", tags=["face-recognition"])
app.include_router(learning_chain.router, prefix="/api/chain", tags=["learning-chain"])

# Socket.IO ilovasini FastAPI bilan ulash
socket_app = socketio.ASGIApp(sio, other_asgi_app=app)
app = socket_app
