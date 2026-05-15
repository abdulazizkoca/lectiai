"""
Application configuration management
Using Pydantic Settings for environment-based configuration
"""

import os
from functools import lru_cache
from typing import List, Optional

from pydantic import Field, PostgresDsn, validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Application
    APP_NAME: str = Field(default="Lectio AI", description="Application name")
    VERSION: str = Field(default="2.0.0", description="Application version")
    DEBUG: bool = Field(default=False, description="Debug mode")
    ENVIRONMENT: str = Field(default="development", description="Environment (development/production)")
    
    # Server
    HOST: str = Field(default="0.0.0.0", description="Server host")
    PORT: int = Field(default=8000, description="Server port")
    
    # Database
    DATABASE_URL: PostgresDsn = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/lectio_ai",
        description="PostgreSQL connection URL"
    )
    DB_POOL_SIZE: int = Field(default=20, description="Database connection pool size")
    DB_MAX_OVERFLOW: int = Field(default=30, description="Database max overflow connections")
    
    # Redis (for caching and sessions)
    REDIS_URL: str = Field(default="redis://localhost:6379/0", description="Redis connection URL")
    REDIS_PASSWORD: Optional[str] = Field(default=None, description="Redis password")
    
    # Security
    SECRET_KEY: str = Field(default="your-secret-key-change-in-production", description="JWT secret key")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=60, description="Access token expiration in minutes")
    REFRESH_TOKEN_EXPIRE_DAYS: int = Field(default=7, description="Refresh token expiration in days")
    ALGORITHM: str = Field(default="HS256", description="JWT algorithm")
    
    # Password hashing
    BCRYPT_ROUNDS: int = Field(default=12, description="Bcrypt hashing rounds")
    
    # CORS
    CORS_ORIGINS: List[str] = Field(
        default=["http://localhost:3000", "http://localhost:3001"],
        description="Allowed CORS origins"
    )
    
    # Camera processing
    MAX_FACES: int = Field(default=50, description="Maximum faces to detect")
    TARGET_FPS: int = Field(default=15, description="Target camera processing FPS")
    SNAPSHOT_THRESHOLD: float = Field(default=40.0, description="Attention threshold for snapshots")
    SNAPSHOT_DURATION: float = Field(default=15.0, description="Duration below threshold for snapshot")
    
    # AI Models
    YOLO_MODEL: str = Field(default="yolov8n.pt", description="YOLO model path")
    FACE_DETECTION_MODEL: str = Field(default="mediapipe", description="Face detection model")
    
    # Analytics
    ANALYTICS_RETENTION_DAYS: int = Field(default=90, description="Analytics data retention in days")
    MAX_SNAPSHOTS_PER_STUDENT: int = Field(default=10, description="Max snapshots per student per lesson")
    
    # File storage
    UPLOAD_DIR: str = Field(default="./uploads", description="Upload directory")
    MAX_FILE_SIZE_MB: int = Field(default=50, description="Max file upload size in MB")
    
    # Email (for notifications)
    SMTP_HOST: Optional[str] = Field(default=None, description="SMTP server host")
    SMTP_PORT: int = Field(default=587, description="SMTP server port")
    SMTP_USER: Optional[str] = Field(default=None, description="SMTP username")
    SMTP_PASSWORD: Optional[str] = Field(default=None, description="SMTP password")
    FROM_EMAIL: str = Field(default="noreply@lectio.ai", description="From email address")
    
    # Logging
    LOG_LEVEL: str = Field(default="INFO", description="Logging level")
    LOG_FORMAT: str = Field(
        default="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        description="Log format"
    )
    LOG_FILE: Optional[str] = Field(default=None, description="Log file path")
    
    # Monitoring
    ENABLE_METRICS: bool = Field(default=True, description="Enable Prometheus metrics")
    METRICS_PORT: int = Field(default=9090, description="Metrics server port")
    
    # Rate limiting
    RATE_LIMIT_PER_MINUTE: int = Field(default=60, description="Rate limit per minute")
    
    # WebSocket
    WS_HEARTBEAT_INTERVAL: int = Field(default=30, description="WebSocket heartbeat interval in seconds")
    WS_MAX_CONNECTIONS: int = Field(default=1000, description="Maximum WebSocket connections")
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
    
    @validator("CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v):
        """Parse CORS origins from string or list"""
        if isinstance(v, str) and not v.startswith("["):
            return [origin.strip() for origin in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)
    
    @property
    def is_development(self) -> bool:
        """Check if running in development mode"""
        return self.ENVIRONMENT.lower() == "development"
    
    @property
    def is_production(self) -> bool:
        """Check if running in production mode"""
        return self.ENVIRONMENT.lower() == "production"
    
    @property
    def database_url_async(self) -> str:
        """Get async database URL"""
        return str(self.DATABASE_URL)
    
    @property
    def database_url_sync(self) -> str:
        """Get sync database URL for migrations"""
        return str(self.DATABASE_URL).replace("+asyncpg", "+psycopg2")


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()


# Database configuration for different environments
class DatabaseConfig:
    """Database configuration helper"""
    
    @staticmethod
    def get_connection_args():
        """Get database connection arguments"""
        return {
            "pool_size": 20,
            "max_overflow": 30,
            "pool_timeout": 30,
            "pool_recycle": 1800,
            "pool_pre_ping": True,
        }
    
    @staticmethod
    def get_async_connection_args():
        """Get async database connection arguments"""
        return {
            "pool_size": 20,
            "max_overflow": 30,
            "pool_timeout": 30,
            "pool_recycle": 1800,
            "pool_pre_ping": True,
            "echo": False,  # Set to True for SQL debugging
        }


# Camera configuration
class CameraConfig:
    """Camera processing configuration"""
    
    # Resolution presets
    RESOLUTIONS = {
        "performance": (480, 360),
        "balanced": (640, 480),
        "quality": (1280, 720),
        "high": (1920, 1080)
    }
    
    # Processing modes
    MODES = {
        "performance": {
            "scale": 0.75,
            "skip_frames": 1,
            "max_faces": 50,
            "min_confidence": 0.5
        },
        "balanced": {
            "scale": 1.0,
            "skip_frames": 0,
            "max_faces": 50,
            "min_confidence": 0.6
        },
        "quality": {
            "scale": 1.0,
            "skip_frames": 0,
            "max_faces": 50,
            "min_confidence": 0.7
        }
    }
    
    # Attention scoring weights
    ATTENTION_WEIGHTS = {
        "eye_contact": 0.35,
        "head_pose": 0.25,
        "gaze_direction": 0.25,
        "movement": 0.10,
        "posture": 0.05
    }
    
    # Status thresholds
    STATUS_THRESHOLDS = {
        "green": 70,
        "yellow": 40,
        "red": 0
    }


# API Configuration
class APIConfig:
    """API configuration constants"""
    
    # Pagination
    DEFAULT_PAGE_SIZE = 20
    MAX_PAGE_SIZE = 100
    
    # Cache TTL (seconds)
    CACHE_TTL = {
        "lesson_summary": 60,
        "student_analytics": 300,
        "classroom_stats": 30,
        "user_profile": 600
    }
    
    # Rate limits
    RATE_LIMITS = {
        "default": "60/minute",
        "auth": "10/minute",
        "camera": "1000/minute",
        "analytics": "120/minute",
        "export": "10/minute"
    }
    
    # WebSocket message types
    WS_MESSAGE_TYPES = [
        "camera_update",
        "student_reaction",
        "professor_alert",
        "analytics_update",
        "snapshot_captured",
        "system_notification"
    ]
