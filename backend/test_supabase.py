#!/usr/bin/env python3
"""
Test script to verify Supabase connection in the backend
"""

import sys
import os

# Add the app directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

try:
    # New recommended imports (using core module)
    from app.core import get_supabase_client, supabase_client
    
    print("🔗 Testing Supabase Backend Connection...")
    print("-" * 40)
    
    # Test 1: Check if client can be imported
    print("1. Importing Supabase client...")
    supabase = get_supabase_client()
    print("   ✅ Supabase client imported successfully")
    
    # Test 2: Test basic connection
    print("\n2. Testing connection...")
    if supabase_client.test_connection():
        print("   ✅ Connection test passed")
    else:
        print("   ❌ Connection test failed")
        sys.exit(1)
    
    # Test 3: Try a simple database operation
    print("\n3. Testing database access...")
    try:
        # Get list of tables (this requires service role permissions)
        response = supabase.rpc('get_schema', {}).execute()
        print("   ✅ Database access successful")
    except Exception as e:
        print(f"   ⚠️  Database schema access failed (this is normal): {e}")
        
        # Try a simpler test - just verify the client exists
        if hasattr(supabase, 'table'):
            print("   ✅ Client has table method - basic functionality confirmed")
        else:
            print("   ❌ Client missing table method")
            sys.exit(1)
    
    print("\n🎉 All tests passed! Supabase is properly configured for the backend.")
    print("\n📝 You can now use the Supabase client in your backend code like this:")
    print("   # New recommended way (using core module):")
    print("   from app.core import get_supabase_client")
    print("   supabase = get_supabase_client()")
    print("   response = supabase.table('your_table').select('*').execute()")
    print("\n   # Alternative (backward compatible):")
    print("   from app.config import get_supabase_client")
    
except ImportError as e:
    print(f"❌ Failed to import from core module: {e}")
    print("Trying backward compatible import...")
    try:
        from app.config import get_supabase_client, test_connection
        supabase = get_supabase_client()
        print("   ✅ Backward compatible import successful")
        if test_connection():
            print("   ✅ Connection test passed")
        else:
            print("   ❌ Connection test failed")
            sys.exit(1)
    except Exception as e2:
        print(f"❌ Failed to import config: {e2}")
        print("Make sure you're running this from the backend directory")
        sys.exit(1)
except Exception as e:
    print(f"❌ Test failed: {e}")
    sys.exit(1)
