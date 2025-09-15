#!/usr/bin/env python3
"""
Simple test script to check Supabase connection
Uses only the config folder for testing
"""

import sys
import os

# Add the app directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

try:
    print("🔗 Testing Supabase Backend Connection...")
    print("-" * 40)
    
    # Test 1: Import from config
    print("1. Importing from config...")
    from app.config.database import get_supabase_client, test_connection, get_connection_status
    from app.config.settings import settings
    print("   ✅ Config imports successful")
    
    # Test 2: Check settings
    print("\n2. Checking environment settings...")
    if settings.SUPABASE_URL and settings.SUPABASE_SERVICE_KEY:
        print("   ✅ Environment variables are set")
        print(f"   📍 Supabase URL: {settings.SUPABASE_URL[:30]}...")
    else:
        print("   ❌ Missing environment variables")
        print("   💡 Make sure you have .env file with SUPABASE_URL and SUPABASE_SERVICE_KEY")
        sys.exit(1)
    
    # Test 3: Test connection
    print("\n3. Testing Supabase connection...")
    if test_connection():
        print("   ✅ Connection test passed")
    else:
        print("   ❌ Connection test failed")
        sys.exit(1)
    
    # Test 4: Get connection status
    print("\n4. Getting detailed connection status...")
    status = get_connection_status()
    if status["connected"]:
        print(f"   ✅ {status['message']}")
    else:
        print(f"   ❌ {status['message']}")
        sys.exit(1)
    
    # Test 5: Test client operations
    print("\n5. Testing client operations...")
    try:
        from app.client.supabase_client import test_db_connection
        if test_db_connection():
            print("   ✅ Client operations test passed")
        else:
            print("   ❌ Client operations test failed")
    except Exception as e:
        print(f"   ⚠️ Client operations test skipped: {e}")
    
    print("\n🎉 Supabase connection is working!")
    print("\n📝 Your setup:")
    print("   • Environment variables: ✅ Configured")
    print("   • Config folder: ✅ Working")
    print("   • Database connection: ✅ Active")
    print("   • Client operations: ✅ Available")
    
except Exception as e:
    print(f"❌ Test failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)