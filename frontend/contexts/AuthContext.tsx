import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import Constants from 'expo-constants';
import { OnboardingData, NutritionTargets } from '../types/onboarding';

// Configuration de l'API
const getApiBaseUrl = () => {
  // En mode web (développement), utiliser une URL relative qui sera proxifiée
  if (typeof window !== 'undefined') {
    // Mode web
    return window.location.origin;
  }
  // Mode mobile (Expo Go)
  return Constants.expoConfig?.extra?.apiUrl || process.env.EXPO_PUBLIC_API_URL || 'https://keto-onboard.preview.emergentagent.com';
};

const API_BASE_URL = getApiBaseUrl();

interface User {
  id: string;
  email: string;
  full_name?: string;
  first_name?: string; // ✅ Nouveau champ pour onboarding
  age?: number;
  gender?: string;
  height?: number;
  weight?: number;
  activity_level?: string;
  goal?: string;
  target_calories?: number;
  target_protein?: number;
  target_carbs?: number;
  target_fat?: number;
  
  // ✅ Nouveaux champs pour onboarding
  profile_completed?: boolean;
  onboarding_completed?: boolean;
  onboarding_step?: number;
  sex?: string;
  current_weight?: number;
  target_weight?: number;
  food_restrictions?: string[];
  email_confirmed_at?: string;
  
  token?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  loginLoading: boolean;
  registerLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; needsEmailConfirmation?: boolean; email?: string }>;
  register: (userData: RegisterData) => Promise<{ success: boolean; needsEmailConfirmation?: boolean }>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  updateProfile: (profileData: ProfileUpdateData) => Promise<boolean>;
  changePassword: (passwordData: PasswordChangeData) => Promise<boolean>;
  deleteAccount: () => Promise<boolean>;
  requestPasswordReset: (email: string) => Promise<boolean>;
  confirmEmail: (token: string) => Promise<boolean>;
  resendConfirmationEmail: (email: string) => Promise<boolean>;
  
  // ✅ Nouvelle fonction pour finaliser le profil onboarding
  completeProfile: (onboardingData: OnboardingData, nutritionTargets: NutritionTargets) => Promise<boolean>;
  
  // ✅ Fonction pour sauvegarder la progression de l'onboarding
  saveOnboardingProgress: (step: number, data: any) => Promise<boolean>;
}

interface RegisterData {
  email: string;
  password: string;
  full_name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  height: number;
  weight: number;
  activity_level: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active';
  goal: 'weight_loss' | 'weight_gain' | 'maintenance' | 'muscle_gain' | 'fat_loss';
  timezone?: string;
}

interface ProfileUpdateData {
  full_name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  height: number;
  weight: number;
  activity_level?: string;
  goal?: string;
}

interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);

  // Initialize auth state from storage
  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('auth_token');
      const storedUser = await AsyncStorage.getItem('user_data');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        
        // Verify token is still valid
        const isValid = await verifyToken(storedToken);
        if (!isValid) {
          await logout();
        }
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
      await logout();
    } finally {
      setLoading(false);
    }
  };

  const verifyToken = async (authToken: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Token verification failed:', error);
      return false;
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; needsEmailConfirmation?: boolean; email?: string }> => {
    try {
      setLoginLoading(true);
      
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.access_token) {
        const { access_token, user: userData } = data;
        
        await AsyncStorage.setItem('auth_token', access_token);
        await AsyncStorage.setItem('user_data', JSON.stringify(userData));
        
        setToken(access_token);
        setUser(userData);
        
        return { success: true };
      } else {
        // Gestion spéciale pour email non confirmé
        if (response.status === 403 && data.detail && data.detail.includes('Email not confirmed')) {
          return { 
            success: false, 
            needsEmailConfirmation: true, 
            email: email 
          };
        } else {
          Alert.alert('Erreur de connexion', data.detail || 'Identifiants invalides');
          return { success: false };
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Erreur', 'Problème de connexion au serveur');
      return { success: false };
    } finally {
      setLoginLoading(false);
    }
  };

  const register = async (userData: RegisterData): Promise<{ success: boolean; needsEmailConfirmation?: boolean }> => {
    try {
      setRegisterLoading(true);
      
      const requestBody = {
        ...userData,
        timezone: userData.timezone || 'Europe/Paris',
      };
      
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (response.ok) {
        // Si l'inscription nécessite une confirmation email
        if (data.needs_email_confirmation) {
          return { success: true, needsEmailConfirmation: true };
        }
        
        // Inscription classique sans confirmation email
        Alert.alert(
          'Inscription réussie', 
          'Votre compte a été créé avec succès. Vous pouvez maintenant vous connecter.'
        );
        return { success: true, needsEmailConfirmation: false };
      } else {
        Alert.alert('Erreur d\'inscription', data.detail || 'Erreur lors de la création du compte');
        return { success: false };
      }
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Erreur', 'Problème de connexion au serveur');
      return { success: false };
    } finally {
      setRegisterLoading(false);
    }
  };

  // Nouvelle fonction pour confirmer l'email
  const confirmEmail = async (token: string): Promise<boolean> => {
    try {
      setLoading(true);
      
      const response = await fetch(`${API_BASE_URL}/api/auth/confirm-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          'Email confirmé!', 
          'Votre adresse email a été confirmée avec succès. Vous pouvez maintenant vous connecter.'
        );
        return true;
      } else {
        Alert.alert('Erreur de confirmation', data.detail || 'Token de confirmation invalide ou expiré');
        return false;
      }
    } catch (error) {
      console.error('Email confirmation error:', error);
      Alert.alert('Erreur', 'Problème de connexion au serveur');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour renvoyer l'email de confirmation
  const resendConfirmationEmail = async (email: string): Promise<boolean> => {
    try {
      setLoading(true);
      
      const response = await fetch(`${API_BASE_URL}/api/auth/resend-confirmation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          'Email envoyé!', 
          'Un nouvel email de confirmation a été envoyé à votre adresse.'
        );
        return true;
      } else {
        Alert.alert('Erreur', data.detail || 'Impossible d\'envoyer l\'email de confirmation');
        return false;
      }
    } catch (error) {
      console.error('Resend confirmation error:', error);
      Alert.alert('Erreur', 'Problème de connexion au serveur');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      // Call logout endpoint if token exists
      if (token) {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      // Clear local state regardless of API call result
      await AsyncStorage.multiRemove(['auth_token', 'user_data']);
      setToken(null);
      setUser(null);
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      await AsyncStorage.setItem('user_data', JSON.stringify(updatedUser));
    }
  };

  const updateProfile = async (profileData: ProfileUpdateData): Promise<boolean> => {
    try {
      setLoading(true);
      
      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      const data = await response.json();

      if (response.ok) {
        // Update local user state with new profile data
        await updateUser(data.user);
        Alert.alert('Succès', 'Profil mis à jour avec succès!');
        return true;
      } else {
        Alert.alert('Erreur', data.detail || 'Impossible de mettre à jour le profil');
        return false;
      }
    } catch (error) {
      console.error('Profile update error:', error);
      Alert.alert('Erreur', 'Problème de connexion au serveur');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (passwordData: PasswordChangeData): Promise<boolean> => {
    try {
      setLoading(true);
      
      const response = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          current_password: passwordData.currentPassword,
          new_password: passwordData.newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Succès', 'Mot de passe modifié avec succès!');
        return true;
      } else {
        Alert.alert('Erreur', data.detail || 'Impossible de changer le mot de passe');
        return false;
      }
    } catch (error) {
      console.error('Password change error:', error);
      Alert.alert('Erreur', 'Problème de connexion au serveur');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const requestAccountDeletion = async (): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/request-account-deletion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          'Email envoyé ✉️', 
          data.details || 'Un email de confirmation a été envoyé à votre adresse. Vous avez 24h pour confirmer la suppression.',
          [{ text: 'Compris' }]
        );
        return true;
      } else {
        Alert.alert('Erreur', data.detail || 'Impossible d\'envoyer l\'email de confirmation');
        return false;
      }
    } catch (error) {
      console.error('Request account deletion error:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la demande de suppression');
      return false;
    }
  };

  const deleteAccount = async (): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/account`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        await logout();
        Alert.alert('Compte supprimé', 'Votre compte a été définitivement supprimé.');
        return true;
      } else {
        const data = await response.json();
        Alert.alert('Erreur', data.detail || 'Impossible de supprimer le compte');
        return false;
      }
    } catch (error) {
      console.error('Delete account error:', error);
      Alert.alert('Erreur', 'Problème de connexion au serveur');
      return false;
    }
  };

  const requestPasswordReset = async (email: string): Promise<boolean> => {
    try {
      setLoading(true);
      
      const response = await fetch(`${API_BASE_URL}/api/auth/password-reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          'Email envoyé', 
          'Si ce compte existe, un email de réinitialisation a été envoyé.'
        );
        return true;
      } else {
        Alert.alert('Erreur', data.detail || 'Impossible d\'envoyer l\'email de réinitialisation');
        return false;
      }
    } catch (error) {
      console.error('Password reset error:', error);
      Alert.alert('Erreur', 'Problème de connexion au serveur');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // ✅ Nouvelle fonction pour finaliser le profil onboarding
  const completeProfile = async (onboardingData: OnboardingData, nutritionTargets: NutritionTargets): Promise<boolean> => {
    try {
      setLoading(true);
      
      const response = await fetch(`${API_BASE_URL}/api/auth/complete-onboarding`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          onboarding_data: onboardingData,
          nutrition_targets: nutritionTargets,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Mettre à jour l'utilisateur local avec les nouvelles données
        await updateUser(data.user);
        Alert.alert('Succès', 'Profil complété avec succès!');
        return true;
      } else {
        Alert.alert('Erreur', data.detail || 'Impossible de compléter le profil');
        return false;
      }
    } catch (error) {
      console.error('Complete profile error:', error);
      Alert.alert('Erreur', 'Problème de connexion au serveur');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fonction pour sauvegarder la progression de l'onboarding
  const saveOnboardingProgress = async (step: number, data: any): Promise<boolean> => {
    try {
      // Sauvegarder localement dans AsyncStorage
      const progressData = {
        step,
        data,
        timestamp: new Date().toISOString()
      };
      
      await AsyncStorage.setItem('onboarding_progress', JSON.stringify(progressData));
      
      // Sauvegarder aussi sur le serveur si l'utilisateur est connecté
      if (token) {
        const response = await fetch(`${API_BASE_URL}/api/auth/save-onboarding-progress`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            onboarding_step: step,
            data: data
          }),
        });
        
        if (!response.ok) {
          console.warn('Failed to save onboarding progress to server, but saved locally');
        }
      }
      
      return true;
    } catch (error) {
      console.error('Save onboarding progress error:', error);
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    token,
    loading,
    loginLoading,
    registerLoading,
    login,
    register,
    logout,
    updateUser,
    updateProfile,
    changePassword,
    deleteAccount,
    requestPasswordReset,
    confirmEmail,
    resendConfirmationEmail,
    completeProfile,
    saveOnboardingProgress,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}