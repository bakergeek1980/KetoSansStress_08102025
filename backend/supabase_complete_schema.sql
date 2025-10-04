-- KetoSansStress - Complete Supabase Database Schema
-- Execute this script in your Supabase SQL Editor

-- Enable UUID extension for generating UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM types
CREATE TYPE gender_enum AS ENUM ('male', 'female', 'other');
CREATE TYPE activity_level_enum AS ENUM ('sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active');
CREATE TYPE goal_enum AS ENUM ('weight_loss', 'weight_gain', 'maintenance', 'muscle_gain', 'fat_loss');
CREATE TYPE meal_type_enum AS ENUM ('breakfast', 'lunch', 'dinner', 'snack');

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL CHECK (LENGTH(full_name) > 0 AND LENGTH(full_name) <= 255),
    age INTEGER NOT NULL CHECK (age > 0 AND age < 150),
    gender gender_enum NOT NULL,
    height DECIMAL(5,2) NOT NULL CHECK (height > 0),
    weight DECIMAL(5,2) NOT NULL CHECK (weight > 0),
    activity_level activity_level_enum NOT NULL,
    goal goal_enum NOT NULL,
    target_calories INTEGER CHECK (target_calories > 0),
    target_protein DECIMAL(6,2) CHECK (target_protein >= 0),
    target_carbs DECIMAL(6,2) CHECK (target_carbs >= 0),
    target_fat DECIMAL(6,2) CHECK (target_fat >= 0),
    timezone TEXT DEFAULT 'UTC',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Meals table
CREATE TABLE public.meals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    meal_type meal_type_enum NOT NULL,
    food_name TEXT NOT NULL CHECK (LENGTH(food_name) > 0 AND LENGTH(food_name) <= 255),
    brand TEXT CHECK (brand IS NULL OR LENGTH(brand) <= 255),
    serving_size TEXT CHECK (serving_size IS NULL OR LENGTH(serving_size) <= 100),
    quantity DECIMAL(8,3) NOT NULL CHECK (quantity > 0),
    unit TEXT NOT NULL CHECK (LENGTH(unit) > 0 AND LENGTH(unit) <= 20),
    
    -- Nutritional information
    calories INTEGER CHECK (calories >= 0),
    protein DECIMAL(6,2) CHECK (protein >= 0),
    carbohydrates DECIMAL(6,2) CHECK (carbohydrates >= 0),
    total_fat DECIMAL(6,2) CHECK (total_fat >= 0),
    saturated_fat DECIMAL(6,2) CHECK (saturated_fat >= 0),
    fiber DECIMAL(6,2) CHECK (fiber >= 0),
    sugar DECIMAL(6,2) CHECK (sugar >= 0),
    sodium DECIMAL(8,2) CHECK (sodium >= 0),
    potassium DECIMAL(8,2) CHECK (potassium >= 0),
    net_carbs DECIMAL(6,2) GENERATED ALWAYS AS (COALESCE(carbohydrates, 0) - COALESCE(fiber, 0)) STORED,
    
    -- Context
    consumed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    preparation_method TEXT CHECK (preparation_method IS NULL OR LENGTH(preparation_method) <= 100),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily summaries table
CREATE TABLE public.daily_summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
    protein_goal DECIMAL(6,2),
    carbs_goal DECIMAL(6,2),
    fat_goal DECIMAL(6,2),
    calories_achieved_percentage DECIMAL(5,2),
    meals_logged INTEGER DEFAULT 0,
    is_ketogenic_day BOOLEAN,
    water_intake_ml INTEGER DEFAULT 0,
    exercise_minutes INTEGER DEFAULT 0,
    steps_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, summary_date)
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_meals_user_id ON public.meals(user_id);
CREATE INDEX idx_meals_consumed_at ON public.meals(consumed_at);
CREATE INDEX idx_meals_user_consumed_at ON public.meals(user_id, consumed_at);
CREATE INDEX idx_daily_summaries_user_date ON public.daily_summaries(user_id, summary_date);

-- Create update trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
CREATE TRIGGER update_meals_updated_at BEFORE UPDATE ON public.meals 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
CREATE TRIGGER update_daily_summaries_updated_at BEFORE UPDATE ON public.daily_summaries 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_summaries ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Meals table policies
CREATE POLICY "Users can view their own meals" ON public.meals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own meals" ON public.meals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meals" ON public.meals
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meals" ON public.meals
    FOR DELETE USING (auth.uid() = user_id);

-- Daily summaries table policies
CREATE POLICY "Users can view their own summaries" ON public.daily_summaries
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own summaries" ON public.daily_summaries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own summaries" ON public.daily_summaries
    FOR UPDATE USING (auth.uid() = user_id);

-- Create demo user for testing (optional)
-- This will be handled by the application, not in SQL

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;