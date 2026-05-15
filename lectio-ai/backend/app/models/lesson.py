"""
Lesson model for classroom sessions
"""

import enum
from datetime import datetime
from typing import Optional, List, Dict, Any

from sqlalchemy import (
    Column, Integer, String, Text, DateTime, 
    Enum, Boolean, ForeignKey, JSON, Index, Float
)
from sqlalchemy.orm import relationship, validates
from sqlalchemy.sql import func

from ..core.database import Base


class LessonStatus(str, enum.Enum):
    """Lesson status"""
    SCHEDULED = "scheduled"
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class Lesson(Base):
    """Lesson/Classroom session model"""
    
    __tablename__ = "lessons"
    
    # Primary fields
    id = Column(Integer, primary_key=True, index=True)
    lesson_code = Column(String(50), unique=True, index=True, nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    subject = Column(String(255), nullable=True)
    
    # Foreign keys
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Status and timing
    status = Column(Enum(LessonStatus), default=LessonStatus.SCHEDULED, nullable=False)
    scheduled_start = Column(DateTime(timezone=True), nullable=True)
    actual_start = Column(DateTime(timezone=True), nullable=True)
    scheduled_end = Column(DateTime(timezone=True), nullable=True)
    actual_end = Column(DateTime(timezone=True), nullable=True)
    
    # Configuration
    max_students = Column(Integer, default=50, nullable=False)
    camera_enabled = Column(Boolean, default=True, nullable=False)
    recording_enabled = Column(Boolean, default=False, nullable=False)
    
    # AI Configuration
    ai_config = Column(JSON, default=dict, nullable=False)
    
    # Metrics (updated in real-time)
    total_students = Column(Integer, default=0, nullable=False)
    avg_attention = Column(Float, default=0.0, nullable=False)
    green_count = Column(Integer, default=0, nullable=False)
    yellow_count = Column(Integer, default=0, nullable=False)
    red_count = Column(Integer, default=0, nullable=False)
    
    # Settings
    settings = Column(JSON, default=dict, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
    
    # Relationships
    creator = relationship(
        "User",
        back_populates="lessons_created",
        foreign_keys=[created_by]
    )
    
    student_analytics = relationship(
        "StudentAnalytics",
        back_populates="lesson",
        lazy="dynamic",
        cascade="all, delete-orphan"
    )
    
    snapshots = relationship(
        "Snapshot",
        back_populates="lesson",
        lazy="dynamic",
        cascade="all, delete-orphan"
    )
    
    attention_sessions = relationship(
        "AttentionSession",
        back_populates="lesson",
        lazy="dynamic",
        cascade="all, delete-orphan"
    )
    
    reactions = relationship(
        "Reaction",
        back_populates="lesson",
        lazy="dynamic",
        cascade="all, delete-orphan"
    )
    
    # Indexes
    __table_args__ = (
        Index('idx_lesson_code_status', 'lesson_code', 'status'),
        Index('idx_lesson_created_by', 'created_by', 'status'),
        Index('idx_lesson_dates', 'scheduled_start', 'scheduled_end'),
    )
    
    def __repr__(self):
        return f"<Lesson(id={self.id}, code={self.lesson_code}, status={self.status.value})>"
    
    def to_dict(self, include_analytics: bool = False) -> dict:
        """Convert lesson to dictionary"""
        data = {
            "id": self.id,
            "lesson_code": self.lesson_code,
            "title": self.title,
            "description": self.description,
            "subject": self.subject,
            "status": self.status.value,
            "scheduled_start": self.scheduled_start.isoformat() if self.scheduled_start else None,
            "actual_start": self.actual_start.isoformat() if self.actual_start else None,
            "scheduled_end": self.scheduled_end.isoformat() if self.scheduled_end else None,
            "actual_end": self.actual_end.isoformat() if self.actual_end else None,
            "max_students": self.max_students,
            "camera_enabled": self.camera_enabled,
            "recording_enabled": self.recording_enabled,
            "ai_config": self.ai_config,
            "settings": self.settings,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "creator": self.creator.to_dict() if self.creator else None
        }
        
        if include_analytics:
            data.update({
                "analytics": {
                    "total_students": self.total_students,
                    "avg_attention": self.avg_attention,
                    "green_count": self.green_count,
                    "yellow_count": self.yellow_count,
                    "red_count": self.red_count
                }
            })
        
        return data
    
    def start(self):
        """Mark lesson as started"""
        self.status = LessonStatus.ACTIVE
        self.actual_start = datetime.utcnow()
    
    def pause(self):
        """Pause lesson"""
        self.status = LessonStatus.PAUSED
    
    def resume(self):
        """Resume lesson"""
        self.status = LessonStatus.ACTIVE
    
    def complete(self):
        """Mark lesson as completed"""
        self.status = LessonStatus.COMPLETED
        self.actual_end = datetime.utcnow()
    
    def cancel(self):
        """Cancel lesson"""
        self.status = LessonStatus.CANCELLED
    
    def update_metrics(self, total: int, avg_attention: float, 
                      green: int, yellow: int, red: int):
        """Update real-time metrics"""
        self.total_students = total
        self.avg_attention = avg_attention
        self.green_count = green
        self.yellow_count = yellow
        self.red_count = red
    
    @property
    def is_active(self) -> bool:
        """Check if lesson is currently active"""
        return self.status == LessonStatus.ACTIVE
    
    @property
    def duration_minutes(self) -> Optional[float]:
        """Get lesson duration in minutes"""
        if self.actual_start:
            end_time = self.actual_end or datetime.utcnow()
            delta = end_time - self.actual_start
            return delta.total_seconds() / 60
        return None
