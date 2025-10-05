-- =====================================================
-- KetoSansStress - SCRIPT GLOBAL DE RESET COMPLET
-- =====================================================
-- ⚠️  ATTENTION: Ce script supprime TOUTES les données existantes
-- Exécutez ce script dans Supabase SQL Editor

-- =====================================================
-- ÉTAPE 1: NETTOYAGE COMPLET (Supprime tout)
-- =====================================================

-- Supprimer toutes les politiques RLS existantes
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view their own meals" ON public.meals;
DROP POLICY IF EXISTS "Users can insert their own meals" ON public.meals;
DROP POLICY IF EXISTS "Users can update their own meals" ON public.meals;
DROP POLICY IF EXISTS "Users can delete their own meals" ON public.meals;
DROP POLICY IF EXISTS "Users can view their own summaries" ON public.daily_summaries;
DROP POLICY IF EXISTS "Users can insert their own summaries" ON public.daily_summaries;
DROP POLICY IF EXISTS "Users can update their own summaries" ON public.daily_summaries;
DROP POLICY IF EXISTS "Users can view own daily summaries" ON public.daily_summaries;
DROP POLICY IF EXISTS "Users can insert own daily summaries" ON public.daily_summaries;
DROP POLICY IF EXISTS "Users can update own daily summaries" ON public.daily_summaries;
DROP POLICY IF EXISTS "Users can view own weight entries" ON public.weight_entries;
DROP POLICY IF EXISTS "Users can insert own weight entries" ON public.weight_entries;
DROP POLICY IF EXISTS "Users can update own weight entries" ON public.weight_entries;
DROP POLICY IF EXISTS "Users can delete own weight entries" ON public.weight_entries;
DROP POLICY IF EXISTS "Users can view own image analysis" ON public.image_analysis;
DROP POLICY IF EXISTS "Users can insert own image analysis" ON public.image_analysis;

-- Supprimer toutes les tables (CASCADE pour supprimer les dépendances)
DROP TABLE IF EXISTS public.image_analysis CASCADE;
DROP TABLE IF EXISTS public.food_database CASCADE;
DROP TABLE IF EXISTS public.weight_entries CASCADE;
DROP TABLE IF EXISTS public.daily_summaries CASCADE;
DROP TABLE IF EXISTS public.meals CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Supprimer les types ENUM s'ils existent
DROP TYPE IF EXISTS gender_enum CASCADE;
DROP TYPE IF EXISTS activity_level_enum CASCADE;
DROP TYPE IF EXISTS goal_enum CASCADE;
DROP TYPE IF EXISTS meal_type_enum CASCADE;

-- =====================================================
-- ÉTAPE 2: CRÉATION DES TYPES ENUM
-- =====================================================

CREATE TYPE gender_enum AS ENUM ('male', 'female', 'other');
CREATE TYPE activity_level_enum AS ENUM ('sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active');
CREATE TYPE goal_enum AS ENUM ('weight_loss', 'weight_gain', 'maintenance', 'muscle_gain', 'fat_loss');
CREATE TYPE meal_type_enum AS ENUM ('breakfast', 'lunch', 'dinner', 'snack');

-- =====================================================
-- ÉTAPE 3: CRÉATION DE LA TABLE USERS COMPLÈTE
-- =====================================================

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

-- =====================================================
-- ÉTAPE 4: CRÉATION DE LA TABLE MEALS COMPLÈTE
-- =====================================================

CREATE TABLE public.meals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    meal_type meal_type_enum NOT NULL,
    food_name TEXT NOT NULL CHECK (LENGTH(food_name) > 0 AND LENGTH(food_name) <= 255),
    brand TEXT CHECK (brand IS NULL OR LENGTH(brand) <= 255),
    serving_size TEXT CHECK (serving_size IS NULL OR LENGTH(serving_size) <= 100),
    quantity DECIMAL(8,3) NOT NULL CHECK (quantity > 0),
    unit TEXT NOT NULL CHECK (LENGTH(unit) > 0 AND LENGTH(unit) <= 20),
    
    -- Informations nutritionnelles
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
    
    -- Contexte et métadonnées
    consumed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    preparation_method TEXT CHECK (preparation_method IS NULL OR LENGTH(preparation_method) <= 100),
    keto_score INTEGER CHECK (keto_score >= 0 AND keto_score <= 10),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ÉTAPE 5: CRÉATION DE LA TABLE DAILY_SUMMARIES
-- =====================================================

CREATE TABLE public.daily_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    summary_date DATE NOT NULL,
    total_calories INTEGER DEFAULT 0,
    total_protein DECIMAL(8,2) DEFAULT 0,
    total_carbohydrates DECIMAL(8,2) DEFAULT 0,
    total_fat DECIMAL(8,2) DEFAULT 0,
    total_net_carbs DECIMAL(8,2) DEFAULT 0,
    total_fiber DECIMAL(8,2) DEFAULT 0,
    total_sugar DECIMAL(8,2) DEFAULT 0,
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
    fasting_start_time TIMESTAMP WITH TIME ZONE,
    fasting_duration_hours INTEGER DEFAULT 0,
    fasting_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, summary_date)
);

-- =====================================================
-- ÉTAPE 6: CRÉATION DE LA TABLE WEIGHT_ENTRIES
-- =====================================================

CREATE TABLE public.weight_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    weight DECIMAL(5,2) NOT NULL CHECK (weight > 0),
    entry_date DATE NOT NULL,
    body_fat_percentage DECIMAL(4,2),
    muscle_mass DECIMAL(5,2),
    water_percentage DECIMAL(4,2),
    notes TEXT,
    measurement_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, entry_date)
);

-- =====================================================
-- ÉTAPE 7: CRÉATION DE LA TABLE FOOD_DATABASE
-- =====================================================

CREATE TABLE public.food_database (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    openfoodfacts_id TEXT UNIQUE,
    barcode TEXT UNIQUE,
    product_name TEXT NOT NULL,
    brand TEXT,
    calories_per_100g INTEGER,
    protein_per_100g DECIMAL(8,2),
    carbohydrates_per_100g DECIMAL(8,2),
    fat_per_100g DECIMAL(8,2),
    fiber_per_100g DECIMAL(8,2),
    sugar_per_100g DECIMAL(8,2),
    sodium_per_100g DECIMAL(8,2),
    categories TEXT[],
    labels TEXT[],
    allergens TEXT[],
    ingredients_text TEXT,
    keto_score INTEGER CHECK (keto_score >= 0 AND keto_score <= 10),
    is_keto_friendly BOOLEAN,
    data_source TEXT DEFAULT 'openfoodfacts',
    data_quality_score DECIMAL(3,2),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ÉTAPE 8: CRÉATION DE LA TABLE IMAGE_ANALYSIS
-- =====================================================

CREATE TABLE public.image_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    meal_id UUID REFERENCES public.meals(id) ON DELETE CASCADE,
    image_base64 TEXT NOT NULL,
    image_size_bytes INTEGER,
    image_format TEXT,
    ai_provider TEXT NOT NULL,
    confidence_score DECIMAL(3,2),
    foods_detected JSONB,
    portions_detected JSONB,
    estimated_calories INTEGER,
    estimated_macros JSONB,
    keto_compatibility_score INTEGER,
    analysis_duration_ms INTEGER,
    processing_status TEXT DEFAULT 'completed',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ÉTAPE 9: CRÉATION DES INDEX POUR PERFORMANCES
-- =====================================================

CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_meals_user_id ON public.meals(user_id);
CREATE INDEX idx_meals_consumed_at ON public.meals(consumed_at);
CREATE INDEX idx_meals_user_consumed_at ON public.meals(user_id, consumed_at);
CREATE INDEX idx_daily_summaries_user_date ON public.daily_summaries(user_id, summary_date);
CREATE INDEX idx_weight_entries_user_date ON public.weight_entries(user_id, entry_date);
CREATE INDEX idx_image_analysis_user_id ON public.image_analysis(user_id);
CREATE INDEX idx_image_analysis_meal_id ON public.image_analysis(meal_id);
CREATE INDEX idx_food_database_barcode ON public.food_database(barcode);
CREATE INDEX idx_food_database_name ON public.food_database USING GIN (to_tsvector('french', product_name));

-- =====================================================
-- ÉTAPE 10: FONCTION DE TRIGGER POUR UPDATE_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =====================================================
-- ÉTAPE 11: CRÉATION DES TRIGGERS
-- =====================================================

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
CREATE TRIGGER update_meals_updated_at BEFORE UPDATE ON public.meals 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
CREATE TRIGGER update_daily_summaries_updated_at BEFORE UPDATE ON public.daily_summaries 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ÉTAPE 12: ACTIVATION ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weight_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.image_analysis ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- ÉTAPE 13: CRÉATION DES POLITIQUES RLS
-- =====================================================

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

-- Weight entries table policies
CREATE POLICY "Users can view their own weight entries" ON public.weight_entries
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own weight entries" ON public.weight_entries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own weight entries" ON public.weight_entries
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own weight entries" ON public.weight_entries
    FOR DELETE USING (auth.uid() = user_id);

-- Image analysis table policies
CREATE POLICY "Users can view their own image analysis" ON public.image_analysis
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own image analysis" ON public.image_analysis
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- ÉTAPE 14: PERMISSIONS
-- =====================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- =====================================================
-- ÉTAPE 15: DONNÉES DE TEST
-- =====================================================

-- Insérer un utilisateur demo complet
-- NOTE: Remplacez 'VOTRE_USER_ID_ICI' par l'ID réel d'un utilisateur auth.users
-- Vous pouvez obtenir cet ID en vous inscrivant via l'app, puis en exécutant: SELECT id, email FROM auth.users;

-- Exemple avec un UUID fictif (remplacez par un vrai après inscription):
/*
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
    timezone
) VALUES (
    '00000000-0000-0000-0000-000000000000', -- REMPLACEZ par l'ID réel depuis auth.users
    'demo@ketosansstress.com',
    'Marie Dubois',
    30,
    'female',
    170.00,
    70.00,
    'moderately_active',
    'weight_loss',
    1781,
    89.00,
    22.00,
    148.00,
    'Europe/Paris'
);
*/

-- =====================================================
-- ÉTAPE 16: VÉRIFICATION FINALE
-- =====================================================

-- Vérifier que toutes les tables sont créées
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'meals', 'daily_summaries', 'weight_entries', 'food_database', 'image_analysis')
ORDER BY table_name, ordinal_position;

-- Message de succès
SELECT '✅ RESET COMPLET TERMINÉ! Toutes les tables KetoSansStress ont été recréées avec succès.' as status;