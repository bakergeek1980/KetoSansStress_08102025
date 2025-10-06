import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

interface User {
  id: string;
  email: string;
  full_name?: string;
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
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<{ success: boolean; needsEmailConfirmation?: boolean }>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  updateProfile: (profileData: ProfileUpdateData) => Promise<boolean>;
  changePassword: (passwordData: PasswordChangeData) => Promise<boolean>;
  deleteAccount: () => Promise<boolean>;
  requestPasswordReset: (email: string) => Promise<boolean>;
  confirmEmail: (token: string) => Promise<boolean>;
  resendConfirmationEmail: (email: string) => Promise<boolean>;
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

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8001';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      
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
        
        return true;
      } else {
        Alert.alert('Erreur de connexion', data.detail || 'Identifiants invalides');
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Erreur', 'Problème de connexion au serveur');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: RegisterData): Promise<{ success: boolean; needsEmailConfirmation?: boolean }> => {
    try {
      setLoading(true);
      
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...userData,
          timezone: userData.timezone || 'Europe/Paris',
          confirm_email: true // Activer la confirmation par email
        }),
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
      setLoading(false);
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

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      AsyncStorage.setItem('user_data', JSON.stringify(updatedUser));
    }
  };

  const value: AuthContextType = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateUser,
    confirmEmail,
    resendConfirmationEmail,
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