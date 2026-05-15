"""
Database configuration and session management
Async PostgreSQL with SQLAlchemy
"""

from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    AsyncEngine,
    create_async_engine,
    async_sessionmaker
)
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.pool import NullPool

from .config import get_settings

# Get settings
settings = get_settings()

# Create async engine
engine: AsyncEngine = create_async_engine(
    settings.database_url_async,
    **settings.get_async_connection_args(),
    future=True,
    echo=settings.DEBUG
)

# Create async session maker
async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

# Base class for models
Base = declarative_base()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency for getting database session
    Usage: async with get_db() as db: ...
    """
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


class DatabaseManager:
    """Database manager for advanced operations"""
    
    @staticmethod
    async def init_db():
        """Initialize database with all tables"""
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    
    @staticmethod
    async def drop_db():
        """Drop all tables (use with caution)"""
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
    
    @staticmethod
    async def reset_db():
        """Reset database (drop and recreate)"""
        await DatabaseManager.drop_db()
        await DatabaseManager.init_db()
    
    @staticmethod
    async def health_check() -> bool:
        """Check database connectivity"""
        try:
            async with engine.connect() as conn:
                result = await conn.execute("SELECT 1")
                return result.scalar() == 1
        except Exception:
            return False


# Connection pool monitoring
class ConnectionPoolStats:
    """Monitor database connection pool statistics"""
    
    @staticmethod
    def get_pool_stats():
        """Get connection pool statistics"""
        pool = engine.pool
        return {
            "size": pool.size() if hasattr(pool, 'size') else 0,
            "checked_in": pool.checkedin() if hasattr(pool, 'checkedin') else 0,
            "checked_out": pool.checkedout() if hasattr(pool, 'checkedout') else 0,
            "overflow": pool.overflow() if hasattr(pool, 'overflow') else 0
        }
