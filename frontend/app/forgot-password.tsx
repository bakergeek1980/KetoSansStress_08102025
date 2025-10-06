import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import { ArrowLeft, Mail, Send } from 'lucide-react-native';
import ValidatedInput from '../components/forms/ValidatedInput';
import LoadingButton from '../components/forms/LoadingButton';
import { useAuth } from '../hooks/useAuth';

const COLORS = {
  primary: '#4CAF50',
  secondary: '#81C784',
  accent: '#FF7043',
  background: '#FAFAFA',
  surface: '#FFFFFF',
  text: '#212121',
  textSecondary: '#757575',
  textLight: '#9E9E9E',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
};

interface ForgotPasswordData {
  email: string;
}

const forgotPasswordSchema = Yup.object({
  email: Yup.string()
    .email('Format email invalide')
    .required('L\'email est requis'),
});

export default function ForgotPasswordScreen() {
  const { requestPasswordReset, loading } = useAuth();
  const [emailSent, setEmailSent] = useState(false);

  const { control, handleSubmit, formState: { errors }, getValues } = useForm<ForgotPasswordData>({
    resolver: yupResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
    mode: 'onChange',
  });

  const handleForgotPassword = async (data: ForgotPasswordData) => {
    const success = await requestPasswordReset(data.email);
    if (success) {
      setEmailSent(true);
    }
  };

  const goBackToAuth = () => {
    router.back();
  };

  if (emailSent) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={goBackToAuth} style={styles.backButton}>
              <ArrowLeft color={COLORS.textSecondary} size={24} />
            </TouchableOpacity>
          </View>

          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logoWrapper}>
              <View style={styles.logoCircle}>
                <Text style={styles.logoText}>K</Text>
              </View>
              <View style={styles.logoRing}></View>
            </View>
            <Text style={styles.appName}>KetoSansStress</Text>
          </View>

          {/* Success Message */}
          <View style={styles.successContainer}>
            <View style={styles.emailIconWrapper}>
              <Mail color={COLORS.success} size={48} />
            </View>
            
            <Text style={styles.successTitle}>Email de réinitialisation envoyé!</Text>
            <Text style={styles.successSubtitle}>
              Nous avons envoyé un lien de réinitialisation à :
            </Text>
            <Text style={styles.emailText}>{getValues('email')}</Text>
            
            <View style={styles.instructionsContainer}>
              <Text style={styles.instructionsTitle}>Étapes suivantes :</Text>
              <View style={styles.step}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <Text style={styles.stepText}>
                  Vérifiez votre boîte de réception (et vos spams)
                </Text>
              </View>
              <View style={styles.step}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <Text style={styles.stepText}>
                  Cliquez sur le lien de réinitialisation
                </Text>
              </View>
              <View style={styles.step}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>3</Text>
                </View>
                <Text style={styles.stepText}>
                  Créez votre nouveau mot de passe
                </Text>
              </View>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity 
              style={styles.backToLoginButton}
              onPress={goBackToAuth}
            >
              <Text style={styles.backToLoginText}>Retour à la connexion</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={goBackToAuth} style={styles.backButton}>
              <ArrowLeft color={COLORS.textSecondary} size={24} />
            </TouchableOpacity>
          </View>

          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logoWrapper}>
              <View style={styles.logoCircle}>
                <Text style={styles.logoText}>K</Text>
              </View>
              <View style={styles.logoRing}></View>
            </View>
            <Text style={styles.appName}>KetoSansStress</Text>
            <Text style={styles.appTagline}>Récupération de mot de passe</Text>
          </View>

          {/* Form Container */}
          <View style={styles.formContainer}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>Mot de passe oublié ?</Text>
              <Text style={styles.formSubtitle}>
                Saisissez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
              </Text>
            </View>

            <View style={styles.form}>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, value } }) => (
                  <ValidatedInput
                    label="Adresse email"
                    value={value}
                    onChangeText={onChange}
                    error={errors.email?.message}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    leftIcon="mail"
                    placeholder="votre@email.com"
                    required
                    editable={true}
                  />
                )}
              />

              <View style={styles.submitContainer}>
                <LoadingButton
                  onPress={handleSubmit(handleForgotPassword)}
                  loading={loading}
                  style={styles.submitButton}
                  textStyle={styles.submitButtonText}
                >
                  <Send color={COLORS.surface} size={20} style={{ marginRight: 8 }} />
                  Envoyer le lien de réinitialisation
                </LoadingButton>
              </View>
            </View>

            {/* Security Note */}
            <View style={styles.securityNote}>
              <Text style={styles.securityText}>
                🔒 Pour votre sécurité, nous n'indiquons pas si cette adresse email est associée à un compte.
              </Text>
            </View>
          </View>
        </ScrollView>
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
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    paddingVertical: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: COLORS.surface,
  },
  logoContainer: {
    alignItems: 'center',
    marginVertical: 32,
  },
  logoWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  logoRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: COLORS.primary + '30',
    top: -10,
    left: -10,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.surface,
  },
  appName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  appTagline: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  formHeader: {
    marginBottom: 32,
    alignItems: 'center',
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  formSubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
    marginBottom: 24,
  },
  submitContainer: {
    marginTop: 24,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.surface,
  },
  securityNote: {
    backgroundColor: COLORS.primary + '10',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  securityText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  // Success screen styles
  successContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  emailIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.success + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  successSubtitle: {
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
    marginBottom: 32,
  },
  instructionsContainer: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    marginBottom: 32,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.surface,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  actionsContainer: {
    marginTop: 40,
  },
  backToLoginButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  backToLoginText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textDecorationLine: 'underline',
  },
});