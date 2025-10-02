import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';

export default function Index() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialized(true);
    }, 2000); // Logo pendant 2 secondes

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isInitialized && !loading) {
      // Pour la démo, redirigeons directement vers l'app
      router.replace('/(tabs)');
    }
  }, [isInitialized, loading, router]);

  if (loading || !isInitialized) {
    return (
      <LinearGradient
        colors={['#27AE60', '#8E44AD']}
        style={styles.container}
      >
        <View style={styles.logoContainer}>
          <Text style={styles.appName}>KetoScan</Text>
          <Text style={styles.slogan}>Votre œil intelligent pour le keto</Text>
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      </LinearGradient>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 100,
  },
  appName: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  slogan: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 100,
  },
});