from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime


class Material(Base):
    """Metodichka / O'quv materiali modeli"""
    __tablename__ = "materials"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    file_url = Column(String)                  # MinIO / local storage
    file_type = Column(String)                 # pdf, docx, pptx, txt
    raw_text = Column(Text, nullable=True)     # AI tomonidan chiqarilgan matn
    analysis_data = Column(Text, nullable=True) # JSON — AI tahlil natijasi
    processed = Column(Boolean, default=False)
    professor_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    # Bog'liqliklar
    professor = relationship("User", back_populates="materials")
    lessons = relationship("Lesson", back_populates="material")
    questions = relationship("Question", back_populates="material")
