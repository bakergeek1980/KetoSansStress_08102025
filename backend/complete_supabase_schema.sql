-- KetoSansStress Complete Supabase Schema
-- Phase 2: Create all missing tables and integrations

-- Add missing columns to existing users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS age INTEGER CHECK (age > 0 AND age < 150),
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'other')),
ADD COLUMN IF NOT EXISTS height DECIMAL(5,2) CHECK (height > 0),
ADD COLUMN IF NOT EXISTS weight DECIMAL(5,2) CHECK (weight > 0),
ADD COLUMN IF NOT EXISTS activity_level TEXT CHECK (activity_level IN ('sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active')),
ADD COLUMN IF NOT EXISTS goal TEXT CHECK (goal IN ('weight_loss', 'weight_gain', 'maintenance', 'muscle_gain', 'fat_loss')),
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC',
ADD COLUMN IF NOT EXISTS target_calories INTEGER CHECK (target_calories > 0),
ADD COLUMN IF NOT EXISTS target_protein DECIMAL(6,2) CHECK (target_protein >= 0),
ADD COLUMN IF NOT EXISTS target_carbs DECIMAL(6,2) CHECK (target_carbs >= 0),
ADD COLUMN IF NOT EXISTS target_fat DECIMAL(6,2) CHECK (target_fat >= 0),
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create meals table
CREATE TABLE IF NOT EXISTS public.meals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
    food_name TEXT NOT NULL,
    brand TEXT,
    serving_size TEXT,
    quantity DECIMAL(10,3) NOT NULL CHECK (quantity > 0),
    unit TEXT NOT NULL DEFAULT 'portion',
    
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
    net_carbs DECIMAL(8,2) GENERATED ALWAYS AS (GREATEST(carbohydrates - COALESCE(fiber, 0), 0)) STORED,
    
    -- Context and metadata
    consumed_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    preparation_method TEXT,
    
    -- Image analysis data
    image_base64 TEXT,
    ai_confidence DECIMAL(3,2) DEFAULT 0,
    keto_score INTEGER CHECK (keto_score >= 1 AND keto_score <= 10),
    
    -- Food database integration
    openfoodfacts_id TEXT,
    barcode TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for meals
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for meals
CREATE POLICY "Users can view own meals" ON public.meals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meals" ON public.meals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meals" ON public.meals
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own meals" ON public.meals
    FOR DELETE USING (auth.uid() = user_id);

-- Create daily summaries table
CREATE TABLE IF NOT EXISTS public.daily_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    summary_date DATE NOT NULL,
    
    -- Nutritional totals
    total_calories INTEGER DEFAULT 0,
    total_protein DECIMAL(8,2) DEFAULT 0,
    total_carbohydrates DECIMAL(8,2) DEFAULT 0,
    total_fat DECIMAL(8,2) DEFAULT 0,
    total_net_carbs DECIMAL(8,2) DEFAULT 0,
    total_fiber DECIMAL(8,2) DEFAULT 0,
    total_sugar DECIMAL(8,2) DEFAULT 0,
    
    -- Macro percentages
    protein_percentage DECIMAL(5,2),
    carbs_percentage DECIMAL(5,2),
    fat_percentage DECIMAL(5,2),
    
    -- Goals and progress
    calories_goal INTEGER,
    protein_goal DECIMAL(8,2),
    carbs_goal DECIMAL(8,2),
    fat_goal DECIMAL(8,2),
    calories_achieved_percentage DECIMAL(5,2),
    
    -- Activity and tracking
    meals_logged INTEGER DEFAULT 0,
    is_ketogenic_day BOOLEAN,
    water_intake_ml INTEGER DEFAULT 0,
    exercise_minutes INTEGER DEFAULT 0,
    steps_count INTEGER DEFAULT 0,
    
    -- Fasting tracking
    fasting_start_time TIMESTAMPTZ,
    fasting_duration_hours INTEGER DEFAULT 0,
    fasting_completed BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, summary_date)
);

-- Enable RLS for daily summaries
ALTER TABLE public.daily_summaries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for daily summaries
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
    body_fat_percentage DECIMAL(4,2) CHECK (body_fat_percentage >= 0 AND body_fat_percentage <= 100),
    muscle_mass DECIMAL(5,2) CHECK (muscle_mass >= 0),
    water_percentage DECIMAL(4,2) CHECK (water_percentage >= 0 AND water_percentage <= 100),
    notes TEXT,
    measurement_time TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, entry_date)
);

-- Enable RLS for weight entries
ALTER TABLE public.weight_entries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for weight entries
CREATE POLICY "Users can view own weight entries" ON public.weight_entries
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own weight entries" ON public.weight_entries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own weight entries" ON public.weight_entries
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own weight entries" ON public.weight_entries
    FOR DELETE USING (auth.uid() = user_id);

-- Create food database for OpenFoodFacts integration
CREATE TABLE IF NOT EXISTS public.food_database (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    openfoodfacts_id TEXT UNIQUE,
    barcode TEXT UNIQUE,
    product_name TEXT NOT NULL,
    brand TEXT,
    
    -- Nutritional info per 100g
    calories_per_100g INTEGER,
    protein_per_100g DECIMAL(8,2),
    carbohydrates_per_100g DECIMAL(8,2),
    fat_per_100g DECIMAL(8,2),
    fiber_per_100g DECIMAL(8,2),
    sugar_per_100g DECIMAL(8,2),
    sodium_per_100g DECIMAL(8,2),
    
    -- Product metadata
    categories TEXT[],
    labels TEXT[],
    allergens TEXT[],
    ingredients_text TEXT,
    
    -- Keto compatibility
    keto_score INTEGER CHECK (keto_score >= 1 AND keto_score <= 10),
    is_keto_friendly BOOLEAN,
    
    -- Data source and quality
    data_source TEXT DEFAULT 'openfoodfacts',
    data_quality_score DECIMAL(3,2),
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for food database
CREATE INDEX IF NOT EXISTS idx_food_database_barcode ON public.food_database(barcode);
CREATE INDEX IF NOT EXISTS idx_food_database_openfoodfacts ON public.food_database(openfoodfacts_id);
CREATE INDEX IF NOT EXISTS idx_food_database_name ON public.food_database USING GIN (to_tsvector('french', product_name));

-- Create SeeFood image analysis results table
CREATE TABLE IF NOT EXISTS public.image_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    meal_id UUID REFERENCES public.meals(id) ON DELETE CASCADE,
    
    -- Image data
    image_base64 TEXT NOT NULL,
    image_size_bytes INTEGER,
    image_format TEXT,
    
    -- AI Analysis results
    ai_provider TEXT NOT NULL CHECK (ai_provider IN ('seefood', 'emergent_llm', 'custom')),
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    
    -- Detected foods
    foods_detected JSONB,  -- Array of detected food items with confidence
    portions_detected JSONB, -- Portion size estimations
    
    -- Nutritional analysis
    estimated_calories INTEGER,
    estimated_macros JSONB, -- {protein, carbs, fat, fiber}
    keto_compatibility_score INTEGER CHECK (keto_compatibility_score >= 1 AND keto_compatibility_score <= 10),
    
    -- Processing metadata
    analysis_duration_ms INTEGER,
    processing_status TEXT DEFAULT 'completed' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for image analysis
ALTER TABLE public.image_analysis ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for image analysis
CREATE POLICY "Users can view own image analysis" ON public.image_analysis
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own image analysis" ON public.image_analysis
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_meals_user_id ON public.meals(user_id);
CREATE INDEX IF NOT EXISTS idx_meals_consumed_at ON public.meals(consumed_at);
CREATE INDEX IF NOT EXISTS idx_meals_user_date ON public.meals(user_id, DATE(consumed_at));
CREATE INDEX IF NOT EXISTS idx_meals_keto_score ON public.meals(keto_score);
CREATE INDEX IF NOT EXISTS idx_meals_barcode ON public.meals(barcode) WHERE barcode IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_daily_summaries_user_date ON public.daily_summaries(user_id, summary_date);
CREATE INDEX IF NOT EXISTS idx_weight_entries_user_date ON public.weight_entries(user_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_image_analysis_user_id ON public.image_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_image_analysis_meal_id ON public.image_analysis(meal_id);

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

-- Function to automatically create/update daily summary
CREATE OR REPLACE FUNCTION update_daily_summary()
RETURNS TRIGGER AS $$
DECLARE
    target_date DATE;
    user_profile RECORD;
    daily_totals RECORD;
BEGIN
    -- Get the target date from the meal
    target_date = DATE(COALESCE(NEW.consumed_at, OLD.consumed_at, NOW()));
    
    -- Get user profile for goals
    SELECT target_calories, target_protein, target_carbs, target_fat 
    INTO user_profile
    FROM public.users 
    WHERE id = COALESCE(NEW.user_id, OLD.user_id);
    
    -- Calculate daily totals for the user and date
    SELECT 
        COUNT(*) as meals_count,
        SUM(COALESCE(calories, 0) * quantity) as total_calories,
        SUM(COALESCE(protein, 0) * quantity) as total_protein,
        SUM(COALESCE(carbohydrates, 0) * quantity) as total_carbohydrates,
        SUM(COALESCE(total_fat, 0) * quantity) as total_fat,
        SUM(COALESCE(net_carbs, 0) * quantity) as total_net_carbs,
        SUM(COALESCE(fiber, 0) * quantity) as total_fiber
    INTO daily_totals
    FROM public.meals 
    WHERE user_id = COALESCE(NEW.user_id, OLD.user_id) 
    AND DATE(consumed_at) = target_date;
    
    -- Insert or update daily summary
    INSERT INTO public.daily_summaries (
        user_id, summary_date, total_calories, total_protein, 
        total_carbohydrates, total_fat, total_net_carbs, total_fiber,
        meals_logged, calories_goal, protein_goal, carbs_goal, fat_goal,
        is_ketogenic_day,
        calories_achieved_percentage
    ) VALUES (
        COALESCE(NEW.user_id, OLD.user_id),
        target_date,
        COALESCE(daily_totals.total_calories, 0),
        COALESCE(daily_totals.total_protein, 0),
        COALESCE(daily_totals.total_carbohydrates, 0),
        COALESCE(daily_totals.total_fat, 0),
        COALESCE(daily_totals.total_net_carbs, 0),
        COALESCE(daily_totals.total_fiber, 0),
        COALESCE(daily_totals.meals_count, 0),
        user_profile.target_calories,
        user_profile.target_protein,
        user_profile.target_carbs,
        user_profile.target_fat,
        (COALESCE(daily_totals.total_net_carbs, 0) <= COALESCE(user_profile.target_carbs, 25)),
        CASE 
            WHEN user_profile.target_calories > 0 THEN 
                ROUND((COALESCE(daily_totals.total_calories, 0) / user_profile.target_calories * 100), 2)
            ELSE 0
        END
    )
    ON CONFLICT (user_id, summary_date) DO UPDATE SET
        total_calories = EXCLUDED.total_calories,
        total_protein = EXCLUDED.total_protein,
        total_carbohydrates = EXCLUDED.total_carbohydrates,
        total_fat = EXCLUDED.total_fat,
        total_net_carbs = EXCLUDED.total_net_carbs,
        total_fiber = EXCLUDED.total_fiber,
        meals_logged = EXCLUDED.meals_logged,
        is_ketogenic_day = EXCLUDED.is_ketogenic_day,
        calories_achieved_percentage = EXCLUDED.calories_achieved_percentage,
        updated_at = NOW();
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Trigger to update daily summary when meals change
CREATE TRIGGER update_daily_summary_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.meals
    FOR EACH ROW EXECUTE FUNCTION update_daily_summary();

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

-- Insert sample meals for demo user
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
    keto_score,
    consumed_at
) 
SELECT 
    u.id,
    'breakfast',
    'Œufs brouillés avec avocat et beurre',
    1.0,
    'portion',
    420,
    18.0,
    6.0,
    38.0,
    5.0,
    9,
    CURRENT_DATE + INTERVAL '8 hours'
FROM public.users u 
WHERE u.email = 'demo@keto.fr'
ON CONFLICT DO NOTHING;

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
    keto_score,
    consumed_at
) 
SELECT 
    u.id,
    'lunch',
    'Saumon grillé avec épinards et huile olive',
    1.0,
    'portion',
    580,
    35.0,
    4.0,
    47.0,
    3.0,
    10,
    CURRENT_DATE + INTERVAL '12 hours'
FROM public.users u 
WHERE u.email = 'demo@keto.fr'
ON CONFLICT DO NOTHING;

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
    keto_score,
    consumed_at
) 
SELECT 
    u.id,
    'dinner',
    'Poulet rôti avec brocolis et fromage',
    1.0,
    'portion',
    520,
    42.0,
    8.0,
    36.0,
    4.0,
    8,
    CURRENT_DATE + INTERVAL '19 hours'
FROM public.users u 
WHERE u.email = 'demo@keto.fr'
ON CONFLICT DO NOTHING;