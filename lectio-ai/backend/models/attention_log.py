from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class AttentionLog(Base):
    __tablename__ = "attention_logs"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("live_sessions.id"), nullable=False)
    
    # Aggregate statistics ONLY (no individual tracking)
    attention_avg = Column(Float, default=0.0)
    distracted_pct = Column(Float, default=0.0)
    phone_usage_pct = Column(Float, default=0.0)
    talking_pct = Column(Float, default=0.0)
    absent_pct = Column(Float, default=0.0)
    confusion_score = Column(Float, default=0.0)
    
    timestamp = Column(DateTime, default=datetime.utcnow)

    session = relationship("LiveSession", backref="attention_logs")
