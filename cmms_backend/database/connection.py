"""
Database connection and session management
Supports MySQL with connection pooling and auto-reconnect
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool
from contextlib import contextmanager
from typing import Generator
import logging

from config.app_config import config

logger = logging.getLogger(__name__)

# Database engine
engine = None
SessionLocal = None


def create_database_engine():
    """Create database engine with appropriate settings"""
    global engine, SessionLocal
    
    database_url = config.get_database_url()
    
    # Engine arguments
    engine_args = {
        "echo": config.DEBUG,  # Log SQL queries in debug mode
        "pool_pre_ping": True,  # Auto-reconnect
    }
    
    # MySQL specific settings
    if config.USE_MYSQL:
        engine_args.update({
            "poolclass": QueuePool,
            "pool_size": 5,
            "max_overflow": 10,
            "pool_recycle": 3600,  # Recycle connections after 1 hour
            "pool_timeout": 30,
        })
    
    try:
        engine = create_engine(database_url, **engine_args)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        logger.info(f"Database engine created: {database_url.split('@')[1] if '@' in database_url else database_url}")
        return engine
    except Exception as e:
        logger.error(f"Failed to create database engine: {e}")
        raise


def get_db() -> Generator[Session, None, None]:
    """
    Dependency for FastAPI to get database session
    Usage: db: Session = Depends(get_db)
    """
    if SessionLocal is None:
        create_database_engine()
    
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@contextmanager
def get_db_session() -> Generator[Session, None, None]:
    """
    Context manager for database session
    Usage:
        with get_db_session() as db:
            # use db
    """
    if SessionLocal is None:
        create_database_engine()
    
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def init_db():
    """Initialize database (create tables)"""
    from database import models  # Import models to register them
    
    if engine is None:
        create_database_engine()
    
    # Import all models to ensure they're registered
    from database.models_cmms import Base
    
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Failed to create database tables: {e}")
        raise


def test_connection() -> bool:
    """Test database connection"""
    try:
        if engine is None:
            create_database_engine()
        
        from sqlalchemy import text
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("Database connection test successful")
        return True
    except Exception as e:
        logger.error(f"Database connection test failed: {e}")
        return False


# Initialize engine on import
if engine is None:
    create_database_engine()

