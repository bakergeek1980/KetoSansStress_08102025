import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { 
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Trash2,
  Shield,
} from 'lucide-react-native';

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

export default function ConfirmDeletionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState('');
  
  const token = params.token as string;

  useEffect(() => {
    if (!token) {
      setError('Token de suppression manquant');
    }
  }, [token]);

  const handleConfirmDeletion = async () => {
    if (!token) {
      Alert.alert('Erreur', 'Token de suppression invalide');
      return;
    }

    Alert.alert(
      '⚠️ DERNIÈRE CONFIRMATION',
      'Êtes-vous absolument certain(e) de vouloir supprimer définitivement votre compte KetoSansStress ?\n\n' +
      '🔴 CETTE ACTION EST IRRÉVERSIBLE !\n\n' +
      'Toutes vos données seront perdues à jamais :\n' +
      '• Profil et paramètres\n' +
      '• Historique des repas\n' +
      '• Données nutritionnelles\n' +
      '• Photos et préférences',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'OUI, SUPPRIMER DÉFINITIVEMENT',
          style: 'destructive',
          onPress: executeAccountDeletion,
        },
      ]
    );
  };

  const executeAccountDeletion = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/confirm-account-deletion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: token,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setConfirmed(true);
        // After 3 seconds, redirect to home
        setTimeout(() => {
          router.replace('/auth');
        }, 3000);
      } else {
        setError(data.detail || 'Erreur lors de la suppression du compte');
      }
    } catch (err) {
      console.error('Deletion confirmation error:', err);
      setError('Erreur de connexion. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  if (confirmed) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.successContainer}>
            <View style={styles.successIconContainer}>
              <CheckCircle size={80} color={COLORS.success} />
            </View>
            
            <Text style={styles.successTitle}>
              Compte supprimé avec succès
            </Text>
            
            <Text style={styles.successMessage}>
              Votre compte KetoSansStress et toutes vos données ont été définitivement supprimés.
            </Text>
            
            <Text style={styles.redirectMessage}>
              Redirection vers la page d'accueil...
            </Text>
            
            <ActivityIndicator 
              color={COLORS.success} 
              size="large" 
              style={styles.redirectLoader}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Suppression de compte</Text>
        </View>

        {/* Warning Section */}
        <View style={styles.warningSection}>
          <View style={styles.warningIcon}>
            <AlertTriangle size={60} color={COLORS.error} />
          </View>
          
          <Text style={styles.warningTitle}>
            ⚠️ SUPPRESSION DÉFINITIVE DE COMPTE
          </Text>
          
          <Text style={styles.warningMessage}>
            Vous êtes sur le point de supprimer définitivement votre compte KetoSansStress.
          </Text>
        </View>

        {/* Data Loss Warning */}
        <View style={styles.dataWarningContainer}>
          <Text style={styles.dataWarningTitle}>
            🔴 DONNÉES QUI SERONT PERDUES À JAMAIS :
          </Text>
          
          <View style={styles.dataList}>
            <Text style={styles.dataItem}>• Profil utilisateur et informations personnelles</Text>
            <Text style={styles.dataItem}>• Historique complet des repas et nutrition</Text>
            <Text style={styles.dataItem}>• Photos de repas et galerie</Text>
            <Text style={styles.dataItem}>• Préférences et paramètres personnalisés</Text>
            <Text style={styles.dataItem}>• Statistiques et rapports de progression</Text>
            <Text style={styles.dataItem}>• Toutes autres données associées au compte</Text>
          </View>
        </View>

        {/* Security Notice */}
        <View style={styles.securityNotice}>
          <Shield size={24} color={COLORS.primary} />
          <View style={styles.securityTextContainer}>
            <Text style={styles.securityTitle}>Sécurité et confidentialité</Text>
            <Text style={styles.securityText}>
              Cette action a été demandée depuis votre compte et confirmée par email pour votre sécurité.
            </Text>
          </View>
        </View>

        {/* Error Display */}
        {error && (
          <View style={styles.errorContainer}>
            <XCircle size={24} color={COLORS.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Confirmation Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.deleteButton, loading && styles.deleteButtonDisabled]}
            onPress={handleConfirmDeletion}
            disabled={loading || !token}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.surface} size="small" />
            ) : (
              <>
                <Trash2 size={20} color={COLORS.surface} />
                <Text style={styles.deleteButtonText}>
                  CONFIRMER LA SUPPRESSION DÉFINITIVE
                </Text>
              </>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>
              Annuler et revenir en arrière
            </Text>
          </TouchableOpacity>
        </View>

        {/* Final Warning */}
        <View style={styles.finalWarning}>
          <Text style={styles.finalWarningText}>
            ⚠️ Une fois confirmée, cette action ne peut pas être annulée.
            Votre compte sera supprimé immédiatement et définitivement.
          </Text>
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
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  warningSection: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: COLORS.error,
  },
  warningIcon: {
    marginBottom: 16,
  },
  warningTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: 12,
  },
  warningMessage: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  dataWarningContainer: {
    backgroundColor: '#fff5f5',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.error,
  },
  dataWarningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.error,
    marginBottom: 16,
  },
  dataList: {
    marginLeft: 10,
  },
  dataItem: {
    fontSize: 14,
    color: '#721c24',
    marginBottom: 8,
    lineHeight: 20,
  },
  securityNotice: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary + '10',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  securityTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  securityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 4,
  },
  securityText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.error + '10',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.error,
    marginLeft: 8,
  },
  buttonContainer: {
    marginBottom: 20,
  },
  deleteButton: {
    backgroundColor: COLORS.error,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  deleteButtonDisabled: {
    opacity: 0.6,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.surface,
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: COLORS.textSecondary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.surface,
  },
  finalWarning: {
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ffeaa7',
  },
  finalWarningText: {
    fontSize: 12,
    color: '#856404',
    textAlign: 'center',
    lineHeight: 18,
  },
  // Success state styles
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  successIconContainer: {
    marginBottom: 32,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.success,
    textAlign: 'center',
    marginBottom: 16,
  },
  successMessage: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  redirectMessage: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: 16,
  },
  redirectLoader: {
    marginTop: 16,
  },
});