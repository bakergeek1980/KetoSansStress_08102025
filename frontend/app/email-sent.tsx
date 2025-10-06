import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Mail, RefreshCw, ArrowLeft } from 'lucide-react-native';
import { useAuth } from '../hooks/useAuth';
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
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
};

export default function EmailSentScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  
  // Rediriger automatiquement vers la nouvelle page de confirmation d'email
  React.useEffect(() => {
    if (email) {
      router.replace(`/email-confirmation?email=${encodeURIComponent(email)}`);
    } else {
      router.replace('/email-confirmation');
    }
  }, [email]);

  const goBackToAuth = () => {
    router.replace('/auth');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={goBackToAuth} style={styles.backButton}>
            <ArrowLeft color={COLORS.textSecondary} size={24} />
          </TouchableOpacity>
        </View>

        {/* Logo et branding */}
        <View style={styles.logoContainer}>
          <View style={styles.logoWrapper}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>K</Text>
            </View>
            <View style={styles.logoRing}></View>
          </View>
          <Text style={styles.appName}>KetoSansStress</Text>
        </View>

        {/* Icône Email */}
        <View style={styles.emailIconContainer}>
          <View style={styles.emailIconWrapper}>
            <Mail color={COLORS.primary} size={48} />
          </View>
        </View>

        {/* Message principal */}
        <View style={styles.messageContainer}>
          <Text style={styles.title}>Email de confirmation envoyé!</Text>
          <Text style={styles.subtitle}>
            Nous avons envoyé un email de confirmation à :
          </Text>
          <Text style={styles.emailText}>{email}</Text>
          
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
                Cliquez sur le lien de confirmation dans l'email
              </Text>
            </View>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <Text style={styles.stepText}>
                Revenez dans l'app pour vous connecter
              </Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          {emailResent && (
            <View style={styles.successMessage}>
              <Text style={styles.successText}>
                ✅ Email de confirmation renvoyé avec succès !
              </Text>
            </View>
          )}

          <LoadingButton
            onPress={handleResendEmail}
            loading={loading}
            style={[styles.resendButton, emailResent && styles.resendButtonSuccess]}
            textStyle={styles.resendButtonText}
            disabled={emailResent}
          >
            <RefreshCw 
              color={emailResent ? COLORS.success : COLORS.primary} 
              size={20} 
              style={{ marginRight: 8 }}
            />
            {emailResent ? 'Email renvoyé' : 'Renvoyer l\'email'}
          </LoadingButton>

          <TouchableOpacity 
            style={styles.backToLoginButton}
            onPress={goBackToAuth}
          >
            <Text style={styles.backToLoginText}>
              Retour à la connexion
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
  },
  emailIconContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  emailIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
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
  },
  instructionsTitle: {
    fontSize: 18,
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
  successMessage: {
    backgroundColor: COLORS.success + '15',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.success,
  },
  successText: {
    fontSize: 14,
    color: COLORS.success,
    fontWeight: '500',
    textAlign: 'center',
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary + '15',
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 16,
  },
  resendButtonSuccess: {
    backgroundColor: COLORS.success + '15',
    borderColor: COLORS.success,
  },
  resendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
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