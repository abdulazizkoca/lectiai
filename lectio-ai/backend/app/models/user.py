"""
User model with authentication support
"""

import enum
from datetime import datetime
from typing import Optional, List

from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, 
    Enum, Text, LargeBinary, Index, ForeignKey, Table
)
from sqlalchemy.orm import relationship, validates
from sqlalchemy.sql import func

from ..core.database import Base
from ..core.security import get_password_hash, verify_password


class UserRole(str, enum.Enum):
    """User roles in the system"""
    ADMIN = "admin"
    PROFESSOR = "professor"
    STUDENT = "student"
    GUEST = "guest"


class User(Base):
    """User model with comprehensive profile support"""
    
    __tablename__ = "users"
    
    # Primary fields
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(LargeBinary, nullable=False)
    
    # Profile fields
    full_name = Column(String(255), nullable=False)
    avatar_url = Column(String(500), nullable=True)
    bio = Column(Text, nullable=True)
    
    # Role and status
    role = Column(Enum(UserRole), default=UserRole.STUDENT, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    is_superuser = Column(Boolean, default=False, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
    last_login = Column(DateTime(timezone=True), nullable=True)
    
    # Preferences
    language = Column(String(10), default="uz", nullable=False)
    theme = Column(String(20), default="dark", nullable=False)
    notifications_enabled = Column(Boolean, default=True, nullable=False)
    
    # Professor-specific fields
    department = Column(String(255), nullable=True)
    subject = Column(String(255), nullable=True)
    
    # Student-specific fields
    student_id = Column(String(50), nullable=True, unique=True, index=True)
    group = Column(String(100), nullable=True)
    enrollment_year = Column(Integer, nullable=True)
    
    # Relationships
    lessons_created = relationship(
        "Lesson",
        back_populates="creator",
        foreign_keys="Lesson.created_by",
        lazy="dynamic"
    )
    
    student_analytics = relationship(
        "StudentAnalytics",
        back_populates="student",
        foreign_keys="StudentAnalytics.student_id",
        lazy="dynamic"
    )
    
    snapshots = relationship(
        "Snapshot",
        back_populates="student",
        foreign_keys="Snapshot.student_id",
        lazy="dynamic"
    )
    
    reactions = relationship(
        "Reaction",
        back_populates="student",
        foreign_keys="Reaction.student_id",
        lazy="dynamic"
    )
    
    # Indexes
    __table_args__ = (
        Index('idx_user_email_active', 'email', 'is_active'),
        Index('idx_user_role', 'role', 'is_active'),
    )
    
    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, role={self.role.value})>"
    
    # Authentication methods
    def verify_password(self, plain_password: str) -> bool:
        """Verify password against hash"""
        return verify_password(plain_password, self.hashed_password)
    
    def set_password(self, plain_password: str):
        """Set hashed password"""
        self.hashed_password = get_password_hash(plain_password)
    
    def to_dict(self, include_sensitive: bool = False) -> dict:
        """Convert user to dictionary"""
        data = {
            "id": self.id,
            "email": self.email,
            "username": self.username,
            "full_name": self.full_name,
            "avatar_url": self.avatar_url,
            "bio": self.bio,
            "role": self.role.value,
            "is_active": self.is_active,
            "is_verified": self.is_verified,
            "language": self.language,
            "theme": self.theme,
            "notifications_enabled": self.notifications_enabled,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "last_login": self.last_login.isoformat() if self.last_login else None,
        }
        
        # Add role-specific fields
        if self.role == UserRole.PROFESSOR:
            data.update({
                "department": self.department,
                "subject": self.subject
            })
        elif self.role == UserRole.STUDENT:
            data.update({
                "student_id": self.student_id,
                "group": self.group,
                "enrollment_year": self.enrollment_year
            })
        
        if include_sensitive:
            data.update({
                "is_superuser": self.is_superuser,
                "updated_at": self.updated_at.isoformat() if self.updated_at else None
            })
        
        return data
    
    # Validators
    @validates('email')
    def validate_email(self, key, email):
        """Validate email format"""
        if '@' not in email:
            raise ValueError("Invalid email format")
        return email.lower()
    
    @validates('username')
    def validate_username(self, key, username):
        """Validate username"""
        if len(username) < 3:
            raise ValueError("Username must be at least 3 characters")
        return username.lower()
    
    # Properties
    @property
    def is_professor(self) -> bool:
        """Check if user is professor"""
        return self.role == UserRole.PROFESSOR
    
    @property
    def is_student(self) -> bool:
        """Check if user is student"""
        return self.role == UserRole.STUDENT
    
    @property
    def is_admin(self) -> bool:
        """Check if user is admin"""
        return self.role == UserRole.ADMIN or self.is_superuser
