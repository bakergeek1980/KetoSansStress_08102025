#!/usr/bin/env python3
"""
Direct PostgreSQL Setup for Supabase
Uses direct PostgreSQL connection to create tables
"""

import os
import sys
import logging
from dotenv import load_dotenv
import psycopg2
from urllib.parse import urlparse

# Load environment variables
load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_postgres_connection():
    """Get direct PostgreSQL connection to Supabase"""
    supabase_url = os.getenv("SUPABASE_URL")
    
    if not supabase_url:
        raise ValueError("SUPABASE_URL not found")
    
    # Parse Supabase URL to get database connection info
    parsed = urlparse(supabase_url)
    
    # For Supabase, the direct postgres connection is typically:
    # postgres://postgres:[password]@db.[project].supabase.co:5432/postgres
    
    project_ref = parsed.hostname.split('.')[0]  # Extract project ref
    
    # Construct PostgreSQL connection string
    # Note: This requires the database password, which we don't have
    # Let's try to use the service role via PostgREST API instead
    
    logger.error("Direct PostgreSQL connection requires database password")
    logger.info("Please use the Supabase Dashboard SQL Editor to run the setup script")
    return None

def main():
    """Main function - provide manual instructions"""
    
    logger.info("🚀 Supabase Database Setup Instructions")
    logger.info("=" * 50)
    
    logger.info("""
Since we don't have direct database access, please follow these steps:

1. Go to your Supabase Dashboard: https://vvpscheyjjqavfljpnxf.supabase.co
2. Navigate to 'SQL Editor' in the left sidebar
3. Create a new query
4. Copy and paste this SQL script:
    """)
    
    sql_script = '''
-- KetoSansStress Database Setup
-- Create users table
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
    target_calories INTEGER CHECK (target_calories > 0),
    target_protein DECIMAL(6,2) CHECK (target_protein >= 0),
    target_carbs DECIMAL(6,2) CHECK (target_carbs >= 0),
    target_fat DECIMAL(6,2) CHECK (target_fat >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create meals table
CREATE TABLE IF NOT EXISTS public.meals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
    food_name TEXT NOT NULL,
    quantity DECIMAL(10,3) NOT NULL CHECK (quantity > 0),
    unit TEXT NOT NULL,
    calories INTEGER CHECK (calories >= 0),
    protein DECIMAL(8,2) CHECK (protein >= 0),
    carbohydrates DECIMAL(8,2) CHECK (carbohydrates >= 0),
    total_fat DECIMAL(8,2) CHECK (total_fat >= 0),
    fiber DECIMAL(8,2) CHECK (fiber >= 0),
    consumed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;

-- Insert demo user (use a valid UUID from auth.users or create one)
INSERT INTO public.users (
    id, email, full_name, age, gender, height, weight, 
    activity_level, goal, target_calories, target_protein, 
    target_carbs, target_fat
) VALUES (
    '07a1d753-95e5-4770-aa3b-62068055ef81',
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
) ON CONFLICT (email) DO NOTHING;
'''
    
    print("\n" + "="*50)
    print("📋 SQL SCRIPT TO RUN:")
    print("="*50)
    print(sql_script)
    print("="*50)
    
    logger.info("""
5. Click 'Run' to execute the script
6. Once completed, type 'DONE' in the chat to continue
    """)

if __name__ == "__main__":
    main()