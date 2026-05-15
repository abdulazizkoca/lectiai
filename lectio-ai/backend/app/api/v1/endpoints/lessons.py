"""
Lesson API endpoints
CRUD operations for lessons with real-time analytics
"""

from typing import List, Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, desc

from ....core.database import get_db
from ....core.security import get_current_user, require_role
from ....core.exceptions import NotFoundException, ValidationException
from ....models import Lesson, LessonStatus, User, UserRole, StudentAnalytics
from ....schemas.lesson import (
    LessonCreate,
    LessonUpdate,
    LessonResponse,
    LessonListResponse,
    LessonAnalytics,
    LessonQueryParams
)
from ....services.lesson_service import LessonService
from ....services.analytics_service import AnalyticsService

router = APIRouter()
lesson_service = LessonService()
analytics_service = AnalyticsService()


@router.post("/", response_model=LessonResponse, status_code=status.HTTP_201_CREATED)
async def create_lesson(
    lesson_data: LessonCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.PROFESSOR))
):
    """
    Create a new lesson
    
    - **title**: Lesson title
    - **description**: Optional description
    - **subject**: Subject/topic
    - **scheduled_start**: Planned start time
    - **max_students**: Maximum students (default: 50)
    - **ai_config**: AI processing configuration
    """
    try:
        lesson = await lesson_service.create_lesson(
            db=db,
            title=lesson_data.title,
            description=lesson_data.description,
            subject=lesson_data.subject,
            created_by=current_user.id,
            scheduled_start=lesson_data.scheduled_start,
            max_students=lesson_data.max_students,
            ai_config=lesson_data.ai_config
        )
        return lesson.to_dict(include_analytics=True)
    except Exception as e:
        raise ValidationException(message=str(e))


@router.get("/", response_model=LessonListResponse)
async def list_lessons(
    skip: int = Query(0, ge=0, description="Skip N records"),
    limit: int = Query(20, ge=1, le=100, description="Limit results"),
    status: Optional[LessonStatus] = Query(None, description="Filter by status"),
    search: Optional[str] = Query(None, description="Search in title/description"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List lessons with pagination and filtering
    
    - Professors see their own lessons
    - Students see active/scheduled lessons
    - Admins see all lessons
    """
    try:
        lessons = await lesson_service.list_lessons(
            db=db,
            user=current_user,
            skip=skip,
            limit=limit,
            status=status,
            search=search
        )
        
        total = await lesson_service.count_lessons(db, user=current_user, status=status)
        
        return {
            "items": [lesson.to_dict() for lesson in lessons],
            "total": total,
            "skip": skip,
            "limit": limit
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/active", response_model=List[LessonResponse])
async def list_active_lessons(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all currently active lessons"""
    try:
        lessons = await lesson_service.get_active_lessons(db)
        return [lesson.to_dict(include_analytics=True) for lesson in lessons]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{lesson_id}", response_model=LessonResponse)
async def get_lesson(
    lesson_id: int,
    include_analytics: bool = Query(True, description="Include real-time analytics"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get lesson details by ID"""
    try:
        lesson = await lesson_service.get_lesson(db, lesson_id)
        if not lesson:
            raise NotFoundException(resource="Lesson", identifier=str(lesson_id))
        
        # Check permissions
        if not current_user.is_admin and lesson.created_by != current_user.id:
            if current_user.is_student and lesson.status != LessonStatus.ACTIVE:
                raise HTTPException(status_code=403, detail="Access denied")
        
        return lesson.to_dict(include_analytics=include_analytics)
    except NotFoundException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/code/{lesson_code}", response_model=LessonResponse)
async def get_lesson_by_code(
    lesson_code: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get lesson by unique code (for joining)"""
    try:
        lesson = await lesson_service.get_lesson_by_code(db, lesson_code)
        if not lesson:
            raise NotFoundException(resource="Lesson", identifier=lesson_code)
        
        return lesson.to_dict(include_analytics=True)
    except NotFoundException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{lesson_id}", response_model=LessonResponse)
async def update_lesson(
    lesson_id: int,
    lesson_data: LessonUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.PROFESSOR))
):
    """Update lesson details"""
    try:
        lesson = await lesson_service.get_lesson(db, lesson_id)
        if not lesson:
            raise NotFoundException(resource="Lesson", identifier=str(lesson_id))
        
        # Check ownership
        if lesson.created_by != current_user.id and not current_user.is_admin:
            raise HTTPException(status_code=403, detail="Not authorized to update this lesson")
        
        # Cannot update completed/cancelled lessons
        if lesson.status in [LessonStatus.COMPLETED, LessonStatus.CANCELLED]:
            raise ValidationException(message="Cannot update completed or cancelled lessons")
        
        updated_lesson = await lesson_service.update_lesson(
            db=db,
            lesson=lesson,
            **lesson_data.dict(exclude_unset=True)
        )
        
        return updated_lesson.to_dict(include_analytics=True)
    except NotFoundException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{lesson_id}/start", response_model=LessonResponse)
async def start_lesson(
    lesson_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.PROFESSOR))
):
    """Start a lesson"""
    try:
        lesson = await lesson_service.get_lesson(db, lesson_id)
        if not lesson:
            raise NotFoundException(resource="Lesson", identifier=str(lesson_id))
        
        if lesson.created_by != current_user.id and not current_user.is_admin:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        if lesson.status not in [LessonStatus.SCHEDULED, LessonStatus.PAUSED]:
            raise ValidationException(message=f"Cannot start lesson with status: {lesson.status.value}")
        
        lesson.start()
        await db.commit()
        await db.refresh(lesson)
        
        return lesson.to_dict(include_analytics=True)
    except NotFoundException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{lesson_id}/pause", response_model=LessonResponse)
async def pause_lesson(
    lesson_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.PROFESSOR))
):
    """Pause an active lesson"""
    try:
        lesson = await lesson_service.get_lesson(db, lesson_id)
        if not lesson:
            raise NotFoundException(resource="Lesson", identifier=str(lesson_id))
        
        if lesson.created_by != current_user.id and not current_user.is_admin:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        if lesson.status != LessonStatus.ACTIVE:
            raise ValidationException(message="Can only pause active lessons")
        
        lesson.pause()
        await db.commit()
        await db.refresh(lesson)
        
        return lesson.to_dict(include_analytics=True)
    except NotFoundException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{lesson_id}/resume", response_model=LessonResponse)
async def resume_lesson(
    lesson_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.PROFESSOR))
):
    """Resume a paused lesson"""
    try:
        lesson = await lesson_service.get_lesson(db, lesson_id)
        if not lesson:
            raise NotFoundException(resource="Lesson", identifier=str(lesson_id))
        
        if lesson.created_by != current_user.id and not current_user.is_admin:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        if lesson.status != LessonStatus.PAUSED:
            raise ValidationException(message="Can only resume paused lessons")
        
        lesson.resume()
        await db.commit()
        await db.refresh(lesson)
        
        return lesson.to_dict(include_analytics=True)
    except NotFoundException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{lesson_id}/complete", response_model=LessonResponse)
async def complete_lesson(
    lesson_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.PROFESSOR))
):
    """Complete a lesson"""
    try:
        lesson = await lesson_service.get_lesson(db, lesson_id)
        if not lesson:
            raise NotFoundException(resource="Lesson", identifier=str(lesson_id))
        
        if lesson.created_by != current_user.id and not current_user.is_admin:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        if lesson.status not in [LessonStatus.ACTIVE, LessonStatus.PAUSED]:
            raise ValidationException(message="Can only complete active or paused lessons")
        
        lesson.complete()
        await db.commit()
        await db.refresh(lesson)
        
        # Generate final analytics report
        await analytics_service.generate_final_report(db, lesson_id)
        
        return lesson.to_dict(include_analytics=True)
    except NotFoundException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{lesson_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lesson(
    lesson_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    """Delete a lesson (admin only)"""
    try:
        lesson = await lesson_service.get_lesson(db, lesson_id)
        if not lesson:
            raise NotFoundException(resource="Lesson", identifier=str(lesson_id))
        
        await db.delete(lesson)
        await db.commit()
    except NotFoundException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{lesson_id}/analytics", response_model=LessonAnalytics)
async def get_lesson_analytics(
    lesson_id: int,
    timeframe: str = Query("5m", description="Timeframe: 5m, 15m, 30m, 1h, all"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get comprehensive lesson analytics"""
    try:
        lesson = await lesson_service.get_lesson(db, lesson_id)
        if not lesson:
            raise NotFoundException(resource="Lesson", identifier=str(lesson_id))
        
        # Check permissions
        if not current_user.is_admin and lesson.created_by != current_user.id:
            if current_user.is_student:
                # Students can only see their own analytics
                pass
        
        analytics = await analytics_service.get_lesson_analytics(
            db=db,
            lesson_id=lesson_id,
            timeframe=timeframe
        )
        
        return analytics
    except NotFoundException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{lesson_id}/students", response_model=List[dict])
async def get_lesson_students(
    lesson_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.PROFESSOR))
):
    """Get list of students in lesson with their analytics"""
    try:
        lesson = await lesson_service.get_lesson(db, lesson_id)
        if not lesson:
            raise NotFoundException(resource="Lesson", identifier=str(lesson_id))
        
        if lesson.created_by != current_user.id and not current_user.is_admin:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        students = await analytics_service.get_lesson_students(db, lesson_id)
        return students
    except NotFoundException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
