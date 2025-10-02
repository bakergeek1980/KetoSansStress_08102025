-- Script SQL minimal pour créer la table meals
-- À exécuter dans le SQL Editor de Supabase Dashboard

-- Créer la table meals (version simplifiée)
CREATE TABLE IF NOT EXISTS public.meals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
    food_name TEXT NOT NULL,
    quantity DECIMAL(10,3) NOT NULL DEFAULT 1,
    unit TEXT NOT NULL DEFAULT 'portion',
    calories INTEGER DEFAULT 0,
    protein DECIMAL(8,2) DEFAULT 0,
    carbohydrates DECIMAL(8,2) DEFAULT 0,
    total_fat DECIMAL(8,2) DEFAULT 0,
    fiber DECIMAL(8,2) DEFAULT 0,
    keto_score INTEGER DEFAULT 5 CHECK (keto_score >= 1 AND keto_score <= 10),
    consumed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activer la sécurité RLS
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;

-- Politiques de sécurité (les utilisateurs ne voient que leurs repas)
CREATE POLICY "Users can view own meals" ON public.meals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meals" ON public.meals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meals" ON public.meals
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own meals" ON public.meals
    FOR DELETE USING (auth.uid() = user_id);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_meals_user_id ON public.meals(user_id);
CREATE INDEX IF NOT EXISTS idx_meals_consumed_at ON public.meals(consumed_at);

-- Ajouter les colonnes manquantes à la table users (si pas déjà fait)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS target_calories INTEGER DEFAULT 2000,
ADD COLUMN IF NOT EXISTS target_protein DECIMAL(6,2) DEFAULT 100,
ADD COLUMN IF NOT EXISTS target_carbs DECIMAL(6,2) DEFAULT 25,
ADD COLUMN IF NOT EXISTS target_fat DECIMAL(6,2) DEFAULT 150,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Mettre à jour l'utilisateur demo avec des objectifs
UPDATE public.users SET
    target_calories = 1843,
    target_protein = 92,
    target_carbs = 23,
    target_fat = 154,
    updated_at = NOW()
WHERE email = 'demo@keto.fr';

-- Ajouter quelques repas d'exemple pour l'utilisateur demo
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
    'Œufs brouillés avec avocat',
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
    'Saumon grillé avec épinards',
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