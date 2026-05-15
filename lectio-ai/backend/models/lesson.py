from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime


class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    topic = Column(String)
    content = Column(Text)                    # Dars matni
    presentation_data = Column(JSON)          # Slaydlar JSON formatda
    wow_fact = Column(Text)                   # WOW fakt
    summary_text = Column(Text, nullable=True)  # 60 soniya xulosa
    summary_audio_url = Column(String)        # 60 soniyalik audio
    duration_minutes = Column(Integer, default=45)
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=True)
    professor_id = Column(Integer, ForeignKey("users.id"))
    is_template = Column(Boolean, default=False)
    use_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    scheduled_at = Column(DateTime, nullable=True)

    professor = relationship("User", back_populates="lessons")
    material = relationship("Material", back_populates="lessons")
    polls = relationship("Poll", back_populates="lesson")
    cards = relationship("Card", back_populates="lesson")
    questions = relationship("Question", back_populates="lesson")
    sessions = relationship("LiveSession", back_populates="lesson")
