-- KetoSansStress - Schema Onboarding Extension
-- Mise à jour de la table users pour le système d'onboarding

-- Ajouter les nouvelles colonnes à la table users existante
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS sex VARCHAR(10) CHECK (sex IN ('homme', 'femme', 'autre'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS goal VARCHAR(20) CHECK (goal IN ('perdre', 'maintenir', 'gagner'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_weight DECIMAL(5,2);
ALTER TABLE users ADD COLUMN IF NOT EXISTS target_weight DECIMAL(5,2);
ALTER TABLE users ADD COLUMN IF NOT EXISTS food_restrictions JSONB;

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_users_profile_completed ON users(profile_completed);
CREATE INDEX IF NOT EXISTS idx_users_onboarding_step ON users(onboarding_step);

-- Table pour les objectifs nutritionnels calculés
CREATE TABLE IF NOT EXISTS nutrition_targets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  calories INTEGER NOT NULL,
  proteins INTEGER NOT NULL,        -- grammes
  carbs INTEGER NOT NULL,           -- grammes (nets)
  fats INTEGER NOT NULL,            -- grammes
  
  -- Métadonnées pour le calcul
  bmr INTEGER NOT NULL,             -- Métabolisme de base
  tdee INTEGER NOT NULL,            -- Dépense énergétique totale
  deficit_surplus INTEGER,          -- Déficit (-500) ou surplus (+300) calories
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les performances nutrition_targets
CREATE INDEX IF NOT EXISTS idx_nutrition_targets_user_id ON nutrition_targets(user_id);

-- Fonction pour calculer l'âge à partir de birth_date (si pas déjà existante)
CREATE OR REPLACE FUNCTION calculate_age(birth_date DATE)
RETURNS INTEGER AS $$
BEGIN
  RETURN EXTRACT(YEAR FROM AGE(CURRENT_DATE, birth_date));
END;
$$ LANGUAGE plpgsql;

-- Fonction pour calculer le BMR (Basal Metabolic Rate) - Harris-Benedict révisé
CREATE OR REPLACE FUNCTION calculate_bmr(
  sex VARCHAR,
  weight DECIMAL,
  height INTEGER, 
  age INTEGER
) RETURNS INTEGER AS $$
BEGIN
  IF sex = 'homme' THEN
    RETURN ROUND(88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age));
  ELSE
    -- Pour femme et autre, utiliser la formule femme
    RETURN ROUND(447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age));
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour calculer le TDEE (Total Daily Energy Expenditure)
CREATE OR REPLACE FUNCTION calculate_tdee(bmr INTEGER, activity_level VARCHAR)
RETURNS INTEGER AS $$
BEGIN
  CASE activity_level
    WHEN 'sedentary' THEN
      RETURN ROUND(bmr * 1.2);
    WHEN 'lightly_active' THEN
      RETURN ROUND(bmr * 1.375);
    WHEN 'moderately_active' THEN
      RETURN ROUND(bmr * 1.55);
    WHEN 'very_active' THEN
      RETURN ROUND(bmr * 1.725);
    WHEN 'extremely_active' THEN
      RETURN ROUND(bmr * 1.9);
    ELSE
      -- Par défaut : modérément actif
      RETURN ROUND(bmr * 1.55);
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour calculer les macros keto (20% protéines, 75% lipides, 5% glucides)
CREATE OR REPLACE FUNCTION calculate_keto_macros(calories INTEGER)
RETURNS TABLE(proteins INTEGER, fats INTEGER, carbs INTEGER) AS $$
BEGIN
  RETURN QUERY SELECT
    ROUND((calories * 0.20) / 4)::INTEGER,  -- Protéines (4 kcal/g)
    ROUND((calories * 0.75) / 9)::INTEGER,  -- Lipides (9 kcal/g)
    ROUND((calories * 0.05) / 4)::INTEGER;  -- Glucides nets (4 kcal/g)
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer le trigger à nutrition_targets si pas déjà existant
DROP TRIGGER IF EXISTS update_nutrition_targets_updated_at ON nutrition_targets;
CREATE TRIGGER update_nutrition_targets_updated_at
  BEFORE UPDATE ON nutrition_targets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Données de test (optionnel pour le développement)
-- Insérer un utilisateur de test avec profil complété
INSERT INTO users (
  id, email, full_name, sex, goal, current_weight, target_weight, 
  height, activity_level, birth_date, profile_completed, created_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'demo@ketosansstress.com',
  'Utilisateur Demo',
  'homme',
  'perdre',
  85.5,
  80.0,
  180,
  'moderately_active',
  '1990-07-15',
  true,
  NOW()
) ON CONFLICT (email) DO UPDATE SET
  sex = EXCLUDED.sex,
  goal = EXCLUDED.goal,
  current_weight = EXCLUDED.current_weight,
  target_weight = EXCLUDED.target_weight,
  height = EXCLUDED.height,
  activity_level = EXCLUDED.activity_level,
  birth_date = EXCLUDED.birth_date,
  profile_completed = EXCLUDED.profile_completed;

-- Calculer et insérer les objectifs nutritionnels pour l'utilisateur demo
DO $$
DECLARE
  demo_user_id UUID := '00000000-0000-0000-0000-000000000001';
  demo_age INTEGER := calculate_age('1990-07-15');
  demo_bmr INTEGER := calculate_bmr('homme', 85.5, 180, demo_age);
  demo_tdee INTEGER := calculate_tdee(demo_bmr, 'moderately_active');
  demo_calories INTEGER := demo_tdee - 500; -- Déficit pour perdre du poids
  demo_macros RECORD;
BEGIN
  SELECT * INTO demo_macros FROM calculate_keto_macros(demo_calories);
  
  INSERT INTO nutrition_targets (
    user_id, calories, proteins, carbs, fats, bmr, tdee, deficit_surplus
  ) VALUES (
    demo_user_id, demo_calories, demo_macros.proteins, demo_macros.carbs, 
    demo_macros.fats, demo_bmr, demo_tdee, -500
  ) ON CONFLICT DO NOTHING;
END $$;

-- Vues utiles pour l'application
CREATE OR REPLACE VIEW user_profile_complete AS
SELECT 
  u.*,
  nt.calories,
  nt.proteins,
  nt.carbs,
  nt.fats,
  nt.bmr,
  nt.tdee,
  calculate_age(u.birth_date) as calculated_age
FROM users u
LEFT JOIN nutrition_targets nt ON u.id = nt.user_id
WHERE u.profile_completed = true;

-- Commentaires pour documentation
COMMENT ON TABLE nutrition_targets IS 'Objectifs nutritionnels calculés pour chaque utilisateur selon la méthode Harris-Benedict et les ratios keto (75% lipides, 20% protéines, 5% glucides nets)';
COMMENT ON FUNCTION calculate_bmr IS 'Calcule le métabolisme de base selon la formule Harris-Benedict révisée';
COMMENT ON FUNCTION calculate_tdee IS 'Calcule la dépense énergétique totale selon le niveau d activité';
COMMENT ON FUNCTION calculate_keto_macros IS 'Calcule la répartition des macronutriments selon les ratios keto standards';

COMMIT;