import axios from 'axios';
import { Platform } from 'react-native';

// Configuration de l'URL du backend
const getBackendUrl = () => {
  if (Platform.OS === 'web') {
    return 'http://localhost:3000';
  }
  return process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3000';
};

const api = axios.create({
  baseURL: getBackendUrl(),
  timeout: 30000,
});

// Types
export interface UserProfile {
  name: string;
  email: string;
  age: number;
  gender: string;
  weight: number;
  height: number;
  activity_level: string;
  goal: string;
}

export interface MealAnalysis {
  image_base64: string;
  meal_type: string;
}

export interface NutritionalInfo {
  calories: number;
  proteins: number;
  carbs: number;
  net_carbs: number;
  fats: number;
  fiber: number;
  keto_score: number;
  foods_detected: string[];
  portions: string[];
  confidence: number;
}

export interface MealEntry {
  user_id: string;
  date: string;
  meal_type: string;
  image_base64: string;
  nutritional_info: NutritionalInfo;
  notes?: string;
}

export interface WeightEntry {
  user_id: string;
  weight: number;
  date: string;
}

// API Functions
export const createOrUpdateProfile = async (profile: UserProfile) => {
  const response = await api.post('/api/users/profile', profile);
  return response.data;
};

export const getProfile = async (email: string) => {
  const response = await api.get(`/api/users/profile/${email}`);
  return response.data;
};

export const analyzeMeal = async (analysis: MealAnalysis) => {
  const response = await api.post('/api/meals/analyze', analysis);
  return response.data;
};

export const saveMeal = async (meal: MealEntry) => {
  const response = await api.post('/api/meals/save', meal);
  return response.data;
};

export const getUserMeals = async (userId: string, date?: string) => {
  let url = `/api/meals/user/${userId}`;
  if (date) {
    url += `?date=${date}`;
  }
  const response = await api.get(url);
  return response.data;
};

export const getDailySummary = async (userId: string, date?: string) => {
  let url = `/api/meals/daily-summary/${userId}`;
  if (date) {
    url += `?date=${date}`;
  }
  const response = await api.get(url);
  return response.data;
};

export const saveWeight = async (weightEntry: WeightEntry) => {
  const response = await api.post('/api/weight/save', weightEntry);
  return response.data;
};

export const getWeightHistory = async (userId: string, days: number = 30) => {
  const response = await api.get(`/api/weight/history/${userId}?days=${days}`);
  return response.data;
};

export const searchFoods = async (query: string) => {
  const response = await api.get(`/api/foods/search/${query}`);
  return response.data;
};

export const healthCheck = async () => {
  const response = await api.get('/api/health');
  return response.data;
};