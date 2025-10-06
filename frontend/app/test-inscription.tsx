import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { useAuth } from '../hooks/useAuth';
import ValidatedInput from '../components/forms/ValidatedInput';
import LoadingButton from '../components/forms/LoadingButton';

const COLORS = {
  primary: '#4CAF50',
  secondary: '#81C784',
  background: '#FAFAFA',
  surface: '#FFFFFF',
  text: '#212121',
  textSecondary: '#757575',
  success: '#4CAF50',
  error: '#F44336',
};

interface TestRegistrationData {
  email: string;
  password: string;
  full_name: string;
}

export default function TestInscriptionScreen() {
  const router = useRouter();
  const { register, loading } = useAuth();
  const [showSuccess, setShowSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  const { control, handleSubmit, formState: { errors } } = useForm<TestRegistrationData>({
    defaultValues: {
      email: '',
      password: '',
      full_name: '',
    },
  });

  const onTestRegister = async (data: TestRegistrationData) => {
    console.log('🚀 Test inscription commencée:', data);

    try {
      const registerData = {
        ...data,
        age: 25,
        gender: 'female' as const,
        height: 165,
        weight: 60,
        activity_level: 'moderately_active' as const,
        goal: 'weight_loss' as const,
        timezone: 'Europe/Paris',
      };

      console.log('📤 Données envoyées à register:', registerData);
      const result = await register(registerData);
      console.log('📥 Résultat reçu:', result);

      if (result.success) {
        if (result.needsEmailConfirmation) {
          console.log('✅ Email de confirmation requis');
          setRegisteredEmail(data.email);
          setShowSuccess(true);
        } else {
          console.log('✅ Inscription directe réussie');
          Alert.alert('Inscription réussie', 'Vous pouvez maintenant vous connecter');
        }
      } else {
        console.log('❌ Inscription échouée');
        Alert.alert('Erreur', 'L\'inscription a échoué');
      }
    } catch (error) {
      console.error('❌ Erreur inscription:', error);
      Alert.alert('Erreur', 'Problème lors de l\'inscription');
    }
  };

  const goToEmailConfirmation = () => {
    router.push(`/email-confirmation?email=${encodeURIComponent(registeredEmail)}`);
  };

  if (showSuccess) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <Text style={styles.successIcon}>✅</Text>
          <Text style={styles.successTitle}>Inscription réussie !</Text>
          <Text style={styles.successMessage}>
            📩 Un email de confirmation vous a été envoyé à l'adresse :
          </Text>
          <Text style={styles.emailText}>{registeredEmail}</Text>
          
          <View style={styles.instructionsBox}>
            <Text style={styles.instructionsTitle}>Prochaines étapes :</Text>
            <Text style={styles.instructionItem}>
              1. Ouvrez votre boîte email
            </Text>
            <Text style={styles.instructionItem}>
              2. Cherchez un email de contact@ketosansstress.com
            </Text>
            <Text style={styles.instructionItem}>
              3. Cliquez sur le lien de confirmation
            </Text>
            <Text style={styles.instructionItem}>
              4. Revenez ici pour vous connecter
            </Text>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.primaryButton} onPress={goToEmailConfirmation}>
              <Text style={styles.primaryButtonText}>
                Gérer ma confirmation d'email
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push('/auth')}>
              <Text style={styles.secondaryButtonText}>
                Retour à la connexion
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Retour</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.title}>Test Inscription</Text>
          <Text style={styles.subtitle}>
            Cette page teste le système d'inscription et de confirmation d'email
          </Text>

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value } }) => (
              <ValidatedInput
                label="Email"
                value={value}
                onChangeText={onChange}
                error={errors.email?.message}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="test@example.com"
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value } }) => (
              <ValidatedInput
                label="Mot de passe"
                value={value}
                onChangeText={onChange}
                error={errors.password?.message}
                secureTextEntry
                placeholder="Au moins 8 caractères"
              />
            )}
          />

          <Controller
            control={control}
            name="full_name"
            render={({ field: { onChange, value } }) => (
              <ValidatedInput
                label="Nom complet"
                value={value}
                onChangeText={onChange}
                error={errors.full_name?.message}
                placeholder="Votre nom complet"
              />
            )}
          />

          <LoadingButton
            onPress={handleSubmit(onTestRegister)}
            loading={loading}
            style={styles.submitButton}
          >
            Tester l'inscription
          </LoadingButton>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
  },
  header: {
    padding: 16,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '500',
  },
  formContainer: {
    flex: 1,
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 24,
    lineHeight: 22,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 16,
  },
  // Success state styles
  successContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  emailText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 24,
  },
  instructionsBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 32,
    width: '100%',
    borderWidth: 1,
    borderColor: COLORS.primary + '20',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  instructionItem: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
    lineHeight: 20,
  },
  actionButtons: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.surface,
  },
  secondaryButton: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
});