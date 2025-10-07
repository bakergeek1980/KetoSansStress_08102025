import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Mail, CheckCircle, RefreshCw, ArrowLeft, AlertCircle } from 'lucide-react-native';
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
  border: '#E0E0E0',
};

export default function EmailConfirmationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { resendConfirmationEmail, loading } = useAuth();
  
  // Get email and name from params if coming from registration
  const initialEmail = params.email as string || '';
  const userName = params.name as string || '';

  const [email, setEmail] = useState(initialEmail);
  const [emailError, setEmailError] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [sendCount, setSendCount] = useState(0);

  const validateEmail = (emailValue: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailValue) {
      setEmailError('L\'email est requis');
      return false;
    }
    
    if (!emailRegex.test(emailValue)) {
      setEmailError('Format email invalide');
      return false;
    }
    
    setEmailError('');
    return true;
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (emailError) {
      validateEmail(text);
    }
  };

  const handleResendConfirmation = async () => {
    if (!validateEmail(email)) {
      return;
    }

    const success = await resendConfirmationEmail(email);
    if (success) {
      setEmailSent(true);
      setSendCount(prev => prev + 1);
    }
  };

  const handleBackToAuth = () => {
    router.push('/auth');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackToAuth} style={styles.backButton}>
            <ArrowLeft color={COLORS.text} size={24} />
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
          <Text style={styles.appTagline}>Confirmation de votre adresse email</Text>
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          {emailSent ? (
            // Success State After Resend
            <View style={styles.successContainer}>
              <View style={styles.successIconContainer}>
                <CheckCircle color={COLORS.success} size={64} />
              </View>
              
              <Text style={styles.successTitle}>Email renvoyé !</Text>
              
              <Text style={styles.successDescription}>
                {userName ? `Bonjour ${userName} ! ` : ''}Un nouvel email de confirmation a été envoyé à{' '}
                <Text style={styles.emailText}>{email}</Text>
              </Text>

              {sendCount > 1 && (
                <View style={styles.warningContainer}>
                  <AlertCircle color={COLORS.warning} size={20} />
                  <Text style={styles.warningText}>
                    Vous avez déjà reçu {sendCount} emails. Vérifiez vos spams ou attendez quelques minutes.
                  </Text>
                </View>
              )}

              <View style={styles.instructionsContainer}>
                <Text style={styles.instructionsTitle}>Prochaines étapes :</Text>
                <Text style={styles.instructionItem}>
                  1. Ouvrez votre application email
                </Text>
                <Text style={styles.instructionItem}>
                  2. Cherchez un email de <Text style={styles.senderEmail}>contact@ketosansstress.com</Text>
                </Text>
                <Text style={styles.instructionItem}>
                  3. Cliquez sur le lien de confirmation
                </Text>
                <Text style={styles.instructionItem}>
                  4. Revenez ici pour vous connecter
                </Text>
              </View>
            </View>
          ) : (
            // Initial State - Resend Form
            <View style={styles.formContainer}>
              <View style={styles.iconContainer}>
                <Mail color={COLORS.primary} size={64} />
              </View>

              <Text style={styles.title}>
                {userName ? `Bonjour ${userName} !` : 'Confirmez votre adresse email'}
              </Text>
              
              <Text style={styles.description}>
                📩 Un email de confirmation vous a été envoyé à l'adresse indiquée lors de votre inscription.
              </Text>

              <View style={styles.emailInfoContainer}>
                <Text style={styles.emailInfoTitle}>Vous ne voyez pas l'email ?</Text>
                <Text style={styles.emailInfoText}>
                  • Vérifiez votre dossier spam/courrier indésirable{'\n'}
                  • L'email provient de <Text style={styles.senderEmail}>contact@ketosansstress.com</Text>{'\n'}
                  • Il peut prendre jusqu'à 5 minutes pour arriver
                </Text>
              </View>

              <View style={styles.form}>
                <Text style={styles.formLabel}>
                  Si vous ne trouvez toujours pas l'email, saisissez votre adresse ci-dessous pour en recevoir un nouveau :
                </Text>
                
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Adresse email *</Text>
                  <View style={[
                    styles.inputWrapper,
                    emailError && styles.inputWrapperError,
                  ]}>
                    <Mail color={emailError ? COLORS.error : COLORS.textLight} size={20} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={email}
                      onChangeText={handleEmailChange}
                      onBlur={() => validateEmail(email)}
                      placeholder="votre@email.com"
                      placeholderTextColor={COLORS.textLight}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!loading}
                    />
                  </View>
                  {emailError && (
                    <Text style={styles.errorText}>{emailError}</Text>
                  )}
                </View>

                <TouchableOpacity
                  onPress={handleResendConfirmation}
                  disabled={loading}
                  style={[styles.resendButton, loading && styles.resendButtonDisabled]}
                >
                  {loading ? (
                    <ActivityIndicator color={COLORS.surface} size="small" />
                  ) : (
                    <>
                      <RefreshCw color={COLORS.surface} size={20} style={{ marginRight: 8 }} />
                      <Text style={styles.resendButtonText}>
                        Renvoyer l'email de confirmation
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.helpContainer}>
                <Text style={styles.helpTitle}>Besoin d'aide ?</Text>
                <Text style={styles.helpText}>
                  Si vous continuez à rencontrer des problèmes, contactez-nous à{' '}
                  <Text style={styles.contactEmail}>contact@ketosansstress.com</Text>
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={handleBackToAuth} style={styles.backToAuthButton}>
            <Text style={styles.backToAuthText}>
              Retour à la connexion
            </Text>
          </TouchableOpacity>
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
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  logoContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  logoWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
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
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: COLORS.primary + '30',
    top: -10,
    left: -10,
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.surface,
  },
  appName: {
    fontSize: 24,
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
  mainContent: {
    flex: 1,
    paddingHorizontal: 24,
  },
  formContainer: {
    flex: 1,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  emailInfoContainer: {
    backgroundColor: COLORS.primary + '10',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  emailInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  emailInfoText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  senderEmail: {
    fontWeight: '600',
    color: COLORS.primary,
  },
  form: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    minHeight: 52,
  },
  inputWrapperError: {
    borderColor: COLORS.error,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    paddingVertical: 12,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.error,
    marginTop: 4,
    marginLeft: 4,
  },
  resendButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  resendButtonDisabled: {
    opacity: 0.6,
  },
  resendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.surface,
  },
  helpContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  contactEmail: {
    fontWeight: '600',
    color: COLORS.primary,
  },
  // Success state styles
  successContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  successIconContainer: {
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  successDescription: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  emailText: {
    fontWeight: '600',
    color: COLORS.primary,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warning + '10',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning,
  },
  warningText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  instructionsContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 20,
    width: '100%',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
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
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  backToAuthButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  backToAuthText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
});