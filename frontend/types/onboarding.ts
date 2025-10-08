// Types pour le système d'onboarding KetoSansStress

export interface OnboardingData {
  // Slide 1 : Sexe
  sex: 'homme' | 'femme' | 'autre';
  
  // Slide 2 : Objectif
  goal: 'perdre' | 'maintenir' | 'gagner';
  
  // Slide 3 : Poids actuel
  current_weight: number;
  
  // Slide 4 : Poids objectif
  target_weight: number;
  
  // Slide 5 : Taille et activité
  height: number; // cm
  activity_level: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active';
  
  // Slide 6 : Date de naissance (déjà géré par DateInput)
  birth_date: Date;
  
  // Slide 7 : Restrictions alimentaires
  food_restrictions: string[]; // ex: ['produits_carnes', 'poisson']
  
  // Slide 8 : Prénom (vient de l'inscription)
  first_name: string;
}

export interface NutritionTargets {
  calories: number;
  proteins: number; // grammes
  carbs: number;    // glucides nets en grammes
  fats: number;     // grammes
  
  // Métadonnées de calcul
  bmr: number;      // Métabolisme de base
  tdee: number;     // Dépense énergétique totale
  deficit_surplus: number; // Déficit/surplus calorique
}

export interface PersonalizedPlan {
  user_name: string;
  nutrition_targets: NutritionTargets;
  weight_loss_timeline: {
    current_weight: number;
    target_weight: number;
    weight_difference: number;
    estimated_days: number;
    weekly_loss: number;
  };
  motivation_message: string;
}

// Options pour les slides
export interface SexOption {
  id: 'homme' | 'femme' | 'autre';
  label: string;
  emoji: string;
}

export interface GoalOption {
  id: 'perdre' | 'maintenir' | 'gagner';
  label: string;
  emoji: string;
  description: string;
}

export interface ActivityLevelOption {
  id: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active';
  label: string;
  emoji: string;
  description: string;
}

export interface FoodRestrictionOption {
  id: string;
  label: string;
  emoji: string;
}

// États du questionnaire
export type OnboardingStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export interface OnboardingState {
  current_step: OnboardingStep;
  data: Partial<OnboardingData>;
  is_loading: boolean;
  errors: Record<string, string>;
}

// Données constantes pour les options
export const SEX_OPTIONS: SexOption[] = [
  { id: 'homme', label: 'Homme', emoji: '🚹' },
  { id: 'femme', label: 'Femme', emoji: '🚺' },
  { id: 'autre', label: 'Autre', emoji: '⚧️' }
];

export const GOAL_OPTIONS: GoalOption[] = [
  { 
    id: 'perdre', 
    label: 'Perdre du poids', 
    emoji: '📉',
    description: 'Déficit calorique pour une perte saine'
  },
  { 
    id: 'maintenir', 
    label: 'Maintenir mon poids', 
    emoji: '⚖️',
    description: 'Équilibre calorique pour stabiliser'
  },
  { 
    id: 'gagner', 
    label: 'Gagner de la masse musculaire', 
    emoji: '💪',
    description: 'Surplus calorique avec protéines élevées'
  }
];

export const ACTIVITY_LEVEL_OPTIONS: ActivityLevelOption[] = [
  {
    id: 'sedentary',
    label: 'Sédentaire',
    emoji: '🛋️',
    description: 'Peu d\'activité quotidienne'
  },
  {
    id: 'lightly_active',
    label: 'Légèrement actif',
    emoji: '🚶',
    description: 'Marche journalière, 1 à 2h d\'exercice/semaine'
  },
  {
    id: 'moderately_active',
    label: 'Modérément actif',
    emoji: '🏃',
    description: 'Travail actif, 3 à 5h d\'exercice/semaine'
  },
  {
    id: 'very_active',
    label: 'Très actif',
    emoji: '🏋️',
    description: 'Exercice intense 6 à 7 jours/semaine'
  },
  {
    id: 'extremely_active',
    label: 'Extrêmement actif',
    emoji: '🔥',
    description: 'Entraînement 2x/jour, très intense'
  }
];

export const FOOD_RESTRICTION_OPTIONS: FoodRestrictionOption[] = [
  { id: 'produits_carnes', label: 'Produits carnés', emoji: '🥩' },
  { id: 'poisson', label: 'Poisson', emoji: '🐟' },
  { id: 'poulet', label: 'Poulet', emoji: '🍗' },
  { id: 'produits_laitiers', label: 'Produits laitiers', emoji: '🥛' },
  { id: 'oeufs', label: 'Œufs', emoji: '🥚' },
  { id: 'aucune', label: 'Aucune de ces réponses', emoji: '✅' }
];

// Facteurs d'activité pour le calcul TDEE
export const ACTIVITY_FACTORS: Record<string, number> = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
  extremely_active: 1.9
};

// Interface pour la réponse API d'enregistrement du profil
export interface CompleteProfileResponse {
  success: boolean;
  user_profile: {
    id: string;
    profile_completed: boolean;
    nutrition_targets: NutritionTargets;
    personalized_plan: PersonalizedPlan;
  };
  message: string;
}