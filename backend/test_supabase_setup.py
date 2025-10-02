#!/usr/bin/env python3
"""
Test Supabase Setup and Try Alternative Configuration
"""

import os
import sys
from dotenv import load_dotenv
from supabase import create_client, Client
import logging

# Load environment variables
load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_supabase_connection():
    """Test Supabase connection and available features"""
    try:
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_anon_key = os.getenv("SUPABASE_ANON_KEY")
        
        if not supabase_url or not supabase_anon_key:
            logger.error("Missing Supabase credentials")
            return False
            
        client = create_client(supabase_url, supabase_anon_key)
        logger.info(f"✅ Supabase client created: {supabase_url}")
        
        # Test available tables
        tables_to_test = ['users', 'meals', 'daily_summaries', 'weight_entries']
        available_tables = []
        
        for table in tables_to_test:
            try:
                result = client.table(table).select("*", count="exact").limit(0).execute()
                logger.info(f"✅ Table '{table}' exists and accessible")
                available_tables.append(table)
            except Exception as e:
                logger.warning(f"❌ Table '{table}' not found: {str(e)}")
        
        if not available_tables:
            logger.error("❌ No Supabase tables found - manual SQL setup required")
            return False
        else:
            logger.info(f"✅ Found {len(available_tables)} tables: {available_tables}")
            return True
            
    except Exception as e:
        logger.error(f"❌ Supabase connection failed: {str(e)}")
        return False

def create_demo_user():
    """Try to create a demo user via auth system"""
    try:
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_anon_key = os.getenv("SUPABASE_ANON_KEY")
        
        client = create_client(supabase_url, supabase_anon_key)
        
        # Try to register a demo user
        demo_email = "demo@keto.fr" 
        demo_password = "demo123456"
        
        logger.info("Attempting to create demo user...")
        
        auth_response = client.auth.sign_up({
            "email": demo_email,
            "password": demo_password,
            "options": {
                "data": {
                    "full_name": "Marie Dubois",
                    "age": 30,
                    "gender": "female",
                    "height": 170.0,
                    "weight": 70.0,
                    "activity_level": "moderately_active",
                    "goal": "weight_loss"
                }
            }
        })
        
        if auth_response.user:
            logger.info(f"✅ Demo user created: {demo_email}")
            logger.info(f"User ID: {auth_response.user.id}")
            
            # Try to login immediately (since email confirmation is disabled)
            login_response = client.auth.sign_in_with_password({
                "email": demo_email,
                "password": demo_password
            })
            
            if login_response.session:
                logger.info("✅ Demo user can login successfully")
                return True
            else:
                logger.warning("⚠️ Demo user created but cannot login")
                return False
        else:
            logger.error("❌ Failed to create demo user")
            return False
            
    except Exception as e:
        if "already registered" in str(e).lower():
            logger.info("✅ Demo user already exists")
            
            # Try to login
            try:
                login_response = client.auth.sign_in_with_password({
                    "email": demo_email,
                    "password": demo_password
                })
                
                if login_response.session:
                    logger.info("✅ Demo user can login successfully")
                    return True
                else:
                    logger.warning("⚠️ Demo user exists but cannot login")
                    return False
            except Exception as login_e:
                logger.error(f"❌ Demo user login failed: {str(login_e)}")
                return False
        else:
            logger.error(f"❌ Demo user creation failed: {str(e)}")
            return False

def main():
    """Main test function"""
    logger.info("🚀 Testing Supabase setup...")
    
    # Test connection and tables
    tables_ok = test_supabase_connection()
    
    # Test demo user
    demo_user_ok = create_demo_user()
    
    if tables_ok and demo_user_ok:
        logger.info("🎉 Supabase setup appears to be working!")
        return True
    elif not tables_ok:
        logger.error("""
❌ TABLES NOT FOUND - Manual Setup Required:

1. Go to: https://vvpscheyjjqavfljpnxf.supabase.co
2. Open SQL Editor
3. Run this command:

CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
        """)
        return False
    else:
        logger.warning("⚠️ Tables found but auth issues remain")
        return True

if __name__ == "__main__":
    success = main()
    if not success:
        sys.exit(1)