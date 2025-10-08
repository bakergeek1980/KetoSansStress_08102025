// Types unifiés pour l'application KetoSansStress
// Compatible avec le backend FastAPI

export interface Food {
  id: string;
  name: string;
  brand?: string;
  category?: string;
  
  // Nutritionnel pour 100g (format frontend)
  calories_per_100g: number;
  proteins_per_100g: number;  
  carbs_per_100g: number;      
  fats_per_100g: number;       
  fiber_per_100g?: number;
  
  // Métadonnées
  barcode?: string;
  image_url?: string;
  source: 'openfoodfacts' | 'local' | 'usda' | 'custom';
  keto_score?: number;
  is_favorite?: boolean;
}

export interface MealData {
  // Identifiants
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  food_name: string;  
  brand?: string;
  serving_size?: string;
  quantity: number;
  unit: string;
  
  // Nutritionnel (valeurs réelles pour la quantité, pas pour 100g)
  calories?: number;
  protein?: number;    // Format backend
  carbohydrates?: number;  // Format backend  
  total_fat?: number;  // Format backend
  saturated_fat?: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  potassium?: number;
  
  // Métadonnées
  notes?: string;
  preparation_method?: string;
  consumed_at?: string;
  
  // Calculs keto
  net_carbs?: number;
  keto_score?: number;
}

export interface NutritionalInfo {
  calories: number;
  protein: number;
  carbohydrates: number;
  total_fat: number;
  fiber: number;
  keto_score: number;
  foods_detected: string[];
  portions: string[];
  confidence: number;
}

// Interface pour la recherche de code-barres
export interface BarcodeScanRequest {
  barcode: string;
}

export interface BarcodeScanResponse {
  found: boolean;
  food_data?: Food;
}

// Interface pour les favoris
export interface FavoriteFood extends Food {
  is_favorite: true;
  added_to_favorites_at?: string;
}

// Interface pour l'historique de recherche
export interface SearchHistoryItem {
  query: string;
  searched_at: string;
}