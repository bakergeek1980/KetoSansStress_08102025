import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';

// KetoDiet inspired colors
const COLORS = {
  primary: '#4CAF50',
  secondary: '#81C784',
  background: '#FAFAFA',
  surface: '#FFFFFF',
  text: '#212121',
  textSecondary: '#757575',
};

export default function Index() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialized(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isInitialized && !loading) {
      if (user) {
        // ✅ Vérifier si l'utilisateur doit passer par l'onboarding
        console.log('🎯 User data for onboarding check:', {
          onboarding_completed: user.onboarding_completed,
          profile_completed: user.profile_completed,
          email_confirmed_at: user.email_confirmed_at
        });
        
        // Si l'email n'est pas confirmé, rediriger vers la page de confirmation
        if (!user.email_confirmed_at) {
          router.replace(`/email-confirmation?email=${encodeURIComponent(user.email || '')}`);
          return;
        }
        
        // Si l'onboarding n'est pas complété, rediriger vers le questionnaire
        if (!user.onboarding_completed && !user.profile_completed) {
          console.log('🎯 Redirecting to onboarding - first time user');
          router.replace('/onboarding');
          return;
        }
        
        // Sinon, rediriger vers le dashboard
        router.replace('/(tabs)');
      } else {
        router.replace('/auth');
      }
    }
  }, [isInitialized, loading, user, router]);

  if (loading || !isInitialized) {
    return (
      <View style={styles.container}>
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>K</Text>
          </View>
          <Text style={styles.appName}>KetoSansStress</Text>
          <Text style={styles.slogan}>Votre compagnon cétogène au quotidien</Text>
        </View>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  logoText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.surface,
  },
  appName: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  slogan: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontWeight: '400',
  },
});