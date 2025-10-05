import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { useApi } from '../hooks/useApi';

// Types pour les préférences
export type Region = 'FR' | 'BE' | 'CH' | 'CA' | 'OTHER';
export type UnitSystem = 'metric' | 'imperial';
export type ThemePreference = 'light' | 'dark' | 'system';
export type WeightUnit = 'kg' | 'lb';
export type HeightUnit = 'cm' | 'ft';
export type LiquidUnit = 'ml' | 'fl_oz';
export type TemperatureUnit = 'celsius' | 'fahrenheit';

export interface UserPreferences {
  id?: string;
  user_id?: string;
  
  // Paramètres nutritionnels
  count_net_carbs: boolean;
  
  // Paramètres régionaux
  region: Region;
  unit_system: UnitSystem;
  
  // Paramètres d'affichage
  dark_mode: boolean;
  theme_preference: ThemePreference;
  
  // Synchronisation santé
  health_sync_enabled: boolean;
  health_sync_permissions: Record<string, boolean>;
  health_last_sync?: string;
  
  // Paramètres avancés
  notifications_enabled: boolean;
  auto_sync: boolean;
  data_saver_mode: boolean;
  biometric_lock: boolean;
  
  // Préférences régionales détaillées
  language: string;
  timezone: string;
  date_format: string;
  time_format: string;
  
  // Unités spécifiques
  weight_unit: WeightUnit;
  height_unit: HeightUnit;
  liquid_unit: LiquidUnit;
  temperature_unit: TemperatureUnit;
  
  // Métadonnées
  created_at?: string;
  updated_at?: string;
}

// Préférences par défaut selon la région
const getDefaultPreferences = (region: Region = 'FR'): UserPreferences => {
  const isImperial = region === 'CA';
  
  return {
    count_net_carbs: true,
    region,
    unit_system: isImperial ? 'imperial' : 'metric',
    dark_mode: false,
    theme_preference: 'system',
    health_sync_enabled: false,
    health_sync_permissions: {},
    notifications_enabled: true,
    auto_sync: true,
    data_saver_mode: false,
    biometric_lock: false,
    language: 'fr',
    timezone: region === 'CH' ? 'Europe/Zurich' : 
              region === 'BE' ? 'Europe/Brussels' : 
              region === 'CA' ? 'America/Montreal' : 'Europe/Paris',
    date_format: 'DD/MM/YYYY',
    time_format: '24h',
    weight_unit: isImperial ? 'lb' : 'kg',
    height_unit: isImperial ? 'ft' : 'cm',
    liquid_unit: isImperial ? 'fl_oz' : 'ml',
    temperature_unit: isImperial ? 'fahrenheit' : 'celsius',
  };
};

interface PreferencesContextType {
  preferences: UserPreferences;
  loading: boolean;
  error: string | null;
  
  // Actions
  updatePreference: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => Promise<void>;
  updateMultiplePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
  resetPreferences: (region?: Region) => Promise<void>;
  refreshPreferences: () => Promise<void>;
  
  // Utilitaires
  getRegionLabel: (region: Region) => string;
  getUnitLabel: (unit: string) => string;
  convertWeight: (value: number, from: WeightUnit, to: WeightUnit) => number;
  convertHeight: (value: number, from: HeightUnit, to: HeightUnit) => number;
  convertLiquid: (value: number, from: LiquidUnit, to: LiquidUnit) => number;
  formatWeight: (value: number, unit?: WeightUnit) => string;
  formatHeight: (value: number, unit?: HeightUnit) => string;
  formatLiquid: (value: number, unit?: LiquidUnit) => string;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export const PreferencesProvider = ({ children }: { children: ReactNode }) => {
  const { user, token } = useAuth();
  const { makeRequest } = useApi();
  
  const [preferences, setPreferences] = useState<UserPreferences>(getDefaultPreferences());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les préférences au démarrage
  useEffect(() => {
    if (user && token) {
      loadPreferences();
    } else {
      loadLocalPreferences();
    }
  }, [user, token]);

  // Charger depuis Supabase
  const loadPreferences = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await makeRequest<UserPreferences>(`/api/user-preferences/${user.id}`);
      
      if (data) {
        setPreferences(data);
        // Sauvegarder localement comme backup
        await AsyncStorage.setItem('user_preferences', JSON.stringify(data));
      } else {
        // Créer des préférences par défaut
        const defaultPrefs = getDefaultPreferences();
        await createPreferences(defaultPrefs);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des préférences:', err);
      setError('Impossible de charger les préférences');
      // Fallback sur les préférences locales
      await loadLocalPreferences();
    } finally {
      setLoading(false);
    }
  };

  // Charger depuis AsyncStorage
  const loadLocalPreferences = async () => {
    try {
      const stored = await AsyncStorage.getItem('user_preferences');
      if (stored) {
        const parsedPrefs = JSON.parse(stored);
        setPreferences(parsedPrefs);
      }
    } catch (err) {
      console.error('Erreur lors du chargement local:', err);
    } finally {
      setLoading(false);
    }
  };

  // Créer des préférences par défaut
  const createPreferences = async (prefs: UserPreferences) => {
    if (!user?.id) return;
    
    try {
      const data = await makeRequest<UserPreferences>('/api/user-preferences', {
        method: 'POST',
        body: JSON.stringify({ ...prefs, user_id: user.id }),
      });
      
      if (data) {
        setPreferences(data);
        await AsyncStorage.setItem('user_preferences', JSON.stringify(data));
      }
    } catch (err) {
      console.error('Erreur lors de la création des préférences:', err);
      setError('Impossible de créer les préférences');
    }
  };

  // Mettre à jour une préférence
  const updatePreference = useCallback(async <K extends keyof UserPreferences>(
    key: K, 
    value: UserPreferences[K]
  ) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    
    // Sauvegarder localement immédiatement
    await AsyncStorage.setItem('user_preferences', JSON.stringify(newPreferences));
    
    // Sauvegarder sur le serveur si connecté
    if (user?.id && token) {
      try {
        await makeRequest(`/api/user-preferences/${user.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ [key]: value }),
        });
      } catch (err) {
        console.error('Erreur lors de la sauvegarde:', err);
        setError('Impossible de sauvegarder la préférence');
      }
    }
  }, [preferences, user, token, makeRequest]);

  // Mettre à jour plusieurs préférences
  const updateMultiplePreferences = useCallback(async (updates: Partial<UserPreferences>) => {
    const newPreferences = { ...preferences, ...updates };
    setPreferences(newPreferences);
    
    // Sauvegarder localement
    await AsyncStorage.setItem('user_preferences', JSON.stringify(newPreferences));
    
    // Sauvegarder sur le serveur
    if (user?.id && token) {
      try {
        await makeRequest(`/api/user-preferences/${user.id}`, {
          method: 'PATCH',
          body: JSON.stringify(updates),
        });
      } catch (err) {
        console.error('Erreur lors de la sauvegarde multiple:', err);
        setError('Impossible de sauvegarder les préférences');
      }
    }
  }, [preferences, user, token, makeRequest]);

  // Réinitialiser les préférences
  const resetPreferences = useCallback(async (region?: Region) => {
    const defaultPrefs = getDefaultPreferences(region || 'FR');
    
    if (user?.id && token) {
      try {
        const data = await makeRequest<UserPreferences>(`/api/user-preferences/${user.id}`, {
          method: 'PUT',
          body: JSON.stringify({ ...defaultPrefs, user_id: user.id }),
        });
        
        if (data) {
          setPreferences(data);
          await AsyncStorage.setItem('user_preferences', JSON.stringify(data));
        }
      } catch (err) {
        console.error('Erreur lors de la réinitialisation:', err);
        setError('Impossible de réinitialiser les préférences');
      }
    } else {
      setPreferences(defaultPrefs);
      await AsyncStorage.setItem('user_preferences', JSON.stringify(defaultPrefs));
    }
  }, [user, token, makeRequest]);

  // Actualiser les préférences
  const refreshPreferences = useCallback(async () => {
    await loadPreferences();
  }, []);

  // Utilitaires de conversion et formatage
  const getRegionLabel = useCallback((region: Region): string => {
    const labels = {
      FR: 'France',
      BE: 'Belgique', 
      CH: 'Suisse',
      CA: 'Canada',
      OTHER: 'Autre',
    };
    return labels[region] || region;
  }, []);

  const getUnitLabel = useCallback((unit: string): string => {
    const labels = {
      kg: 'Kilogrammes',
      lb: 'Livres',
      cm: 'Centimètres', 
      ft: 'Pieds',
      ml: 'Millilitres',
      fl_oz: 'Onces liquides',
      celsius: 'Celsius',
      fahrenheit: 'Fahrenheit',
    };
    return labels[unit] || unit;
  }, []);

  // Conversions d'unités
  const convertWeight = useCallback((value: number, from: WeightUnit, to: WeightUnit): number => {
    if (from === to) return value;
    if (from === 'kg' && to === 'lb') return value * 2.20462;
    if (from === 'lb' && to === 'kg') return value / 2.20462;
    return value;
  }, []);

  const convertHeight = useCallback((value: number, from: HeightUnit, to: HeightUnit): number => {
    if (from === to) return value;
    if (from === 'cm' && to === 'ft') return value / 30.48;
    if (from === 'ft' && to === 'cm') return value * 30.48;
    return value;
  }, []);

  const convertLiquid = useCallback((value: number, from: LiquidUnit, to: LiquidUnit): number => {
    if (from === to) return value;
    if (from === 'ml' && to === 'fl_oz') return value / 29.5735;
    if (from === 'fl_oz' && to === 'ml') return value * 29.5735;
    return value;
  }, []);

  // Formatage avec unités
  const formatWeight = useCallback((value: number, unit?: WeightUnit): string => {
    const displayUnit = unit || preferences.weight_unit;
    return `${Math.round(value * 100) / 100} ${displayUnit}`;
  }, [preferences.weight_unit]);

  const formatHeight = useCallback((value: number, unit?: HeightUnit): string => {
    const displayUnit = unit || preferences.height_unit;
    if (displayUnit === 'ft') {
      const feet = Math.floor(value);
      const inches = Math.round((value - feet) * 12);
      return `${feet}'${inches}"`;
    }
    return `${Math.round(value)} ${displayUnit}`;
  }, [preferences.height_unit]);

  const formatLiquid = useCallback((value: number, unit?: LiquidUnit): string => {
    const displayUnit = unit || preferences.liquid_unit;
    return `${Math.round(value)} ${displayUnit}`;
  }, [preferences.liquid_unit]);

  const contextValue: PreferencesContextType = {
    preferences,
    loading,
    error,
    updatePreference,
    updateMultiplePreferences,
    resetPreferences,
    refreshPreferences,
    getRegionLabel,
    getUnitLabel,
    convertWeight,
    convertHeight,
    convertLiquid,
    formatWeight,
    formatHeight,
    formatLiquid,
  };

  return (
    <PreferencesContext.Provider value={contextValue}>
      {children}
    </PreferencesContext.Provider>
  );
};

export const usePreferences = (): PreferencesContextType => {
  const context = useContext(PreferencesContext);
  if (context === undefined) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
};

export default usePreferences;