"""
CMMS Backend Application Configuration
Supports both SQLite (development) and MySQL (production)
"""
import os
from typing import Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


class AppConfig:
    """Application configuration class"""
    
    # Database configuration
    USE_MYSQL: bool = os.getenv("USE_MYSQL", "true").lower() == "true"
    DATABASE_URL: Optional[str] = os.getenv("DATABASE_URL")
    
    # MySQL specific settings
    MYSQL_HOST: str = os.getenv("MYSQL_HOST", "116.203.226.140")
    MYSQL_PORT: int = int(os.getenv("MYSQL_PORT", "3306"))
    MYSQL_DATABASE: str = os.getenv("MYSQL_DATABASE", "zedin_cmms")
    MYSQL_USER: str = os.getenv("MYSQL_USER", "zedin_cmms")
    MYSQL_PASSWORD: str = os.getenv("MYSQL_PASSWORD", "Gele007ta...")
    
    # API configuration
    API_HOST: str = os.getenv("API_HOST", "0.0.0.0")
    API_PORT: int = int(os.getenv("API_PORT", "8000"))
    
    # Application settings
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "production")
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    
    # Security
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "change-this-secret-key-in-production")
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("JWT_REFRESH_TOKEN_EXPIRE_DAYS", "7"))
    
    # CORS
    CORS_ORIGINS: list = os.getenv("CORS_ORIGINS", "*").split(",")
    
    @classmethod
    def get_database_url(cls) -> str:
        """
        Get database connection URL
        Returns MySQL URL if USE_MYSQL is True, otherwise SQLite
        """
        if cls.DATABASE_URL:
            return cls.DATABASE_URL
        
        if cls.USE_MYSQL:
            # MySQL connection string
            return (
                f"mysql+pymysql://{cls.MYSQL_USER}:{cls.MYSQL_PASSWORD}"
                f"@{cls.MYSQL_HOST}:{cls.MYSQL_PORT}/{cls.MYSQL_DATABASE}"
            )
        else:
            # SQLite fallback (for development)
            return "sqlite:///./cmms.db"
    
    @classmethod
    def validate(cls) -> bool:
        """Validate configuration"""
        if cls.USE_MYSQL:
            required_vars = [
                cls.MYSQL_HOST,
                cls.MYSQL_DATABASE,
                cls.MYSQL_USER,
                cls.MYSQL_PASSWORD
            ]
            if not all(required_vars):
                raise ValueError("MySQL configuration is incomplete")
        return True


# Initialize and validate config
config = AppConfig()
config.validate()

