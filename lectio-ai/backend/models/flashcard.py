from sqlalchemy import Column, Integer, String, Text, Float, ForeignKey, DateTime, ARRAY
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class FlashCard(Base):
    __tablename__ = "flash_cards"

    id = Column(Integer, primary_key=True, index=True)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    hint = Column(Text, nullable=True)
    
    # SM-2 Spaced Repetition fields
    difficulty = Column(Float, default=2.5)
    interval = Column(Integer, default=1)  # in days
    repetitions = Column(Integer, default=0)
    ease_factor = Column(Float, default=2.5)
    next_review = Column(DateTime, default=datetime.utcnow)
    
    # Metadata
    lesson_id = Column(Integer, ForeignKey("lessons.id"), nullable=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    subject = Column(String, nullable=True)
    
    # Tags can be stored as JSON or ARRAY (SQLite fallback using JSON/String often, but let's use String for simple mock)
    tags = Column(String, default="[]") 

    student = relationship("User", backref="flashcards")
    lesson = relationship("Lesson", backref="flashcards")
