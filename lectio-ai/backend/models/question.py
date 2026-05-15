from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, JSON, Enum
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime
import enum


class QuestionType(enum.Enum):
    multiple_choice = "multiple_choice"
    true_false = "true_false"
    short_answer = "short_answer"
    image_choice = "image_choice"


class Difficulty(enum.Enum):
    easy = "easy"
    medium = "medium"
    hard = "hard"


class Question(Base):
    """Test savollari"""
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id"), nullable=True)
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=True)
    question = Column(Text)
    type = Column(Enum(QuestionType), default=QuestionType.multiple_choice)
    options = Column(JSON)                    # ["A javob", "B javob", "C javob", "D javob"]
    correct = Column(String)                  # "A" yoki "To'g'ri" yoki matn
    explanation = Column(Text, nullable=True) # Nima uchun bu to'g'ri
    difficulty = Column(Enum(Difficulty), default=Difficulty.medium)
    time_limit = Column(Integer, default=20)  # soniyada
    points = Column(Integer, default=100)
    image_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Bog'liqliklar
    lesson = relationship("Lesson", back_populates="questions")
    material = relationship("Material", back_populates="questions")
    answers = relationship("Answer", back_populates="question")
