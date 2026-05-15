from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime


class Poll(Base):
    """Jonli so'rovnoma modeli"""
    __tablename__ = "polls"

    id = Column(Integer, primary_key=True, index=True)
    question = Column(Text)
    options = Column(JSON)                    # ["A", "B", "C", "D"]
    votes = Column(JSON, default=dict)        # {"A": 5, "B": 3, ...}
    total_votes = Column(Integer, default=0)
    is_active = Column(Integer, default=1)    # 1=aktiv, 0=tugagan
    lesson_id = Column(Integer, ForeignKey("lessons.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    lesson = relationship("Lesson", back_populates="polls")
