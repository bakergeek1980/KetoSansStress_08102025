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
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { loginSchema, registerSchema } from '../validation/schemas';
import ValidatedInput from '../components/forms/ValidatedInput';
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

interface LoginFormData {
  email: string;
  password: string;
}

interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  full_name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  height: number;
  weight: number;
  activity_level: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active';
  goal: 'weight_loss' | 'weight_gain' | 'maintenance' | 'muscle_gain' | 'fat_loss';
}

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(false);
  const { login, register, loading } = useAuth();
  const router = useRouter();

  // Login form
  const { control: loginControl, handleSubmit: handleLoginSubmit, formState: { errors: loginErrors } } = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onChange',
  });

  // Register form
  const { control: registerControl, handleSubmit: handleRegisterSubmit, formState: { errors: registerErrors } } = useForm<RegisterFormData>({
    resolver: yupResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      full_name: '',
      age: 0,
      gender: 'male' as 'male' | 'female' | 'other',
      height: 0,
      weight: 0,
      activity_level: 'moderately_active',
      goal: 'weight_loss',
    },
    mode: 'onChange',
  });

  const onLoginSubmit = async (data: LoginFormData) => {
    const result = await login(data.email, data.password);
    
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
              router.push(`/email-confirmation?email=${encodeURIComponent(data.email)}`);
            }
          }
        ]
      );
    }
  };

  const onRegisterSubmit = async (data: RegisterFormData) => {
    try {
      // Vérifier si tous les champs obligatoires sont remplis
      const requiredFields = ['email', 'password', 'confirmPassword', 'full_name', 'age', 'gender', 'height', 'weight'];
      const missingFields = requiredFields.filter(field => {
        const value = data[field as keyof RegisterFormData];
        return !value || value === '' || value === 0;
      });
      
      if (missingFields.length > 0) {
        Alert.alert(
          'Champs manquants ❌',
          `Veuillez remplir TOUS les champs suivants:\n\n${missingFields.map(f => {
            const labels: Record<string, string> = {
              email: '📧 Email',
              password: '🔒 Mot de passe', 
              confirmPassword: '🔒 Confirmation mot de passe',
              full_name: '👤 Nom complet',
              age: '📅 Âge',
              gender: '⚥ Genre',
              height: '📏 Taille',
              weight: '⚖️ Poids'
            };
            return labels[field] || field;
          }).join('\n')}\n\n💡 Assurez-vous de faire défiler vers le HAUT du formulaire pour voir tous les champs !`,
          [{ text: 'Compris !' }]
        );
        return;
      }
      
      // Remove confirmPassword from data before sending to API
      const { confirmPassword, ...registerData } = data;
      
      const result = await register(registerData);
      
      if (result.success) {
        if (result.needsEmailConfirmation) {
          // Afficher immédiatement la box de succès avec les instructions personnalisées
          Alert.alert(
            '✅ Inscription réussie !',
            `🎉 Bonjour ${data.full_name} !\n\n` +
            `📩 Un email de confirmation vous a été envoyé à l'adresse :\n${data.email}\n\n` +
            'Prochaines étapes :\n' +
            '1. Ouvrez votre boîte email\n' +
            '2. Cherchez un email de contact@ketosansstress.com\n' +
            '3. Cliquez sur le lien de confirmation\n' +
            '4. Revenez ici pour vous connecter\n\n' +
            'Vous ne voyez pas l\'email ? Vérifiez vos spams.',
            [
              { text: 'OK', onPress: () => {
                // Redirection vers la page de confirmation d'email
                router.push(`/email-confirmation?email=${encodeURIComponent(data.email)}&name=${encodeURIComponent(data.full_name)}`);
              }}
            ]
          );
        } else {
          // Inscription classique, tentative de connexion automatique
          const loginResult = await login(data.email, data.password);
          if (loginResult.success) {
            router.replace('/(tabs)');
          } else {
            // Si auto-login échoue, afficher le formulaire de connexion
            setIsLogin(true);
            Alert.alert(
              'Inscription réussie !',
              'Votre compte a été créé avec succès. Veuillez vous connecter.',
              [{ text: 'OK' }]
            );
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error);
      Alert.alert(
        'Erreur d\'inscription',
        'Une erreur est survenue lors de la création de votre compte. Veuillez réessayer.',
        [{ text: 'OK' }]
      );
    }
  };

  const renderLoginForm = () => (
    <ScrollView style={styles.formContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Connexion</Text>
        <Text style={styles.subtitle}>
          Retrouvez votre suivi cétogène personnalisé
        </Text>
      </View>

      <Controller
        control={loginControl}
        name="email"
        render={({ field: { onChange, value } }) => (
          <ValidatedInput
            label="Email"
            value={value}
            onChangeText={onChange}
            error={loginErrors.email?.message}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon="mail"
            placeholder="votre@email.com"
            editable={true}
          />
        )}
      />

      <Controller
        control={loginControl}
        name="password"
        render={({ field: { onChange, value } }) => (
          <ValidatedInput
            label="Mot de passe"
            value={value}
            onChangeText={onChange}
            error={loginErrors.password?.message}
            isPassword
            leftIcon="lock-closed"
            placeholder="••••••••"
            editable={true}
          />
        )}
      />

      <LoadingButton
        title="Se connecter"
        onPress={handleLoginSubmit(onLoginSubmit)}
        loading={loading}
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

  const renderRegisterForm = () => (
    <ScrollView style={styles.formContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Inscription</Text>
        <Text style={styles.subtitle}>
          Créez votre compte pour débuter votre voyage cétogène
        </Text>
      </View>

      <Controller
        control={registerControl}
        name="email"
        render={({ field: { onChange, value } }) => (
          <ValidatedInput
            label="Email"
            value={value}
            onChangeText={onChange}
            error={registerErrors.email?.message}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon="mail"
            placeholder="votre@email.com"
            required
            editable={true}
          />
        )}
      />

      <Controller
        control={registerControl}
        name="password"
        render={({ field: { onChange, value } }) => (
          <ValidatedInput
            label="Mot de passe"
            value={value}
            onChangeText={onChange}
            error={registerErrors.password?.message}
            isPassword
            leftIcon="lock-closed"
            placeholder="••••••••"
            required
            helperText="Au moins 8 caractères avec majuscule, minuscule, chiffre et caractère spécial"
            editable={true}
          />
        )}
      />

      <Controller
        control={registerControl}
        name="confirmPassword"
        render={({ field: { onChange, value } }) => (
          <ValidatedInput
            label="Confirmation mot de passe"
            value={value}
            onChangeText={onChange}
            error={registerErrors.confirmPassword?.message}
            isPassword
            leftIcon="lock-closed"
            placeholder="••••••••"
            required
            editable={true}
          />
        )}
      />

      <Controller
        control={registerControl}
        name="full_name"
        render={({ field: { onChange, value } }) => (
          <ValidatedInput
            label="Nom complet"
            value={value}
            onChangeText={onChange}
            error={registerErrors.full_name?.message}
            leftIcon="person"
            placeholder="Prénom Nom"
            required
          />
        )}
      />

      <Controller
        control={registerControl}
        name="age"
        render={({ field: { onChange, value } }) => (
          <ValidatedInput
            label="Âge (années)"
            value={value ? value.toString() : ''}
            onChangeText={(text) => onChange(text ? parseInt(text) || 0 : 0)}
            error={registerErrors.age?.message}
            keyboardType="numeric"
            placeholder="Ex: 25"
            required
          />
        )}
      />

      <Controller
        control={registerControl}
        name="gender"
        render={({ field: { onChange, value } }) => (
          <Select
            label="Genre"
            value={value}
            options={[
              { label: 'Femme', value: 'female' },
              { label: 'Homme', value: 'male' },
              { label: 'Autre', value: 'other' },
            ]}
            onSelect={onChange}
            error={registerErrors.gender?.message}
            placeholder="Sélectionner votre genre"
            required
          />
        )}
      />

      <Controller
        control={registerControl}
        name="height"
        render={({ field: { onChange, value } }) => (
          <ValidatedInput
            label="Taille (cm)"
            value={value ? value.toString() : ''}
            onChangeText={(text) => onChange(text ? parseInt(text) || 0 : 0)}
            error={registerErrors.height?.message}
            keyboardType="numeric"
            placeholder="Ex: 170"
            required
          />
        )}
      />

      <Controller
        control={registerControl}
        name="weight"
        render={({ field: { onChange, value } }) => (
          <ValidatedInput
            label="Poids (kg)"
            value={value ? value.toString() : ''}
            onChangeText={(text) => onChange(text ? parseFloat(text) || 0 : 0)}
            error={registerErrors.weight?.message}
            keyboardType="decimal-pad"
            placeholder="Ex: 70.5"
            required
          />
        )}
      />

      <LoadingButton
        title="S'inscrire"
        onPress={handleRegisterSubmit(onRegisterSubmit)}
        loading={loading}
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