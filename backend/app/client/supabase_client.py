from ..config.database import get_supabase_client
import logging

logger = logging.getLogger(__name__)

class DatabaseOperations:
    """Database operations using Supabase client"""
    
    def __init__(self):
        self.supabase = get_supabase_client()
    
    def test_connection(self) -> bool:
        """Test database connection"""
        try:
            # Simple test - try to get auth session
            response = self.supabase.auth.get_session()
            logger.info("✅ Database connection test successful")
            return True
        except Exception as e:
            logger.error(f"❌ Database connection test failed: {e}")
            return False
    
    def get_tables(self):
        """Get list of tables (requires appropriate permissions)"""
        try:
            # This is a basic test - actual implementation depends on your schema
            response = self.supabase.rpc('get_schema', {}).execute()
            return response.data
        except Exception as e:
            logger.warning(f"⚠️ Could not fetch schema: {e}")
            return None

# Create global database operations instance
db_ops = DatabaseOperations()

def test_db_connection() -> bool:
    """Test database connection - convenience function"""
    return db_ops.test_connection()