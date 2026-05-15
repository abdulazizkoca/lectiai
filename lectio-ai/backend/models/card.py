from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Float
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime


class Card(Base):
    """Spaced Repetition uchun karta — SM-2 algoritmi"""
    __tablename__ = "cards"

    id = Column(Integer, primary_key=True, index=True)
    question = Column(Text)
    answer = Column(Text)
    difficulty = Column(Float, default=2.5)   # SM-2 algoritmi uchun (EF)
    interval = Column(Integer, default=1)      # Kunlarda
    repetitions = Column(Integer, default=0)
    next_review = Column(DateTime, default=datetime.utcnow)

    student_id = Column(Integer, ForeignKey("users.id"))
    lesson_id = Column(Integer, ForeignKey("lessons.id"))

    student = relationship("User", back_populates="cards")
    lesson = relationship("Lesson", back_populates="cards")
