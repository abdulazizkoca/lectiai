from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime, timezone


class Answer(Base):
    """O'quvchi javoblari"""
    __tablename__ = "answers"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("live_sessions.id"), index=True)
    question_id = Column(Integer, ForeignKey("questions.id"), index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    answer = Column(String)
    is_correct = Column(Boolean, default=False)
    time_taken = Column(Integer)              # millisekund
    points_earned = Column(Integer, default=0)
    answered_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Bog'liqliklar
    session = relationship("LiveSession", back_populates="answers")
    question = relationship("Question", back_populates="answers")
