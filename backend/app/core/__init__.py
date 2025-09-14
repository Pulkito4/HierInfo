"""
Core module for HierInfo backend application.

This module contains:
- config.py: Environment variables and application settings
- supabase_client.py: Supabase client initialization and management
"""

from .config import settings
from .supabase_client import get_supabase_client, supabase_client

__all__ = [
    "settings",
    "get_supabase_client", 
    "supabase_client"
]
