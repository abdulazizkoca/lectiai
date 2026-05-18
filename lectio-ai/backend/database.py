from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
import os
import logging
from dotenv import load_dotenv

logger = logging.getLogger("lectio.database")

load_dotenv()

# asyncpg o'rniga psycopg2 ishlatamiz (synchronous)
# Agar sqilte bo'lsa, xuddi shunday qoladi
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./lectio.db")

# Fix for Heroku/Railway style URLs which might use postgres:// instead of postgresql://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Remove async drivers if present as we use synchronous SQLAlchemy (psycopg2 / sqlite3)
if "postgresql+asyncpg" in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("postgresql+asyncpg", "postgresql")
if "sqlite+aiosqlite" in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("sqlite+aiosqlite", "sqlite")

engine_kwargs = {}
if DATABASE_URL.startswith("postgresql"):
    engine_kwargs = {
        "pool_size": 10,
        "max_overflow": 20,
        "pool_pre_ping": True,
        "pool_recycle": 3600,
        "connect_args": {
            "connect_timeout": 10  # 10 seconds timeout for remote connection
        }
    }
elif DATABASE_URL.startswith("sqlite"):
    engine_kwargs = {"connect_args": {"check_same_thread": False}}

try:
    engine = create_engine(DATABASE_URL, **engine_kwargs)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
except Exception as e:
    logger.critical(f"Failed to create database engine: {e}")
    engine = None
    SessionLocal = None

Base = declarative_base()

def get_db():
    """Database sessiya dependency with automatic closure and error handling"""
    if SessionLocal is None:
        raise Exception("Database connection is not configured. Check DATABASE_URL.")
        
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        db.rollback()
        logger.error(f"Database transaction error: {e}")
        raise
    finally:
        db.close()
