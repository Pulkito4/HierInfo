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
  
    
    # Add other configuration variables here as needed
    # API Configuration
    API_HOST: str = os.getenv("API_HOST", "localhost")
    API_PORT: int = int(os.getenv("API_PORT", "8000"))
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"
    
    def __init__(self):
        self.validate_required_settings()
    
    def validate_required_settings(self):
        """Validate that all required environment variables are set"""
        if not self.SUPABASE_URL:
            raise ValueError("SUPABASE_URL environment variable is not set")
        if not self.SUPABASE_SERVICE_KEY:
            raise ValueError("SUPABASE_SERVICE_KEY environment variable is not set")
       
        
        logger.info("✅ All required environment variables are loaded")

# Create global settings instance
settings = Settings()
