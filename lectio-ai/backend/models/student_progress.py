from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from database import Base

class StudentProgress(Base):
    __tablename__ = "student_progress"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    subject = Column(String, nullable=False)
    topic = Column(String, nullable=False)
    
    mastery_level = Column(Float, default=0.0)  # 0-100
    sessions_count = Column(Integer, default=0)
    last_studied = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    # Stored as JSON strings
    weak_points = Column(String, default="[]")
    strong_points = Column(String, default="[]")

    student = relationship("User", backref="progress")
