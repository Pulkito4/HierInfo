import os
from dotenv import load_dotenv
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

class Settings:
    """Application settings loaded from environment variables"""
    
    # Supabase Configuration
    SUPABASE_URL: str = os.getenv("SUPABASE_URL")
    SUPABASE_SERVICE_KEY: str = os.getenv("SUPABASE_SERVICE_KEY")

    
    # API Configuration
    API_HOST: str = os.getenv("API_HOST", "localhost")
    API_PORT: int = int(os.getenv("API_PORT", "8000"))
    API_V1_PREFIX: str = "/api/v1"
    PROJECT_NAME: str = "HierInfo Backend"
    VERSION: str = "1.0.0"
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"
    
    # News API Configuration (for future GNews integration)
    GNEWS_API_KEY: str = os.getenv("GNEWS_API_KEY")
    GNEWS_BASE_URL: str = "https://gnews.io/api/v4"
    
    # Security Configuration
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-here")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Environment
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    
    # Logging
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    
    def __init__(self):
        self.validate_required_settings()
    
    def validate_required_settings(self):
        """Validate that all required environment variables are set"""
        required_vars = {
            "SUPABASE_URL": self.SUPABASE_URL,
            "SUPABASE_SERVICE_KEY": self.SUPABASE_SERVICE_KEY,
        }
        
        missing_vars = [var for var, value in required_vars.items() if not value]
        
        if missing_vars:
            raise ValueError(f"Missing required environment variables: {', '.join(missing_vars)}")
        
        # Warn about optional but recommended variables
        if not self.GNEWS_API_KEY:
            logger.warning("⚠️ GNEWS_API_KEY not set - news fetching will be limited")
        
        if self.SECRET_KEY == "your-secret-key-here":
            logger.warning("⚠️ Using default SECRET_KEY - change this in production!")
        
        logger.info("✅ All required environment variables are loaded")

# Create global settings instance
settings = Settings()