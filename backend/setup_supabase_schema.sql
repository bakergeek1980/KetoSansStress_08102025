-- KetoSansStress Supabase Database Schema Setup
-- This script creates all necessary tables for the keto diet tracking app

-- Create users profile table (linked to auth.users)
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

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can only see their own profile
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Create meals table
CREATE TABLE IF NOT EXISTS public.meals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
    food_name TEXT NOT NULL,
    brand TEXT,
    serving_size TEXT,
    quantity DECIMAL(10,3) NOT NULL CHECK (quantity > 0),
    unit TEXT NOT NULL,
    
    -- Nutritional information
    calories INTEGER CHECK (calories >= 0),
    protein DECIMAL(8,2) CHECK (protein >= 0),
    carbohydrates DECIMAL(8,2) CHECK (carbohydrates >= 0),
    total_fat DECIMAL(8,2) CHECK (total_fat >= 0),
    saturated_fat DECIMAL(8,2) CHECK (saturated_fat >= 0),
    fiber DECIMAL(8,2) CHECK (fiber >= 0),
    sugar DECIMAL(8,2) CHECK (sugar >= 0),
    sodium DECIMAL(8,2) CHECK (sodium >= 0),
    potassium DECIMAL(8,2) CHECK (potassium >= 0),
    
    -- Calculated net carbs
    net_carbs DECIMAL(8,2) GENERATED ALWAYS AS (GREATEST(carbohydrates - fiber, 0)) STORED,
    
    -- Context
    consumed_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    preparation_method TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for meals
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;

-- Users can only access their own meals
CREATE POLICY "Users can view own meals" ON public.meals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meals" ON public.meals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meals" ON public.meals
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own meals" ON public.meals
    FOR DELETE USING (auth.uid() = user_id);

-- Create daily summaries table for performance
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

-- Enable RLS for daily summaries
ALTER TABLE public.daily_summaries ENABLE ROW LEVEL SECURITY;

-- Users can only access their own summaries
CREATE POLICY "Users can view own daily summaries" ON public.daily_summaries
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily summaries" ON public.daily_summaries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily summaries" ON public.daily_summaries
    FOR UPDATE USING (auth.uid() = user_id);

-- Create weight tracking table
CREATE TABLE IF NOT EXISTS public.weight_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    weight DECIMAL(5,2) NOT NULL CHECK (weight > 0),
    entry_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, entry_date)
);

-- Enable RLS for weight entries
ALTER TABLE public.weight_entries ENABLE ROW LEVEL SECURITY;

-- Users can only access their own weight entries
CREATE POLICY "Users can view own weight entries" ON public.weight_entries
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own weight entries" ON public.weight_entries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own weight entries" ON public.weight_entries
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own weight entries" ON public.weight_entries
    FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_meals_user_id ON public.meals(user_id);
CREATE INDEX IF NOT EXISTS idx_meals_consumed_at ON public.meals(consumed_at);
CREATE INDEX IF NOT EXISTS idx_meals_user_date ON public.meals(user_id, DATE(consumed_at));
CREATE INDEX IF NOT EXISTS idx_daily_summaries_user_date ON public.daily_summaries(user_id, summary_date);
CREATE INDEX IF NOT EXISTS idx_weight_entries_user_date ON public.weight_entries(user_id, entry_date);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to auto-update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meals_updated_at BEFORE UPDATE ON public.meals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_summaries_updated_at BEFORE UPDATE ON public.daily_summaries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create user profile after auth registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$;

-- Trigger to create user profile on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert demo user for testing (only if not exists)
INSERT INTO public.users (
    id, 
    email, 
    full_name, 
    age, 
    gender, 
    height, 
    weight, 
    activity_level, 
    goal,
    target_calories,
    target_protein,
    target_carbs,
    target_fat,
    created_at, 
    updated_at
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
    154,
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Create some sample meals for the demo user
INSERT INTO public.meals (
    user_id,
    meal_type,
    food_name,
    quantity,
    unit,
    calories,
    protein,
    carbohydrates,
    total_fat,
    fiber,
    consumed_at
) VALUES 
    (
        '00000000-0000-0000-0000-000000000000',
        'breakfast',
        'Œufs brouillés avec avocat et beurre',
        1.0,
        'portion',
        420,
        18,
        6,
        38,
        5,
        CURRENT_DATE + INTERVAL '8 hours'
    ),
    (
        '00000000-0000-0000-0000-000000000000',
        'lunch',
        'Saumon grillé avec épinards et huile olive',
        1.0,
        'portion',
        580,
        35,
        4,
        47,
        3,
        CURRENT_DATE + INTERVAL '12 hours'
    ),
    (
        '00000000-0000-0000-0000-000000000000',
        'dinner',
        'Poulet rôti avec brocolis et fromage',
        1.0,
        'portion',
        520,
        42,
        8,
        36,
        4,
        CURRENT_DATE + INTERVAL '19 hours'
    )
ON CONFLICT DO NOTHING;