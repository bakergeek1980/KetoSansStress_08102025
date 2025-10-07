import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import SimpleInput from '../components/forms/SimpleInput';
import DateInput from '../components/forms/DateInput';
import LoadingButton from '../components/forms/LoadingButton';
import Select from '../components/forms/Select';

const COLORS = {
  primary: '#4CAF50',
  secondary: '#81C784',
  accent: '#FF7043',
  background: '#FAFAFA',
  surface: '#FFFFFF',
  text: '#212121',
  textSecondary: '#757575',
  textLight: '#9E9E9E',
  error: '#F44336',
  warning: '#FF9800',
  success: '#4CAF50',
  border: '#E0E0E0',
};

// Interfaces supprimées - maintenant utilisation d'état local

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(false);
  const { login, register, loginLoading, registerLoading } = useAuth();
  const router = useRouter();

  // ✅ États locaux pour les formulaires (sans React Hook Form)
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
  });

  const [registerData, setRegisterData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    birth_date: null as Date | null,
    age: '',
    gender: 'male' as 'male' | 'female' | 'other',
    height: '',
    weight: '',
    activity_level: 'moderately_active' as 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active',
    goal: 'weight_loss' as 'weight_loss' | 'weight_gain' | 'maintenance' | 'muscle_gain' | 'fat_loss',
  });

  // Formulaires supprimés - maintenant utilisation d'état local

  // ✅ Nouvelle fonction de connexion avec état local
  const handleLoginSubmit = async () => {
    console.log('🎯 Login submit avec état local:', loginData);
    
    // Validation simple
    if (!loginData.email || !loginData.password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    const result = await login(loginData.email, loginData.password);
    
    if (result.success) {
      router.replace('/(tabs)');
    } else if (result.needsEmailConfirmation) {
      Alert.alert(
        'Email non confirmé',
        'Vous devez confirmer votre adresse email avant de pouvoir vous connecter.',
        [
          { text: 'Annuler', style: 'cancel' },
          { 
            text: 'Confirmer mon email', 
            onPress: () => {
              router.push(`/email-confirmation?email=${encodeURIComponent(loginData.email)}`);
            }
          }
        ]
      );
    }
  };

  // ✅ Nouvelle fonction d'inscription avec état local
  const handleRegisterSubmit = async () => {
    console.log('🎯 Register submit avec état local:', registerData);
    
    try {
      // Validation
      const requiredFields = ['email', 'password', 'confirmPassword', 'full_name', 'age', 'gender', 'height', 'weight'];
      const missingFields = requiredFields.filter(field => {
        const value = registerData[field as keyof typeof registerData];
        return !value || value === '';
      });
      
      if (missingFields.length > 0) {
        Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
        return;
      }

      if (registerData.password !== registerData.confirmPassword) {
        Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
        return;
      }
      
      // Préparer les données pour l'API
      const apiData = {
        email: registerData.email,
        password: registerData.password,
        full_name: registerData.full_name,
        age: parseInt(registerData.age) || 0,
        birth_date: registerData.birth_date ? registerData.birth_date.toISOString().split('T')[0] : null,
        gender: registerData.gender,
        height: parseInt(registerData.height) || 0,
        weight: parseFloat(registerData.weight) || 0,
        activity_level: registerData.activity_level,
        goal: registerData.goal,
      };
      
      const result = await register(apiData);
      
      if (result.success) {
        if (result.needsEmailConfirmation) {
          Alert.alert(
            '✅ Inscription réussie !',
            `🎉 Bonjour ${registerData.full_name} !\n\n` +
            `📩 Un email de confirmation vous a été envoyé à l'adresse :\n${registerData.email}`,
            [
              { text: 'OK', onPress: () => {
                router.push(`/email-confirmation?email=${encodeURIComponent(registerData.email)}&name=${encodeURIComponent(registerData.full_name)}`);
              }}
            ]
          );
        } else {
          const loginResult = await login(registerData.email, registerData.password);
          if (loginResult.success) {
            router.replace('/(tabs)');
          } else {
            setIsLogin(true);
            Alert.alert('Inscription réussie !', 'Veuillez vous connecter.');
          }
        }
      }
    } catch (error) {
      console.error('Erreur inscription:', error);
      Alert.alert('Erreur', 'Erreur lors de la création du compte');
    }
  };

  // ✅ Formulaire de connexion avec état local (sans React Hook Form)
  const renderLoginForm = () => (
    <ScrollView style={styles.formContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Connexion</Text>
        <Text style={styles.subtitle}>
          Retrouvez votre suivi cétogène personnalisé
        </Text>
      </View>

      <SimpleInput
        label="Email"
        value={loginData.email}
        onChangeText={(text) => {
          console.log('🎯 Login Email changé:', text);
          setLoginData(prev => ({ ...prev, email: text }));
        }}
        keyboardType="email-address"
        leftIcon="mail"
        placeholder="votre@email.com"
      />

      <SimpleInput
        label="Mot de passe"
        value={loginData.password}
        onChangeText={(text) => {
          console.log('🎯 Login Password changé:', text);
          setLoginData(prev => ({ ...prev, password: text }));
        }}
        isPassword
        leftIcon="lock-closed"
        placeholder="••••••••"
      />

      <LoadingButton
        title="Se connecter"
        onPress={handleLoginSubmit}
        loading={loginLoading}
        style={styles.submitButton}
      />

      <TouchableOpacity
        style={styles.forgotPasswordButton}
        onPress={() => router.push('/forgot-password')}
      >
        <Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.switchButton}
        onPress={() => setIsLogin(false)}
      >
        <Text style={styles.switchButtonText}>
          Pas de compte ? <Text style={styles.switchButtonLink}>S'inscrire</Text>
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );

  // ✅ Formulaire d'inscription avec état local (sans React Hook Form)
  const renderRegisterForm = () => (
    <ScrollView style={styles.formContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Inscription</Text>
        <Text style={styles.subtitle}>
          Créez votre compte pour débuter votre voyage cétogène
        </Text>
      </View>

      <SimpleInput
        label="Email"
        value={registerData.email}
        onChangeText={(text) => {
          console.log('🎯 Register Email changé:', text);
          setRegisterData(prev => ({ ...prev, email: text }));
        }}
        keyboardType="email-address"
        leftIcon="mail"
        placeholder="votre@email.com"
      />

      <SimpleInput
        label="Mot de passe"
        value={registerData.password}
        onChangeText={(text) => {
          console.log('🎯 Register Password changé:', text);
          setRegisterData(prev => ({ ...prev, password: text }));
        }}
        isPassword
        leftIcon="lock-closed"
        placeholder="••••••••"
      />

      <SimpleInput
        label="Confirmation mot de passe"
        value={registerData.confirmPassword}
        onChangeText={(text) => {
          console.log('🎯 Register Confirm Password changé:', text);
          setRegisterData(prev => ({ ...prev, confirmPassword: text }));
        }}
        isPassword
        leftIcon="lock-closed"
        placeholder="••••••••"
      />

      <SimpleInput
        label="Nom complet"
        value={registerData.full_name}
        onChangeText={(text) => {
          console.log('🎯 Register Full Name changé:', text);
          setRegisterData(prev => ({ ...prev, full_name: text }));
        }}
        leftIcon="person"
        placeholder="Prénom Nom"
      />

      <DateInput
        label="Date de naissance"
        value={registerData.birth_date}
        onChange={(date) => {
          console.log('🎯 Register Birth Date changé:', date);
          // Calculer l'âge automatiquement
          const age = new Date().getFullYear() - date.getFullYear();
          setRegisterData(prev => ({ 
            ...prev, 
            birth_date: date,
            age: age.toString()
          }));
        }}
        placeholder="Sélectionnez votre date de naissance"
        maximumDate={new Date()}
        minimumDate={new Date(1900, 0, 1)}
      />

      <Select
        label="Genre"
        value={registerData.gender}
        options={[
          { label: 'Femme', value: 'female' },
          { label: 'Homme', value: 'male' },
          { label: 'Autre', value: 'other' },
        ]}
        onSelect={(value) => {
          console.log('🎯 Register Gender changé:', value);
          setRegisterData(prev => ({ ...prev, gender: value as 'male' | 'female' | 'other' }));
        }}
        placeholder="Sélectionner votre genre"
      />

      <SimpleInput
        label="Taille (cm)"
        value={registerData.height}
        onChangeText={(text) => {
          console.log('🎯 Register Height changé:', text);
          setRegisterData(prev => ({ ...prev, height: text }));
        }}
        keyboardType="numeric"
        placeholder="Ex: 170"
      />

      <SimpleInput
        label="Poids (kg)"
        value={registerData.weight}
        onChangeText={(text) => {
          console.log('🎯 Register Weight changé:', text);
          setRegisterData(prev => ({ ...prev, weight: text }));
        }}
        keyboardType="decimal-pad"
        placeholder="Ex: 70.5"
      />

      <LoadingButton
        title="S'inscrire"
        onPress={handleRegisterSubmit}
        loading={registerLoading}
        style={styles.submitButton}
      />

      <TouchableOpacity
        style={styles.switchButton}
        onPress={() => setIsLogin(true)}
      >
        <Text style={styles.switchButtonText}>
          Déjà un compte ? <Text style={styles.switchButtonLink}>Se connecter</Text>
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.logoContainer}>
          <View style={styles.logoWrapper}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>K</Text>
            </View>
            <View style={styles.logoRing}></View>
          </View>
          <Text style={styles.appName}>KetoSansStress</Text>
          <Text style={styles.appTagline}>Votre compagnon cétogène au quotidien</Text>
        </View>

        {isLogin ? renderLoginForm() : renderRegisterForm()}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginVertical: 40,
    paddingHorizontal: 20,
  },
  logoWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  logoCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  logoRing: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
    borderColor: COLORS.primary + '30',
    top: -10,
    left: -10,
  },
  logoText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.surface,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  appTagline: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 22,
  },
  formContainer: {
    flex: 1,
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  submitButton: {
    marginTop: 24,
    marginBottom: 16,
  },
  forgotPasswordButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  switchButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  switchButtonText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  switchButtonLink: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});