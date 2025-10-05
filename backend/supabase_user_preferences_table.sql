-- =====================================================
-- TABLE USER_PREFERENCES pour KetoSansStress
-- Gestion complète des préférences utilisateur
-- =====================================================

-- Créer la table user_preferences
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Paramètres nutritionnels
    count_net_carbs BOOLEAN DEFAULT true,
    
    -- Paramètres régionaux
    region TEXT DEFAULT 'FR' CHECK (region IN ('FR', 'BE', 'CH', 'CA', 'OTHER')),
    unit_system TEXT DEFAULT 'metric' CHECK (unit_system IN ('metric', 'imperial')),
    
    -- Paramètres d'affichage
    dark_mode BOOLEAN DEFAULT false,
    theme_preference TEXT DEFAULT 'system' CHECK (theme_preference IN ('light', 'dark', 'system')),
    
    -- Synchronisation santé
    health_sync_enabled BOOLEAN DEFAULT false,
    health_sync_permissions JSONB DEFAULT '{}',
    health_last_sync TIMESTAMPTZ NULL,
    
    -- Paramètres avancés
    notifications_enabled BOOLEAN DEFAULT true,
    auto_sync BOOLEAN DEFAULT true,
    data_saver_mode BOOLEAN DEFAULT false,
    biometric_lock BOOLEAN DEFAULT false,
    
    -- Préférences régionales détaillées
    language TEXT DEFAULT 'fr',
    timezone TEXT DEFAULT 'Europe/Paris',
    date_format TEXT DEFAULT 'DD/MM/YYYY',
    time_format TEXT DEFAULT '24h',
    
    -- Unités spécifiques par région
    weight_unit TEXT DEFAULT 'kg' CHECK (weight_unit IN ('kg', 'lb')),
    height_unit TEXT DEFAULT 'cm' CHECK (height_unit IN ('cm', 'ft')),
    liquid_unit TEXT DEFAULT 'ml' CHECK (liquid_unit IN ('ml', 'fl_oz')),
    temperature_unit TEXT DEFAULT 'celsius' CHECK (temperature_unit IN ('celsius', 'fahrenheit')),
    
    -- Métadonnées
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Contrainte unique par utilisateur
    UNIQUE(user_id)
);

-- Activer RLS sur la table
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
CREATE POLICY "Users can view their own preferences" ON public.user_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" ON public.user_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" ON public.user_preferences
    FOR UPDATE USING (auth.uid() = user_id);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);

-- Trigger pour updated_at
CREATE OR REPLACE TRIGGER update_user_preferences_updated_at 
    BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour créer des préférences par défaut pour un utilisateur
CREATE OR REPLACE FUNCTION create_default_user_preferences(p_user_id UUID, p_region TEXT DEFAULT 'FR')
RETURNS public.user_preferences AS $$
DECLARE
    result public.user_preferences;
BEGIN
    -- Définir les valeurs par défaut basées sur la région
    INSERT INTO public.user_preferences (
        user_id,
        region,
        unit_system,
        weight_unit,
        height_unit,
        liquid_unit,
        temperature_unit,
        language,
        timezone,
        date_format,
        time_format
    ) VALUES (
        p_user_id,
        p_region,
        CASE 
            WHEN p_region IN ('CA') THEN 'imperial'
            ELSE 'metric'
        END,
        CASE 
            WHEN p_region IN ('CA') THEN 'lb'
            ELSE 'kg'
        END,
        CASE 
            WHEN p_region IN ('CA') THEN 'ft'
            ELSE 'cm'
        END,
        CASE 
            WHEN p_region IN ('CA') THEN 'fl_oz'
            ELSE 'ml'
        END,
        CASE 
            WHEN p_region IN ('CA') THEN 'fahrenheit'
            ELSE 'celsius'
        END,
        CASE 
            WHEN p_region = 'FR' THEN 'fr'
            WHEN p_region = 'BE' THEN 'fr'
            WHEN p_region = 'CH' THEN 'fr'
            WHEN p_region = 'CA' THEN 'fr'
            ELSE 'fr'
        END,
        CASE 
            WHEN p_region = 'FR' THEN 'Europe/Paris'
            WHEN p_region = 'BE' THEN 'Europe/Brussels'
            WHEN p_region = 'CH' THEN 'Europe/Zurich'
            WHEN p_region = 'CA' THEN 'America/Montreal'
            ELSE 'Europe/Paris'
        END,
        'DD/MM/YYYY',
        '24h'
    )
    ON CONFLICT (user_id) DO UPDATE SET
        region = EXCLUDED.region,
        unit_system = EXCLUDED.unit_system,
        weight_unit = EXCLUDED.weight_unit,
        height_unit = EXCLUDED.height_unit,
        liquid_unit = EXCLUDED.liquid_unit,
        temperature_unit = EXCLUDED.temperature_unit,
        language = EXCLUDED.language,
        timezone = EXCLUDED.timezone,
        updated_at = NOW()
    RETURNING * INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Données de test pour l'utilisateur demo
DO $$
DECLARE
    demo_user_id UUID;
BEGIN
    -- Récupérer l'ID de l'utilisateur demo
    SELECT id INTO demo_user_id 
    FROM public.users 
    WHERE email = 'contact@ketosansstress.com' 
    LIMIT 1;
    
    -- Créer des préférences par défaut si l'utilisateur existe
    IF demo_user_id IS NOT NULL THEN
        PERFORM create_default_user_preferences(demo_user_id, 'FR');
    END IF;
END $$;

-- Vérification finale
SELECT '✅ Table user_preferences créée avec succès et configurée!' as status;