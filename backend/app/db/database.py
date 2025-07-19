# app/db/database.py
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy.pool import NullPool
from app.core.config import settings

# Create async engine
# Use postgresql+asyncpg:// for PostgreSQL async connections
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,  # Set to True to see SQL queries
    future=True,
    poolclass=NullPool,  # Disable connection pooling for serverless environments
)

# Create async session factory
AsyncSessionLocal = async_sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    expire_on_commit=False,
)

# Base class for all models
Base = declarative_base()

# Dependency for FastAPI endpoints
async def get_db():
    """Dependency function that yields db sessions"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
