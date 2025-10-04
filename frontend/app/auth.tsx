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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { loginSchema, registerSchema } from '../validation/schemas';
import ValidatedInput from '../components/forms/ValidatedInput';
import LoadingButton from '../components/forms/LoadingButton';

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
  const [isLogin, setIsLogin] = useState(true);
  const { login, register, loading } = useAuth();
  const router = useRouter();

  // Login form
  const { control: loginControl, handleSubmit: handleLoginSubmit, formState: { errors: loginErrors } } = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema),
    defaultValues: {
      email: 'demo@ketosansstress.com',
      password: 'password123',
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
      age: 25,
      gender: 'female',
      height: 170,
      weight: 70,
      activity_level: 'moderately_active',
      goal: 'weight_loss',
    },
    mode: 'onChange',
  });

  const onLoginSubmit = async (data: LoginFormData) => {
    const success = await login(data.email, data.password);
    if (success) {
      router.replace('/(tabs)');
    }
  };

  const onRegisterSubmit = async (data: RegisterFormData) => {
    // Remove confirmPassword from data before sending to API
    const { confirmPassword, ...registerData } = data;
    const success = await register(registerData);
    if (success) {
      setIsLogin(true);
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
            leftIcon="lock"
            placeholder="••••••••"
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
            leftIcon="lock"
            placeholder="••••••••"
            required
            helperText="Au moins 8 caractères avec majuscule, minuscule et chiffre"
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
            leftIcon="lock"
            placeholder="••••••••"
            required
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
            leftIcon="user"
            placeholder="Prénom Nom"
            required
          />
        )}
      />

      <View style={styles.row}>
        <View style={[styles.col, { marginRight: 8 }]}>
          <Controller
            control={registerControl}
            name="age"
            render={({ field: { onChange, value } }) => (
              <ValidatedInput
                label="Âge"
                value={value.toString()}
                onChangeText={(text) => onChange(parseInt(text) || 0)}
                error={registerErrors.age?.message}
                keyboardType="numeric"
                placeholder="25"
                required
              />
            )}
          />
        </View>
        <View style={[styles.col, { marginLeft: 8 }]}>
          <Controller
            control={registerControl}
            name="gender"
            render={({ field: { onChange, value } }) => (
              <ValidatedInput
                label="Genre"
                value={value === 'female' ? 'Femme' : value === 'male' ? 'Homme' : 'Autre'}
                onChangeText={(text) => {
                  if (text === 'Femme') onChange('female');
                  else if (text === 'Homme') onChange('male');
                  else onChange('other');
                }}
                error={registerErrors.gender?.message}
                placeholder="Femme"
                required
              />
            )}
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.col, { marginRight: 8 }]}>
          <Controller
            control={registerControl}
            name="height"
            render={({ field: { onChange, value } }) => (
              <ValidatedInput
                label="Taille (cm)"
                value={value.toString()}
                onChangeText={(text) => onChange(parseFloat(text) || 0)}
                error={registerErrors.height?.message}
                keyboardType="numeric"
                placeholder="170"
                required
              />
            )}
          />
        </View>
        <View style={[styles.col, { marginLeft: 8 }]}>
          <Controller
            control={registerControl}
            name="weight"
            render={({ field: { onChange, value } }) => (
              <ValidatedInput
                label="Poids (kg)"
                value={value.toString()}
                onChangeText={(text) => onChange(parseFloat(text) || 0)}
                error={registerErrors.weight?.message}
                keyboardType="numeric"
                placeholder="70"
                required
              />
            )}
          />
        </View>
      </View>

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
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>K</Text>
          </View>
          <Text style={styles.appName}>KetoSansStress</Text>
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
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginVertical: 40,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.surface,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
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
  row: {
    flexDirection: 'row',
    marginHorizontal: -8,
  },
  col: {
    flex: 1,
  },
  submitButton: {
    marginTop: 24,
    marginBottom: 16,
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