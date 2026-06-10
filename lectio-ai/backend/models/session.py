from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Enum
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime, timezone
import enum


class SessionStatus(enum.Enum):
    waiting = "waiting"
    active = "active"
    paused = "paused"
    ended = "ended"


class LiveSession(Base):
    """Jonli dars sessiyasi — Kahoot uslubida room"""
    __tablename__ = "live_sessions"

    id = Column(Integer, primary_key=True, index=True)
    room_code = Column(String(8), unique=True, index=True)  # "LECTIO-7X9K"
    lesson_id = Column(Integer, ForeignKey("lessons.id"))
    professor_id = Column(Integer, ForeignKey("users.id"))
    status = Column(Enum(SessionStatus), default=SessionStatus.waiting)
    started_at = Column(DateTime, nullable=True)
    ended_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Bog'liqliklar
    lesson = relationship("Lesson", back_populates="sessions")
    professor = relationship("User", back_populates="sessions")
    participants = relationship("SessionParticipant", back_populates="session")
    answers = relationship("Answer", back_populates="session")


class SessionParticipant(Base):
    """Sessiyaga kirgan o'quvchilar"""
    __tablename__ = "session_participants"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("live_sessions.id"))
    student_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    nickname = Column(String)             # Anonim kirish uchun
    score = Column(Integer, default=0)
    joined_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    session = relationship("LiveSession", back_populates="participants")
    student = relationship("User", back_populates="participations")
