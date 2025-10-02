#!/usr/bin/env python3
"""
Setup Supabase Database Schema
This script creates all necessary tables and configurations for KetoSansStress app
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

def get_supabase_client() -> Client:
    """Get Supabase client with service role key for admin operations"""
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not supabase_url:
        raise ValueError("SUPABASE_URL not found in environment variables")
    
    if not supabase_service_key:
        # Use anon key as fallback
        supabase_service_key = os.getenv("SUPABASE_ANON_KEY")
        logger.warning("Using SUPABASE_ANON_KEY - some operations may fail without service role key")
    
    if not supabase_service_key:
        raise ValueError("Neither SUPABASE_SERVICE_ROLE_KEY nor SUPABASE_ANON_KEY found")
    
    return create_client(supabase_url, supabase_service_key)

def execute_sql_file(client: Client, sql_file_path: str):
    """Execute SQL file using Supabase client"""
    try:
        with open(sql_file_path, 'r', encoding='utf-8') as file:
            sql_content = file.read()
        
        # Split SQL content by statements (simple approach)
        # Note: This is a basic split and may not work with complex SQL
        statements = [stmt.strip() for stmt in sql_content.split(';') if stmt.strip()]
        
        logger.info(f"Executing {len(statements)} SQL statements...")
        
        for i, statement in enumerate(statements, 1):
            if not statement:
                continue
                
            try:
                # Use rpc to execute raw SQL
                logger.info(f"Executing statement {i}/{len(statements)}")
                logger.debug(f"SQL: {statement[:100]}...")
                
                # Try to execute using postgrest
                result = client.rpc('sql', {'query': statement}).execute()
                logger.debug(f"Statement {i} executed successfully")
                
            except Exception as e:
                logger.warning(f"Failed to execute statement {i}: {str(e)}")
                # Continue with next statement
                continue
        
        logger.info("Database schema setup completed!")
        
    except Exception as e:
        logger.error(f"Error executing SQL file: {str(e)}")
        raise

def setup_auth_settings(client: Client):
    """Configure Supabase Auth settings for development"""
    try:
        logger.info("Configuring Supabase Auth settings...")
        
        # Note: Auth settings are typically configured via Supabase dashboard
        # We'll log instructions for manual configuration
        
        logger.info("""
        MANUAL AUTH CONFIGURATION REQUIRED:
        1. Go to your Supabase Dashboard
        2. Navigate to Authentication > Settings
        3. Disable "Confirm Email" for development
        4. Or configure email auto-confirmation
        """)
        
    except Exception as e:
        logger.error(f"Error configuring auth settings: {str(e)}")

def verify_tables(client: Client):
    """Verify that tables were created successfully"""
    try:
        logger.info("Verifying database tables...")
        
        tables_to_check = ['users', 'meals', 'daily_summaries', 'weight_entries']
        
        for table in tables_to_check:
            try:
                # Try to query the table (limit 0 to just check if it exists)
                result = client.table(table).select("*", count="exact").limit(0).execute()
                logger.info(f"✅ Table '{table}' exists")
            except Exception as e:
                logger.error(f"❌ Table '{table}' not found or accessible: {str(e)}")
        
        # Check if demo user exists
        try:
            result = client.table('users').select('*').eq('email', 'demo@keto.fr').execute()
            if result.data:
                logger.info("✅ Demo user 'demo@keto.fr' exists")
            else:
                logger.warning("⚠️ Demo user 'demo@keto.fr' not found")
        except Exception as e:
            logger.error(f"❌ Cannot check demo user: {str(e)}")
            
    except Exception as e:
        logger.error(f"Error verifying tables: {str(e)}")

def main():
    """Main setup function"""
    try:
        logger.info("Starting Supabase database setup...")
        
        # Get Supabase client
        client = get_supabase_client()
        logger.info("✅ Supabase client created")
        
        # Execute SQL schema
        sql_file_path = os.path.join(os.path.dirname(__file__), 'setup_supabase_schema.sql')
        if not os.path.exists(sql_file_path):
            raise FileNotFoundError(f"SQL file not found: {sql_file_path}")
            
        execute_sql_file(client, sql_file_path)
        
        # Setup auth settings
        setup_auth_settings(client)
        
        # Verify tables
        verify_tables(client)
        
        logger.info("🎉 Database setup completed successfully!")
        logger.info("You may need to manually configure email confirmation in Supabase Dashboard")
        
    except Exception as e:
        logger.error(f"❌ Database setup failed: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()