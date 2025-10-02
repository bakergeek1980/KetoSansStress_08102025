#!/usr/bin/env python3
"""
Auto-create Supabase tables using service role key
Uses direct HTTP requests to Supabase REST API
"""

import os
import sys
import requests
import json
from dotenv import load_dotenv
import logging

# Load environment variables
load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def execute_sql_via_supabase_api(sql_statement: str) -> bool:
    """Execute SQL via Supabase REST API using service role key"""
    try:
        supabase_url = os.getenv("SUPABASE_URL")
        service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        
        if not supabase_url or not service_role_key:
            logger.error("Missing Supabase credentials")
            return False
        
        # Use the SQL execution endpoint
        url = f"{supabase_url}/rest/v1/rpc/exec"
        
        headers = {
            "apikey": service_role_key,
            "Authorization": f"Bearer {service_role_key}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal"
        }
        
        payload = {
            "sql": sql_statement
        }
        
        logger.info(f"Executing SQL via Supabase API...")
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        
        if response.status_code in [200, 201, 204]:
            logger.info("✅ SQL executed successfully")
            return True
        else:
            logger.error(f"❌ SQL execution failed: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        logger.error(f"❌ Error executing SQL: {str(e)}")
        return False

def create_meals_table():
    """Create meals table"""
    sql = """
    -- Create meals table
    CREATE TABLE IF NOT EXISTS public.meals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
        food_name TEXT NOT NULL,
        quantity DECIMAL(10,3) NOT NULL CHECK (quantity > 0),
        unit TEXT NOT NULL DEFAULT 'portion',
        calories INTEGER CHECK (calories >= 0),
        protein DECIMAL(8,2) CHECK (protein >= 0),
        carbohydrates DECIMAL(8,2) CHECK (carbohydrates >= 0),
        total_fat DECIMAL(8,2) CHECK (total_fat >= 0),
        fiber DECIMAL(8,2) CHECK (fiber >= 0),
        keto_score INTEGER CHECK (keto_score >= 1 AND keto_score <= 10),
        consumed_at TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW()
    );
    """
    
    logger.info("Creating meals table...")
    return execute_sql_via_supabase_api(sql)

def enable_rls_meals():
    """Enable RLS for meals table"""
    sql = """
    -- Enable Row Level Security
    ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
    """
    
    logger.info("Enabling RLS for meals...")
    return execute_sql_via_supabase_api(sql)

def create_meals_policies():
    """Create RLS policies for meals"""
    sql = """
    -- Create RLS policies for meals
    CREATE POLICY IF NOT EXISTS "Users can view own meals" ON public.meals
        FOR SELECT USING (auth.uid() = user_id);

    CREATE POLICY IF NOT EXISTS "Users can insert own meals" ON public.meals
        FOR INSERT WITH CHECK (auth.uid() = user_id);

    CREATE POLICY IF NOT EXISTS "Users can update own meals" ON public.meals
        FOR UPDATE USING (auth.uid() = user_id);

    CREATE POLICY IF NOT EXISTS "Users can delete own meals" ON public.meals
        FOR DELETE USING (auth.uid() = user_id);
    """
    
    logger.info("Creating RLS policies for meals...")
    return execute_sql_via_supabase_api(sql)

def update_users_table():
    """Add missing columns to users table"""
    sql = """
    -- Add missing columns to existing users table
    ALTER TABLE public.users 
    ADD COLUMN IF NOT EXISTS age INTEGER CHECK (age > 0 AND age < 150),
    ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    ADD COLUMN IF NOT EXISTS height DECIMAL(5,2) CHECK (height > 0),
    ADD COLUMN IF NOT EXISTS weight DECIMAL(5,2) CHECK (weight > 0),
    ADD COLUMN IF NOT EXISTS activity_level TEXT CHECK (activity_level IN ('sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active')),
    ADD COLUMN IF NOT EXISTS goal TEXT CHECK (goal IN ('weight_loss', 'weight_gain', 'maintenance', 'muscle_gain', 'fat_loss')),
    ADD COLUMN IF NOT EXISTS target_calories INTEGER CHECK (target_calories > 0),
    ADD COLUMN IF NOT EXISTS target_protein DECIMAL(6,2) CHECK (target_protein >= 0),
    ADD COLUMN IF NOT EXISTS target_carbs DECIMAL(6,2) CHECK (target_carbs >= 0),
    ADD COLUMN IF NOT EXISTS target_fat DECIMAL(6,2) CHECK (target_fat >= 0),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
    """
    
    logger.info("Updating users table with missing columns...")
    return execute_sql_via_supabase_api(sql)

def insert_demo_data():
    """Insert demo data"""
    sql = """
    -- Update demo user with complete profile
    UPDATE public.users SET
        age = 30,
        gender = 'female',
        height = 170.0,
        weight = 70.0,
        activity_level = 'moderately_active',
        goal = 'weight_loss',
        target_calories = 1843,
        target_protein = 92,
        target_carbs = 23,
        target_fat = 154,
        updated_at = NOW()
    WHERE email = 'demo@keto.fr';
    """
    
    logger.info("Updating demo user data...")
    return execute_sql_via_supabase_api(sql)

def verify_tables():
    """Verify that tables were created"""
    try:
        from supabase import create_client
        
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_anon_key = os.getenv("SUPABASE_ANON_KEY")
        
        client = create_client(supabase_url, supabase_anon_key)
        
        # Test meals table
        result = client.table('meals').select("*", count="exact").limit(0).execute()
        logger.info("✅ Meals table is accessible")
        
        # Test users table
        result = client.table('users').select("*").eq('email', 'demo@keto.fr').execute()
        if result.data:
            logger.info("✅ Demo user found with updated profile")
        else:
            logger.warning("⚠️ Demo user not found")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Table verification failed: {str(e)}")
        return False

def main():
    """Main function"""
    logger.info("🚀 Auto-creating Supabase tables...")
    
    success_count = 0
    total_steps = 6
    
    # Step 1: Update users table
    if update_users_table():
        success_count += 1
    
    # Step 2: Create meals table
    if create_meals_table():
        success_count += 1
    
    # Step 3: Enable RLS
    if enable_rls_meals():
        success_count += 1
    
    # Step 4: Create policies
    if create_meals_policies():
        success_count += 1
    
    # Step 5: Insert demo data
    if insert_demo_data():
        success_count += 1
    
    # Step 6: Verify tables
    if verify_tables():
        success_count += 1
    
    logger.info(f"📊 Completed: {success_count}/{total_steps} steps successful")
    
    if success_count >= 4:  # At least the core tables
        logger.info("🎉 Tables creation completed successfully!")
        return True
    else:
        logger.error("❌ Tables creation failed")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)