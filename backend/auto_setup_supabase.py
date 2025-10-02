#!/usr/bin/env python3
"""
Automatic Supabase Database Setup with Service Role Key
This script creates all necessary tables and configurations automatically
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

def get_admin_supabase_client() -> Client:
    """Get Supabase client with service role key for admin operations"""
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not supabase_url or not supabase_service_key:
        raise ValueError("Missing Supabase admin credentials")
    
    if supabase_service_key == "SERVICE_ROLE_KEY_PLACEHOLDER":
        raise ValueError("Please update SUPABASE_SERVICE_ROLE_KEY in .env file")
    
    return create_client(supabase_url, supabase_service_key)

def execute_sql(client: Client, sql: str, description: str = "SQL operation"):
    """Execute SQL using Supabase client"""
    try:
        logger.info(f"Executing: {description}")
        
        # Use the rpc function to execute SQL
        result = client.rpc('sql', {'query': sql}).execute()
        logger.info(f"✅ Success: {description}")
        return True
        
    except Exception as e:
        # Some operations may fail if they already exist, that's OK
        if "already exists" in str(e).lower() or "duplicate" in str(e).lower():
            logger.info(f"✅ Already exists: {description}")
            return True
        else:
            logger.error(f"❌ Failed: {description} - {str(e)}")
            return False

def create_tables(client: Client):
    """Create all necessary tables"""
    
    # Create users table
    users_sql = """
    CREATE TABLE IF NOT EXISTS public.users (
        id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        email TEXT NOT NULL UNIQUE,
        full_name TEXT NOT NULL,
        age INTEGER CHECK (age > 0 AND age < 150),
        gender TEXT CHECK (gender IN ('male', 'female', 'other')),
        height DECIMAL(5,2) CHECK (height > 0),
        weight DECIMAL(5,2) CHECK (weight > 0),
        activity_level TEXT CHECK (activity_level IN ('sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active')),
        goal TEXT CHECK (goal IN ('weight_loss', 'weight_gain', 'maintenance', 'muscle_gain', 'fat_loss')),
        timezone TEXT DEFAULT 'UTC',
        target_calories INTEGER CHECK (target_calories > 0),
        target_protein DECIMAL(6,2) CHECK (target_protein >= 0),
        target_carbs DECIMAL(6,2) CHECK (target_carbs >= 0),
        target_fat DECIMAL(6,2) CHECK (target_fat >= 0),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    """
    execute_sql(client, users_sql, "Create users table")
    
    # Enable RLS for users
    execute_sql(client, "ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;", "Enable RLS for users")
    
    # Create meals table
    meals_sql = """
    CREATE TABLE IF NOT EXISTS public.meals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
        food_name TEXT NOT NULL,
        brand TEXT,
        serving_size TEXT,
        quantity DECIMAL(10,3) NOT NULL CHECK (quantity > 0),
        unit TEXT NOT NULL,
        calories INTEGER CHECK (calories >= 0),
        protein DECIMAL(8,2) CHECK (protein >= 0),
        carbohydrates DECIMAL(8,2) CHECK (carbohydrates >= 0),
        total_fat DECIMAL(8,2) CHECK (total_fat >= 0),
        saturated_fat DECIMAL(8,2) CHECK (saturated_fat >= 0),
        fiber DECIMAL(8,2) CHECK (fiber >= 0),
        sugar DECIMAL(8,2) CHECK (sugar >= 0),
        sodium DECIMAL(8,2) CHECK (sodium >= 0),
        potassium DECIMAL(8,2) CHECK (potassium >= 0),
        net_carbs DECIMAL(8,2) GENERATED ALWAYS AS (GREATEST(carbohydrates - fiber, 0)) STORED,
        consumed_at TIMESTAMPTZ DEFAULT NOW(),
        notes TEXT,
        preparation_method TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    """
    execute_sql(client, meals_sql, "Create meals table")
    
    # Enable RLS for meals
    execute_sql(client, "ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;", "Enable RLS for meals")
    
    # Create daily summaries table
    summaries_sql = """
    CREATE TABLE IF NOT EXISTS public.daily_summaries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        summary_date DATE NOT NULL,
        total_calories INTEGER DEFAULT 0,
        total_protein DECIMAL(8,2) DEFAULT 0,
        total_carbohydrates DECIMAL(8,2) DEFAULT 0,
        total_fat DECIMAL(8,2) DEFAULT 0,
        total_net_carbs DECIMAL(8,2) DEFAULT 0,
        total_fiber DECIMAL(8,2) DEFAULT 0,
        protein_percentage DECIMAL(5,2),
        carbs_percentage DECIMAL(5,2),
        fat_percentage DECIMAL(5,2),
        calories_goal INTEGER,
        protein_goal DECIMAL(8,2),
        carbs_goal DECIMAL(8,2),
        fat_goal DECIMAL(8,2),
        calories_achieved_percentage DECIMAL(5,2),
        meals_logged INTEGER DEFAULT 0,
        is_ketogenic_day BOOLEAN,
        water_intake_ml INTEGER DEFAULT 0,
        exercise_minutes INTEGER DEFAULT 0,
        steps_count INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, summary_date)
    );
    """
    execute_sql(client, summaries_sql, "Create daily summaries table")
    
    # Enable RLS for daily summaries
    execute_sql(client, "ALTER TABLE public.daily_summaries ENABLE ROW LEVEL SECURITY;", "Enable RLS for daily summaries")

def create_policies(client: Client):
    """Create RLS policies"""
    
    policies = [
        # Users policies
        ('CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);', "Users view policy"),
        ('CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);', "Users update policy"),
        ('CREATE POLICY "Users can insert own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);', "Users insert policy"),
        
        # Meals policies
        ('CREATE POLICY "Users can view own meals" ON public.meals FOR SELECT USING (auth.uid() = user_id);', "Meals view policy"),
        ('CREATE POLICY "Users can insert own meals" ON public.meals FOR INSERT WITH CHECK (auth.uid() = user_id);', "Meals insert policy"),
        ('CREATE POLICY "Users can update own meals" ON public.meals FOR UPDATE USING (auth.uid() = user_id);', "Meals update policy"),
        ('CREATE POLICY "Users can delete own meals" ON public.meals FOR DELETE USING (auth.uid() = user_id);', "Meals delete policy"),
        
        # Daily summaries policies
        ('CREATE POLICY "Users can view own daily summaries" ON public.daily_summaries FOR SELECT USING (auth.uid() = user_id);', "Daily summaries view policy"),
        ('CREATE POLICY "Users can insert own daily summaries" ON public.daily_summaries FOR INSERT WITH CHECK (auth.uid() = user_id);', "Daily summaries insert policy"),
        ('CREATE POLICY "Users can update own daily summaries" ON public.daily_summaries FOR UPDATE USING (auth.uid() = user_id);', "Daily summaries update policy"),
    ]
    
    for sql, description in policies:
        execute_sql(client, sql, description)

def create_triggers(client: Client):
    """Create triggers and functions"""
    
    # Function to update updated_at timestamp
    function_sql = """
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ language 'plpgsql';
    """
    execute_sql(client, function_sql, "Create update timestamp function")
    
    # Triggers
    triggers = [
        ('CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();', "Users update trigger"),
        ('CREATE TRIGGER update_meals_updated_at BEFORE UPDATE ON public.meals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();', "Meals update trigger"),
        ('CREATE TRIGGER update_daily_summaries_updated_at BEFORE UPDATE ON public.daily_summaries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();', "Daily summaries update trigger"),
    ]
    
    for sql, description in triggers:
        execute_sql(client, sql, description)

def create_indexes(client: Client):
    """Create performance indexes"""
    
    indexes = [
        ('CREATE INDEX IF NOT EXISTS idx_meals_user_id ON public.meals(user_id);', "Meals user_id index"),
        ('CREATE INDEX IF NOT EXISTS idx_meals_consumed_at ON public.meals(consumed_at);', "Meals consumed_at index"),
        ('CREATE INDEX IF NOT EXISTS idx_daily_summaries_user_date ON public.daily_summaries(user_id, summary_date);', "Daily summaries user_date index"),
    ]
    
    for sql, description in indexes:
        execute_sql(client, sql, description)

def create_demo_data(client: Client):
    """Create demo user data"""
    
    # First, create a demo user in auth.users if needed
    logger.info("Creating demo data...")
    
    # Insert demo user in public.users
    demo_user_sql = """
    INSERT INTO public.users (
        id, email, full_name, age, gender, height, weight, 
        activity_level, goal, target_calories, target_protein, 
        target_carbs, target_fat
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        'demo@keto.fr',
        'Marie Dubois',
        30,
        'female',
        170.0,
        70.0,
        'moderately_active',
        'weight_loss',
        1843,
        92,
        23,
        154
    ) ON CONFLICT (email) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        age = EXCLUDED.age,
        target_calories = EXCLUDED.target_calories;
    """
    execute_sql(client, demo_user_sql, "Create demo user")

def verify_setup(client: Client):
    """Verify that everything is set up correctly"""
    
    logger.info("Verifying database setup...")
    
    tables_to_check = ['users', 'meals', 'daily_summaries']
    
    for table in tables_to_check:
        try:
            result = client.table(table).select("*", count="exact").limit(0).execute()
            logger.info(f"✅ Table '{table}' is accessible")
        except Exception as e:
            logger.error(f"❌ Table '{table}' verification failed: {str(e)}")
            return False
    
    # Check demo user
    try:
        result = client.table('users').select('*').eq('email', 'demo@keto.fr').execute()
        if result.data:
            logger.info("✅ Demo user exists and accessible")
        else:
            logger.warning("⚠️ Demo user not found")
    except Exception as e:
        logger.error(f"❌ Demo user check failed: {str(e)}")
    
    return True

def main():
    """Main setup function"""
    try:
        logger.info("🚀 Starting automatic Supabase database setup...")
        
        # Get admin client
        client = get_admin_supabase_client()
        logger.info("✅ Admin Supabase client created")
        
        # Create tables
        logger.info("📋 Creating tables...")
        create_tables(client)
        
        # Create policies
        logger.info("🔒 Creating RLS policies...")
        create_policies(client)
        
        # Create triggers
        logger.info("⚡ Creating triggers...")
        create_triggers(client)
        
        # Create indexes
        logger.info("🏃 Creating indexes...")
        create_indexes(client)
        
        # Create demo data
        logger.info("👤 Creating demo data...")
        create_demo_data(client)
        
        # Verify setup
        logger.info("✅ Verifying setup...")
        if verify_setup(client):
            logger.info("🎉 Database setup completed successfully!")
            return True
        else:
            logger.error("❌ Database verification failed")
            return False
            
    except Exception as e:
        logger.error(f"❌ Database setup failed: {str(e)}")
        return False

if __name__ == "__main__":
    success = main()
    if not success:
        sys.exit(1)