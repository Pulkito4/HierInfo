from .settings import settings
from supabase import create_client, Client
import logging


# Set up logging
# set up file based logs for debugging - logger utility | file logs + console logs
logger = logging.getLogger(__name__)

class SupabaseClient:
    """Supabase client wrapper with connection management"""
    
    def __init__(self):
        self._client: Client = None
        self._initialize_client()
    
    def _initialize_client(self):
        """Initialize the Supabase client"""
        try:
            self._client = create_client(
                settings.SUPABASE_URL, 
                settings.SUPABASE_SERVICE_KEY
            )
            logger.info("✅ Supabase client created successfully")
            
            # Test the connection
            self._test_connection()
            
        except Exception as e:
            logger.error(f"❌ Failed to create Supabase client: {e}")
            raise
    
    def _test_connection(self):
        """Test the Supabase connection"""
        try:
            # Test the connection by making a simple query
            test_response = self._client.auth.get_session()
            logger.info("✅ Supabase connection verified")
            
        except Exception as e:
            logger.error(f"❌ Supabase connection test failed: {e}")
            raise
    
    @property
    def client(self) -> Client:
        """Get the Supabase client instance"""
        if self._client is None:
            self._initialize_client()
        return self._client
    
    def test_connection(self) -> bool:
        """Test the Supabase connection and return success status"""
        try:
            # Try a simple operation to test connection
            response = self._client.auth.get_session()
            logger.info("✅ Supabase connection test successful")
            return True
        except Exception as e:
            logger.error(f"❌ Supabase connection test failed: {e}")
            return False
    
    def reconnect(self):
        """Reconnect to Supabase by reinitializing the client"""
        logger.info("🔄 Reconnecting to Supabase...")
        self._initialize_client()

# Create global Supabase client instance
supabase_client = SupabaseClient()

def get_supabase_client() -> Client:
    """Get the configured Supabase client instance"""
    return supabase_client.client

def test_connection() -> bool:
    """Simple function to test Supabase connection"""
    return supabase_client.test_connection()

def get_connection_status():
    """Get detailed connection status information"""
    try:
        client = get_supabase_client()
        # Test with a simple auth check
        response = client.auth.get_session()
        return {
            "connected": True,
            "message": "Supabase connection successful",
            "client_available": True
        }
    except Exception as e:
        return {
            "connected": False,
            "message": f"Supabase connection failed: {str(e)}",
            "client_available": False
        }
