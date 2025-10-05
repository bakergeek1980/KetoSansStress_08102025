import * as Yup from 'yup';

// User registration schema
export const registerSchema = Yup.object({
  email: Yup.string()
    .email('Email invalide')
    .required('L\'email est requis'),
  password: Yup.string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre'
    )
    .required('Le mot de passe est requis'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Les mots de passe doivent correspondre')
    .required('La confirmation du mot de passe est requise'),
  full_name: Yup.string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères')
    .required('Le nom complet est requis'),
  age: Yup.number()
    .integer('L\'âge doit être un nombre entier')
    .min(13, 'Vous devez avoir au moins 13 ans')
    .max(120, 'Âge invalide')
    .required('L\'âge est requis'),
  gender: Yup.string()
    .oneOf(['male', 'female', 'other'], 'Genre invalide')
    .required('Le genre est requis'),
  height: Yup.number()
    .min(100, 'La taille doit être au moins 100 cm')
    .max(250, 'La taille ne peut pas dépasser 250 cm')
    .required('La taille est requise'),
  weight: Yup.number()
    .min(30, 'Le poids doit être au moins 30 kg')
    .max(300, 'Le poids ne peut pas dépasser 300 kg')
    .required('Le poids est requis'),
  activity_level: Yup.string()
    .oneOf([
      'sedentary',
      'lightly_active',
      'moderately_active',
      'very_active',
      'extremely_active'
    ], 'Niveau d\'activité invalide')
    .required('Le niveau d\'activité est requis'),
  goal: Yup.string()
    .oneOf([
      'weight_loss',
      'weight_gain',
      'maintenance',
      'muscle_gain',
      'fat_loss'
    ], 'Objectif invalide')
    .required('L\'objectif est requis'),
});

// Login schema
export const loginSchema = Yup.object({
  email: Yup.string()
    .email('Email invalide')
    .required('L\'email est requis'),
  password: Yup.string()
    .required('Le mot de passe est requis'),
});

// Meal entry schema
export const mealSchema = Yup.object({
  meal_type: Yup.string()
    .oneOf(['breakfast', 'lunch', 'dinner', 'snack'], 'Type de repas invalide')
    .required('Le type de repas est requis'),
  food_name: Yup.string()
    .min(1, 'Le nom de l\'aliment est requis')
    .max(255, 'Le nom ne peut pas dépasser 255 caractères')
    .required('Le nom de l\'aliment est requis'),
  brand: Yup.string()
    .max(255, 'La marque ne peut pas dépasser 255 caractères')
    .nullable(),
  serving_size: Yup.string()
    .max(100, 'La taille de portion ne peut pas dépasser 100 caractères')
    .nullable(),
  quantity: Yup.number()
    .min(0.001, 'La quantité doit être supérieure à 0')
    .max(10000, 'Quantité trop élevée')
    .required('La quantité est requise'),
  unit: Yup.string()
    .min(1, 'L\'unité est requise')
    .max(20, 'L\'unité ne peut pas dépasser 20 caractères')
    .required('L\'unité est requise'),
  calories: Yup.number()
    .min(0, 'Les calories ne peuvent pas être négatives')
    .max(10000, 'Valeur de calories trop élevée')
    .nullable(),
  protein: Yup.number()
    .min(0, 'Les protéines ne peuvent pas être négatives')
    .max(1000, 'Valeur de protéines trop élevée')
    .nullable(),
  carbohydrates: Yup.number()
    .min(0, 'Les glucides ne peuvent pas être négatives')
    .max(1000, 'Valeur de glucides trop élevée')
    .nullable(),
  total_fat: Yup.number()
    .min(0, 'Les lipides ne peuvent pas être négatives')
    .max(1000, 'Valeur de lipides trop élevée')
    .nullable(),
  fiber: Yup.number()
    .min(0, 'Les fibres ne peuvent pas être négatives')
    .max(200, 'Valeur de fibres trop élevée')
    .nullable(),
  sugar: Yup.number()
    .min(0, 'Le sucre ne peut pas être négatif')
    .max(1000, 'Valeur de sucre trop élevée')
    .nullable(),
  sodium: Yup.number()
    .min(0, 'Le sodium ne peut pas être négatif')
    .max(50000, 'Valeur de sodium trop élevée')
    .nullable(),
  notes: Yup.string()
    .max(500, 'Les notes ne peuvent pas dépasser 500 caractères')
    .nullable(),
  preparation_method: Yup.string()
    .max(100, 'La méthode de préparation ne peut pas dépasser 100 caractères')
    .nullable(),
});

// User profile update schema
export const profileUpdateSchema = Yup.object({
  full_name: Yup.string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  age: Yup.number()
    .integer('L\'âge doit être un nombre entier')
    .min(13, 'Vous devez avoir au moins 13 ans')
    .max(120, 'Âge invalide'),
  gender: Yup.string()
    .oneOf(['male', 'female', 'other'], 'Genre invalide'),
  height: Yup.number()
    .min(100, 'La taille doit être au moins 100 cm')
    .max(250, 'La taille ne peut pas dépasser 250 cm'),
  weight: Yup.number()
    .min(30, 'Le poids doit être au moins 30 kg')
    .max(300, 'Le poids ne peut pas dépasser 300 kg'),
  activity_level: Yup.string()
    .oneOf([
      'sedentary',
      'lightly_active',
      'moderately_active',
      'very_active',
      'extremely_active'
    ], 'Niveau d\'activité invalide'),
  goal: Yup.string()
    .oneOf([
      'weight_loss',
      'weight_gain',
      'maintenance',
      'muscle_gain',
      'fat_loss'
    ], 'Objectif invalide'),
  target_calories: Yup.number()
    .min(800, 'L\'objectif calorique doit être au moins 800 kcal')
    .max(5000, 'L\'objectif calorique ne peut pas dépasser 5000 kcal'),
  target_protein: Yup.number()
    .min(0, 'L\'objectif protéines ne peut pas être négatif')
    .max(500, 'Objectif protéines trop élevé'),
  target_carbs: Yup.number()
    .min(0, 'L\'objectif glucides ne peut pas être négatif')
    .max(500, 'Objectif glucides trop élevé'),
  target_fat: Yup.number()
    .min(0, 'L\'objectif lipides ne peut pas être négatif')
    .max(500, 'Objectif lipides trop élevé'),
});

// Food search schema
export const foodSearchSchema = Yup.object({
  query: Yup.string()
    .min(2, 'La recherche doit contenir au moins 2 caractères')
    .max(100, 'La recherche ne peut pas dépasser 100 caractères')
    .required('Terme de recherche requis'),
});

// Water intake schema
export const waterIntakeSchema = Yup.object({
  amount: Yup.number()
    .min(50, 'Quantité minimum 50ml')
    .max(2000, 'Quantité maximum 2L par saisie')
    .required('Quantité requise'),
  unit: Yup.string()
    .oneOf(['ml', 'cl', 'l'], 'Unité invalide')
    .required('Unité requise'),
});

// Weight entry schema
export const weightEntrySchema = Yup.object({
  weight: Yup.number()
    .min(30, 'Le poids doit être au moins 30 kg')
    .max(300, 'Le poids ne peut pas dépasser 300 kg')
    .required('Le poids est requis'),
  date: Yup.date()
    .max(new Date(), 'La date ne peut pas être dans le futur')
    .required('La date est requise'),
  notes: Yup.string()
    .max(200, 'Les notes ne peuvent pas dépasser 200 caractères')
    .nullable(),
});

// Fasting entry schema
export const fastingEntrySchema = Yup.object({
  fasting_type: Yup.string()
    .oneOf(['12h', '16:8', '18:6', '20:4', 'custom'], 'Type de jeûne invalide')
    .required('Type de jeûne requis'),
  start_time: Yup.date()
    .required('Heure de début requise'),
  end_time: Yup.date()
    .min(Yup.ref('start_time'), 'L\'heure de fin doit être après l\'heure de début')
    .required('Heure de fin requise'),
  notes: Yup.string()
    .max(200, 'Les notes ne peuvent pas dépasser 200 caractères')
    .nullable(),
});

// All schemas are already exported above

// Validation helper function
export const validateField = async (schema: Yup.AnySchema, fieldName: string, value: any): Promise<string | null> => {
  try {
    await schema.validateAt(fieldName, { [fieldName]: value });
    return null; // No error
  } catch (error) {
    if (error instanceof Yup.ValidationError) {
      return error.message;
    }
    return 'Erreur de validation';
  }
};

// Validate entire object
export const validateObject = async (schema: Yup.AnySchema, data: any): Promise<{ isValid: boolean; errors: Record<string, string> }> => {
  try {
    await schema.validate(data, { abortEarly: false });
    return { isValid: true, errors: {} };
  } catch (error) {
    if (error instanceof Yup.ValidationError) {
      const errors: Record<string, string> = {};
      error.inner.forEach((err) => {
        if (err.path) {
          errors[err.path] = err.message;
        }
      });
      return { isValid: false, errors };
    }
    return { isValid: false, errors: { general: 'Erreur de validation' } };
  }
};