from sqlalchemy import Column, Integer, String, Enum, DateTime, Boolean, JSON
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime, timezone
import enum


class UserRole(enum.Enum):
    professor = "professor"
    student = "student"
    tutor = "tutor"
    admin = "admin"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    full_name = Column(String)
    hashed_password = Column(String)
    role = Column(Enum(UserRole), default=UserRole.student)
    is_active = Column(Boolean, default=True)
    telegram_id = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    face_encoding = Column(JSON, nullable=True)  # Face recognition encoding
    xp_points = Column(Integer, default=0)
    streak_days = Column(Integer, default=0)
    last_active = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Bog'liqliklar
    lessons = relationship("Lesson", back_populates="professor")
    cards = relationship("Card", back_populates="student")
    materials = relationship("Material", back_populates="professor")
    sessions = relationship("LiveSession", back_populates="professor")
    participations = relationship("SessionParticipant", back_populates="student")
