from sqlalchemy import Column, Integer, String, DateTime
from database import Base
from datetime import datetime, timezone


class PasswordResetToken(Base):
    """Parolni tiklash tokenlari — 15 daqiqalik TTL bilan."""
    __tablename__ = "password_reset_tokens"

    id = Column(Integer, primary_key=True, index=True)
    token = Column(String(64), unique=True, index=True, nullable=False)
    email = Column(String(254), nullable=False, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
