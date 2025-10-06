-- ===================================================================
-- CRÉATION DE LA TABLE SEARCH_HISTORY POUR KETO SANS STRESS
-- ===================================================================
-- 🔧 Script de création de la table d'historique de recherche
-- 📋 Utilisation: Exécuter dans l'éditeur SQL de Supabase

-- Supprimer la table si elle existe (pour réinitialisation complète)
DROP TABLE IF EXISTS public.search_history CASCADE;

-- Créer la table search_history
CREATE TABLE public.search_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    searched_at TIMESTAMPTZ DEFAULT NOW(),
    result_count INTEGER DEFAULT 0,
    search_type TEXT DEFAULT 'text' CHECK (search_type IN ('text', 'barcode', 'image')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Créer des index pour optimiser les performances
CREATE INDEX idx_search_history_user_id ON public.search_history(user_id);
CREATE INDEX idx_search_history_searched_at ON public.search_history(searched_at DESC);
CREATE INDEX idx_search_history_query ON public.search_history(query);
CREATE INDEX idx_search_history_search_type ON public.search_history(search_type);

-- Activer Row Level Security (RLS)
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;

-- Politique RLS : Les utilisateurs ne peuvent voir que leur propre historique
CREATE POLICY "Users can view own search history" ON public.search_history
    FOR SELECT USING (auth.uid() = user_id);

-- Politique RLS : Les utilisateurs peuvent insérer leur propre historique
CREATE POLICY "Users can insert own search history" ON public.search_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Politique RLS : Les utilisateurs peuvent supprimer leur propre historique
CREATE POLICY "Users can delete own search history" ON public.search_history
    FOR DELETE USING (auth.uid() = user_id);

-- Fonction pour nettoyer automatiquement l'historique ancien (> 30 jours)
CREATE OR REPLACE FUNCTION cleanup_old_search_history()
RETURNS void AS $$
BEGIN
    DELETE FROM public.search_history 
    WHERE searched_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer une fonction trigger pour limiter l'historique par utilisateur (max 100 entrées)
CREATE OR REPLACE FUNCTION limit_search_history()
RETURNS TRIGGER AS $$
BEGIN
    -- Garder seulement les 100 recherches les plus récentes par utilisateur
    DELETE FROM public.search_history 
    WHERE user_id = NEW.user_id 
    AND id NOT IN (
        SELECT id FROM public.search_history 
        WHERE user_id = NEW.user_id 
        ORDER BY searched_at DESC 
        LIMIT 100
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger
CREATE TRIGGER trigger_limit_search_history
    AFTER INSERT ON public.search_history
    FOR EACH ROW EXECUTE FUNCTION limit_search_history();

-- Insérer quelques données de test (optionnel)
INSERT INTO public.search_history (user_id, query, searched_at, result_count, search_type) VALUES
    (
        (SELECT id FROM auth.users WHERE email = 'demo@ketosansstress.com' LIMIT 1),
        'avocat',
        NOW() - INTERVAL '1 hour',
        3,
        'text'
    ),
    (
        (SELECT id FROM auth.users WHERE email = 'demo@ketosansstress.com' LIMIT 1),
        'saumon',
        NOW() - INTERVAL '2 hours',
        5,
        'text'
    ),
    (
        (SELECT id FROM auth.users WHERE email = 'demo@ketosansstress.com' LIMIT 1),
        'œufs',
        NOW() - INTERVAL '3 hours',
        2,
        'text'
    );

-- ===================================================================
-- VÉRIFICATIONS ET VALIDATION
-- ===================================================================

-- Vérifier que la table a été créée correctement
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'search_history' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Vérifier les politiques RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'search_history';

-- Vérifier les index
SELECT 
    i.relname AS index_name,
    t.relname AS table_name,
    a.attname AS column_name
FROM 
    pg_class i
    JOIN pg_index ix ON i.oid = ix.indexrelid
    JOIN pg_class t ON t.oid = ix.indrelid
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
WHERE 
    t.relname = 'search_history'
    AND i.relkind = 'i'
ORDER BY i.relname, a.attname;

-- Message de confirmation
SELECT '✅ Table search_history créée avec succès et configurée!' as status;

-- ===================================================================
-- INSTRUCTIONS D'UTILISATION
-- ===================================================================
/*
🎯 UTILISATION:
1. Exécutez ce script dans l'éditeur SQL de Supabase
2. La table search_history sera créée avec toutes les sécurités
3. L'historique sera automatiquement limité à 100 entrées par utilisateur
4. Les anciennes entrées (> 30 jours) peuvent être nettoyées avec cleanup_old_search_history()

📋 COLONNES:
- id: Identifiant unique de la recherche
- user_id: Référence vers l'utilisateur (auth.users)
- query: Terme recherché
- searched_at: Horodatage de la recherche
- result_count: Nombre de résultats trouvés
- search_type: Type de recherche (text, barcode, image)
- metadata: Données supplémentaires au format JSON

🔒 SÉCURITÉ:
- RLS activé : utilisateurs voient seulement leur historique
- Cascade delete : suppression automatique si utilisateur supprimé
- Index optimisés pour les requêtes fréquentes

⚡ PERFORMANCE:
- Index sur user_id, searched_at, query, search_type
- Limitation automatique à 100 entrées par utilisateur
- Nettoyage automatique des données anciennes disponible
*/