-- Ajouter les colonnes d'onboarding à la table users
-- Script SQL pour Supabase - Colonnes Onboarding

-- Ajouter les colonnes si elles n'existent pas déjà
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS onboarding_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS first_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS sex VARCHAR(20),
ADD COLUMN IF NOT EXISTS current_weight DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS target_weight DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS food_restrictions TEXT[]; -- Array de restrictions alimentaires

-- Ajouter des commentaires pour la documentation
COMMENT ON COLUMN users.onboarding_completed IS 'Indique si l''utilisateur a terminé le processus d''onboarding';
COMMENT ON COLUMN users.onboarding_step IS 'Étape actuelle dans le processus d''onboarding (1-9)';
COMMENT ON COLUMN users.onboarding_started_at IS 'Timestamp du début de l''onboarding';
COMMENT ON COLUMN users.first_name IS 'Prénom de l''utilisateur (collecté lors de l''onboarding)';
COMMENT ON COLUMN users.sex IS 'Sexe de l''utilisateur (male/female/other)';
COMMENT ON COLUMN users.current_weight IS 'Poids actuel en kg';
COMMENT ON COLUMN users.target_weight IS 'Poids objectif en kg';
COMMENT ON COLUMN users.food_restrictions IS 'Array des restrictions alimentaires (dairy, gluten, nuts, etc.)';

-- Créer un index sur onboarding_completed pour les requêtes de performance
CREATE INDEX IF NOT EXISTS idx_users_onboarding_completed ON users(onboarding_completed);
CREATE INDEX IF NOT EXISTS idx_users_onboarding_step ON users(onboarding_step);

-- Mettre à jour les utilisateurs existants qui n'ont pas encore de statut onboarding
UPDATE users 
SET 
    onboarding_completed = CASE 
        WHEN full_name IS NOT NULL AND age IS NOT NULL AND gender IS NOT NULL THEN TRUE 
        ELSE FALSE 
    END,
    onboarding_step = CASE 
        WHEN full_name IS NOT NULL AND age IS NOT NULL AND gender IS NOT NULL THEN 9 
        ELSE 1 
    END
WHERE onboarding_completed IS NULL OR onboarding_step IS NULL;

-- Politique RLS (Row Level Security) pour les nouvelles colonnes si nécessaire
-- Les colonnes d'onboarding suivent les mêmes règles que les autres colonnes utilisateur