"""
CMMS FastAPI Backend Server
Main entry point for the CMMS API
"""
import sys
import os
from pathlib import Path

# Add parent directory to Python path
parent_dir = Path(__file__).parent.parent
sys.path.insert(0, str(parent_dir))

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
import logging
from contextlib import asynccontextmanager

from config.app_config import config
from database.connection import get_db, init_db, test_connection
from api.routers import auth, users, machines, inventory, worksheets, pm, reports

# Configure logging
logging.basicConfig(
    level=getattr(logging, config.LOG_LEVEL),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan events for FastAPI"""
    # Startup
    logger.info("Starting CMMS API Backend...")
    
    # Test database connection (non-blocking, log warning if fails)
    try:
        if not test_connection():
            logger.warning("Database connection test failed, but continuing startup")
    except Exception as e:
        logger.warning(f"Database connection test error: {e}, but continuing startup")
    
    # Initialize database (create tables if they don't exist)
    try:
        init_db()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        # Don't fail startup if tables already exist
    
    logger.info(f"CMMS API Backend started on {config.API_HOST}:{config.API_PORT}")
    
    yield
    
    # Shutdown
    logger.info("Shutting down CMMS API Backend...")


# Create FastAPI app
app = FastAPI(
    title="CMMS API",
    description="CMMS Backend API for Mobile App",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS if "*" not in config.CORS_ORIGINS else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check endpoints
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "CMMS API is running",
        "status": "ok",
        "version": "1.0.0"
    }


@app.get("/health")
async def health():
    """Simple health check"""
    return {"status": "ok"}


@app.get("/api/health/")
async def health_detailed(db: Session = Depends(get_db)):
    """Detailed health check with database connection test"""
    try:
        # Test database connection
        from sqlalchemy import text
        db.execute(text("SELECT 1"))
        return {
            "status": "ok",
            "version": "1.0.0"
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection failed"
        )


# Include routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(machines.router)
app.include_router(inventory.router)
app.include_router(worksheets.router)
app.include_router(pm.router)
app.include_router(reports.router)

# API Routes
@app.get("/api/v1/info")
async def api_info():
    """API information"""
    return {
        "name": "cmms-api",
        "version": "1.0.0",
        "env": config.ENVIRONMENT,
        "database": "MySQL" if config.USE_MYSQL else "SQLite"
    }


# Error handlers
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"}
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "api.server:app",
        host=config.API_HOST,
        port=config.API_PORT,
        reload=config.DEBUG,
        log_level=config.LOG_LEVEL.lower()
    )

