"""
Lectio AI - Professional Backend API
FastAPI-based REST API with WebSocket support
"""

import asyncio
import logging
import sys
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Optional

from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# Import internal modules
from .core.config import Settings, get_settings
from .core.database import engine, Base, get_db
from .core.logging_config import setup_logging
from .core.exceptions import (
    LectioBaseException,
    NotFoundException,
    ValidationException,
    AuthenticationException,
    AuthorizationException
)
from .api.v1.router import api_router
from .services.websocket_manager import ConnectionManager
from .services.camera_processor import CameraProcessor
from .services.analytics_service import AnalyticsService
from .models import User, Lesson, StudentAnalytics, Snapshot

# Setup logging
logger = logging.getLogger(__name__)

# Security
security = HTTPBearer()

# WebSocket manager
ws_manager = ConnectionManager()
camera_processor = CameraProcessor()
analytics_service = AnalyticsService()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan management"""
    # Startup
    settings = get_settings()
    setup_logging(settings.LOG_LEVEL)
    
    logger.info("🚀 Starting Lectio AI Backend...")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"Database: {settings.DATABASE_URL}")
    
    # Create database tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Start background services
    await camera_processor.start()
    await analytics_service.start()
    
    logger.info("✅ Application startup complete")
    
    yield
    
    # Shutdown
    logger.info("🛑 Shutting down Lectio AI Backend...")
    await camera_processor.stop()
    await analytics_service.stop()
    await engine.dispose()
    logger.info("✅ Application shutdown complete")


# Create FastAPI application
app = FastAPI(
    title="Lectio AI API",
    description="Professional AI-powered classroom monitoring system",
    version="2.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan
)

# Add middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(GZipMiddleware, minimum_size=1000)


# Exception handlers
@app.exception_handler(LectioBaseException)
async def lectio_exception_handler(request: Request, exc: LectioBaseException):
    """Handle custom Lectio exceptions"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.error_code,
                "message": exc.message,
                "details": exc.details,
                "timestamp": datetime.utcnow().isoformat()
            }
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle unexpected exceptions"""
    logger.error(f"Unexpected error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "code": "INTERNAL_ERROR",
                "message": "An unexpected error occurred",
                "timestamp": datetime.utcnow().isoformat()
            }
        }
    )


# Health check endpoints
@app.get("/health", tags=["Health"])
async def health_check():
    """Basic health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "2.0.0"
    }


@app.get("/health/detailed", tags=["Health"])
async def detailed_health_check():
    """Detailed health check with system metrics"""
    db_status = "connected"
    try:
        # Test database connection
        async with engine.connect() as conn:
            await conn.execute("SELECT 1")
    except Exception as e:
        db_status = f"error: {str(e)}"
    
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "components": {
            "database": db_status,
            "websocket": "active" if ws_manager.active_connections else "idle",
            "camera_processor": "running" if camera_processor.is_running else "stopped",
            "analytics_service": "running" if analytics_service.is_running else "stopped"
        },
        "metrics": {
            "active_connections": len(ws_manager.active_connections),
            "active_lessons": len(camera_processor.active_lessons),
            "processed_frames": camera_processor.total_frames_processed
        }
    }


# API routes
app.include_router(api_router, prefix="/api/v1")


# WebSocket endpoints
@app.websocket("/ws/camera/{lesson_id}")
async def camera_websocket(websocket: WebSocket, lesson_id: str):
    """WebSocket endpoint for camera data streaming"""
    await ws_manager.connect(websocket, lesson_id)
    
    try:
        # Register camera for this lesson
        await camera_processor.register_camera(lesson_id, websocket)
        
        while True:
            # Receive data from camera
            data = await websocket.receive_json()
            
            # Process camera data
            await camera_processor.process_frame_data(lesson_id, data)
            
            # Update analytics
            await analytics_service.update_lesson_analytics(lesson_id, data)
            
            # Broadcast to all connected professors
            await ws_manager.broadcast_to_lesson(
                lesson_id=lesson_id,
                message={
                    "type": "camera_update",
                    "timestamp": datetime.utcnow().isoformat(),
                    "data": data
                },
                exclude=websocket
            )
            
    except WebSocketDisconnect:
        logger.info(f"Camera disconnected from lesson {lesson_id}")
    except Exception as e:
        logger.error(f"Camera WebSocket error: {e}")
    finally:
        await camera_processor.unregister_camera(lesson_id, websocket)
        ws_manager.disconnect(websocket)


@app.websocket("/ws/professor/{lesson_id}")
async def professor_websocket(websocket: WebSocket, lesson_id: str):
    """WebSocket endpoint for professor dashboard"""
    await ws_manager.connect(websocket, lesson_id)
    
    try:
        # Send initial lesson data
        lesson_data = await analytics_service.get_lesson_summary(lesson_id)
        await websocket.send_json({
            "type": "initial_data",
            "lesson_id": lesson_id,
            "data": lesson_data
        })
        
        while True:
            # Keep connection alive and handle professor commands
            message = await websocket.receive_json()
            
            if message.get("action") == "request_snapshot":
                # Handle snapshot request
                student_id = message.get("student_id")
                snapshot = await analytics_service.get_student_snapshot(
                    lesson_id, student_id
                )
                await websocket.send_json({
                    "type": "snapshot",
                    "data": snapshot
                })
            
            elif message.get("action") == "get_analytics":
                # Handle analytics request
                analytics = await analytics_service.get_detailed_analytics(
                    lesson_id, message.get("timeframe", "5m")
                )
                await websocket.send_json({
                    "type": "analytics",
                    "data": analytics
                })
                
    except WebSocketDisconnect:
        logger.info(f"Professor disconnected from lesson {lesson_id}")
    except Exception as e:
        logger.error(f"Professor WebSocket error: {e}")
    finally:
        ws_manager.disconnect(websocket)


@app.websocket("/ws/student/{lesson_id}/{student_id}")
async def student_websocket(
    websocket: WebSocket, 
    lesson_id: str, 
    student_id: str
):
    """WebSocket endpoint for individual student view"""
    await ws_manager.connect(websocket, f"{lesson_id}_{student_id}")
    
    try:
        while True:
            # Keep connection alive for student-specific updates
            message = await websocket.receive_json()
            
            # Handle student actions (notes, reactions, etc.)
            if message.get("action") == "add_note":
                await analytics_service.add_student_note(
                    lesson_id, student_id, message.get("content")
                )
            
            elif message.get("action") == "send_reaction":
                await analytics_service.record_student_reaction(
                    lesson_id, student_id, message.get("reaction_type")
                )
                # Broadcast to professor
                await ws_manager.broadcast_to_lesson(
                    lesson_id=lesson_id,
                    message={
                        "type": "student_reaction",
                        "student_id": student_id,
                        "reaction": message.get("reaction_type"),
                        "timestamp": datetime.utcnow().isoformat()
                    }
                )
                
    except WebSocketDisconnect:
        logger.info(f"Student {student_id} disconnected from lesson {lesson_id}")
    except Exception as e:
        logger.error(f"Student WebSocket error: {e}")
    finally:
        ws_manager.disconnect(websocket)


if __name__ == "__main__":
    import uvicorn
    
    settings = get_settings()
    
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower(),
        workers=1 if settings.DEBUG else 4
    )
