import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import Constants from 'expo-constants';
import { useAuth } from './useAuth';
import { Food, MealData, BarcodeScanResponse, NutritionalInfo } from '../types/food';  // ✅ Utiliser les types unifiés

interface ApiState {
  loading: boolean;
  error: string | null;
}

interface MealData {
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  name: string;
  brand?: string;
  serving_size?: string;
  calories: number;
  proteins: number;
  carbs: number;
  net_carbs: number;
  total_fat: number;
  fiber: number;
  keto_score?: number;
  consumed_at?: string;
  notes?: string;
  preparation_method?: string;
  // Legacy fields for compatibility
  food_name?: string;
  quantity?: number;
  unit?: string;
  protein?: number;
  carbohydrates?: number;
  saturated_fat?: number;
  sugar?: number;
  sodium?: number;
  potassium?: number;
}

interface DailySummary {
  date: string;
  totals: {
    calories: number;
    proteins: number;
    carbs: number;
    net_carbs: number;
    fats: number;
    fiber: number;
  };
  targets: {
    calories: number;
    proteins: number;
    carbs: number;
    fats: number;
  };
  percentages: {
    calories: number;
    proteins: number;
    carbs: number;
    fats: number;
  };
  meals_count: number;
  keto_status: string;
}

// ✅ URL de base de l'API
const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl || process.env.EXPO_PUBLIC_API_URL;

export const useApi = () => {
  const { token } = useAuth();
  const [apiState, setApiState] = useState<ApiState>({
    loading: false,
    error: null,
  });

  const makeRequest = useCallback(
    async <T>(
      endpoint: string,
      options: RequestInit = {}
    ): Promise<T | null> => {
      setApiState({ loading: true, error: null });

      try {
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
          ...options.headers,
        };

        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          ...options,
          headers,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ 
            detail: `Erreur ${response.status}: ${response.statusText}` 
          }));
          throw new Error(errorData.detail || `HTTP ${response.status}`);
        }

        const data = await response.json();
        setApiState({ loading: false, error: null });
        return data as T;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
        setApiState({ loading: false, error: errorMessage });
        console.error('API Error:', errorMessage);
        return null;
      }
    },
    [token]
  );

  // Meal-related API calls
  const saveMeal = useCallback(
    async (mealData: MealData): Promise<boolean> => {
      try {
        const result = await makeRequest('/api/meals/', {
          method: 'POST',
          body: JSON.stringify(mealData),
        });
        
        if (result) {
          return true;
        } else {
          Alert.alert('Erreur', 'Impossible de sauvegarder le repas');
          return false;
        }
      } catch (error) {
        Alert.alert('Erreur', 'Problème lors de la sauvegarde');
        return false;
      }
    },
    [makeRequest]
  );

  const getMeals = useCallback(
    async (dateFrom?: string, dateTo?: string, mealType?: string) => {
      const params = new URLSearchParams();
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
      if (mealType) params.append('meal_type', mealType);

      const endpoint = `/api/meals/?${params.toString()}`;
      return await makeRequest(endpoint);
    },
    [makeRequest]
  );

  const getTodaysMeals = useCallback(async () => {
    return await makeRequest('/api/meals/today');
  }, [makeRequest]);

  const getDailySummary = useCallback(
    async (userEmail: string, date?: string): Promise<DailySummary | null> => {
      const params = date ? `?target_date=${date}` : '';
      const endpoint = `/api/meals/daily-summary/${userEmail}${params}`;
      return await makeRequest<DailySummary>(endpoint);
    },
    [makeRequest]
  );

  // Food search API calls
  const searchFoods = useCallback(
    async (query: string, limit: number = 20) => {
      const endpoint = `/api/foods/search/${encodeURIComponent(query)}?limit=${limit}`;
      return await makeRequest(endpoint);
    },
    [makeRequest]
  );

  const getKetoFriendlyFoods = useCallback(
    async (limit: number = 50) => {
      const endpoint = `/api/foods/keto-friendly?limit=${limit}`;
      return await makeRequest(endpoint);
    },
    [makeRequest]
  );

  const analyzeFoodImage = useCallback(
    async (imageBase64: string, analysisType: string = 'comprehensive') => {
      return await makeRequest('/api/meals/analyze', {
        method: 'POST',
        body: JSON.stringify({
          image_data: imageBase64,
          analysis_type: analysisType,
        }),
      });
    },
    [makeRequest]
  );

  // User profile API calls
  const getUserProfile = useCallback(
    async (email: string) => {
      const endpoint = `/api/users/profile/${email}`;
      return await makeRequest(endpoint);
    },
    [makeRequest]
  );

  const createUserProfile = useCallback(
    async (profileData: any) => {
      return await makeRequest('/api/users/profile', {
        method: 'POST',
        body: JSON.stringify(profileData),
      });
    },
    [makeRequest]
  );

  // ✅ Nouvelle fonction : Scanner de codes-barres
  const scanBarcode = useCallback(async (barcode: string): Promise<BarcodeScanResponse | null> => {
    return await makeRequest<BarcodeScanResponse>('/api/foods/scan-barcode', {
      method: 'POST',
      body: JSON.stringify({ barcode })
    });
  }, [makeRequest]);

  // ✅ Nouvelle fonction : Analyse d'image (version mise à jour)
  const analyzeImage = useCallback(async (imageBase64: string, mealType: string = 'lunch'): Promise<NutritionalInfo | null> => {
    return await makeRequest<NutritionalInfo>('/api/vision/analyze', {
      method: 'POST',
      body: JSON.stringify({ 
        image_base64: imageBase64,
        meal_type: mealType 
      })
    });
  }, [makeRequest]);

  // ✅ Nouvelle fonction : Gestion des favoris
  const toggleFavorite = useCallback(async (foodId: string): Promise<boolean> => {
    const result = await makeRequest(`/api/foods/favorites/${foodId}`, {
      method: 'POST'
    });
    return result !== null;
  }, [makeRequest]);

  return {
    ...apiState,
    // Meal functions
    saveMeal,
    getMeals,
    getTodaysMeals,
    getDailySummary,
    // Food search functions
    searchFoods,
    getKetoFriendlyFoods,
    analyzeFoodImage,
    // User functions
    getUserProfile,
    createUserProfile,
    // Generic request function
    makeRequest,
  };
};

export default useApi;