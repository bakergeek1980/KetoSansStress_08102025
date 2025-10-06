import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { CheckCircle, XCircle, ArrowRight, Loader } from 'lucide-react-native';
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

export default function ConfirmEmailScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const { confirmEmail } = useAuth();
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    handleEmailConfirmation();
  }, [token]);

  const handleEmailConfirmation = async () => {
    if (!token) {
      setStatus('error');
      setErrorMessage('Token de confirmation manquant');
      return;
    }

    try {
      const success = await confirmEmail(token);
      if (success) {
        setStatus('success');
      } else {
        setStatus('error');
        setErrorMessage('Token invalide ou expiré');
      }
    } catch (error) {
      setStatus('error');
      setErrorMessage('Erreur lors de la confirmation');
    }
  };

  const goToLogin = () => {
    router.replace('/auth');
  };

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <>
            <View style={styles.iconContainer}>
              <View style={styles.loadingIconWrapper}>
                <Loader color={COLORS.primary} size={48} />
              </View>
            </View>
            <Text style={styles.title}>Confirmation en cours...</Text>
            <Text style={styles.subtitle}>
              Nous vérifions votre token de confirmation
            </Text>
          </>
        );

      case 'success':
        return (
          <>
            <View style={styles.iconContainer}>
              <View style={styles.successIconWrapper}>
                <CheckCircle color={COLORS.success} size={48} />
              </View>
            </View>
            <Text style={styles.title}>Email confirmé avec succès!</Text>
            <Text style={styles.subtitle}>
              Votre adresse email a été vérifiée. Vous pouvez maintenant vous connecter à votre compte KetoSansStress.
            </Text>
            <View style={styles.benefitsContainer}>
              <Text style={styles.benefitsTitle}>Vous avez maintenant accès à :</Text>
              <View style={styles.benefit}>
                <CheckCircle color={COLORS.success} size={16} />
                <Text style={styles.benefitText}>Suivi nutritionnel personnalisé</Text>
              </View>
              <View style={styles.benefit}>
                <CheckCircle color={COLORS.success} size={16} />
                <Text style={styles.benefitText}>Analyse des repas avec IA</Text>
              </View>
              <View style={styles.benefit}>
                <CheckCircle color={COLORS.success} size={16} />
                <Text style={styles.benefitText}>Rapports détaillés et graphiques</Text>
              </View>
              <View style={styles.benefit}>
                <CheckCircle color={COLORS.success} size={16} />
                <Text style={styles.benefitText}>Synchronisation avec apps de santé</Text>
              </View>
            </View>
          </>
        );

      case 'error':
        return (
          <>
            <View style={styles.iconContainer}>
              <View style={styles.errorIconWrapper}>
                <XCircle color={COLORS.error} size={48} />
              </View>
            </View>
            <Text style={styles.title}>Erreur de confirmation</Text>
            <Text style={styles.subtitle}>
              {errorMessage || 'Une erreur est survenue lors de la confirmation de votre email.'}
            </Text>
            <View style={styles.troubleshootingContainer}>
              <Text style={styles.troubleshootingTitle}>Que faire ?</Text>
              <Text style={styles.troubleshootingText}>
                • Vérifiez que vous avez cliqué sur le bon lien{'\n'}
                • Le lien peut avoir expiré (valide 24h){'\n'}
                • Contactez le support si le problème persiste
              </Text>
            </View>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
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

        {/* Contenu principal */}
        <View style={styles.messageContainer}>
          {renderContent()}
        </View>

        {/* Actions */}
        {status === 'success' && (
          <View style={styles.actionsContainer}>
            <TouchableOpacity 
              style={styles.loginButton}
              onPress={goToLogin}
            >
              <Text style={styles.loginButtonText}>Se connecter maintenant</Text>
              <ArrowRight color={COLORS.surface} size={20} />
            </TouchableOpacity>
          </View>
        )}

        {status === 'error' && (
          <View style={styles.actionsContainer}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={goToLogin}
            >
              <Text style={styles.backButtonText}>Retour à la connexion</Text>
            </TouchableOpacity>
          </View>
        )}
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
    paddingVertical: 40,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
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
  messageContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    marginBottom: 24,
  },
  loadingIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.success + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.error + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  benefitsContainer: {
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
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  benefitText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 8,
    flex: 1,
  },
  troubleshootingContainer: {
    width: '100%',
    backgroundColor: COLORS.error + '10',
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.error,
  },
  troubleshootingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.error,
    marginBottom: 8,
  },
  troubleshootingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  actionsContainer: {
    marginTop: 20,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.surface,
    marginRight: 8,
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textDecorationLine: 'underline',
  },
});