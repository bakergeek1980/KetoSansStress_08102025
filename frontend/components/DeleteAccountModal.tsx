import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { AlertTriangle, X } from 'lucide-react-native';

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

interface DeleteAccountModalProps {
  visible: boolean;
  userName: string;
  onCancel: () => void;
  onConfirm: () => void;
}

const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  visible,
  userName,
  onCancel,
  onConfirm,
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.modalContainer}>
            {/* Bouton fermer */}
            <TouchableOpacity style={styles.closeButton} onPress={onCancel}>
              <X size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>

            {/* Icône d'alerte */}
            <View style={styles.iconContainer}>
              <AlertTriangle size={80} color={COLORS.error} />
            </View>

            {/* Titre principal */}
            <Text style={styles.mainTitle}>
              ⚠️ ATTENTION
            </Text>

            {/* Sous-titre */}
            <Text style={styles.subtitle}>
              Suppression définitive du compte
            </Text>

            {/* Message personnalisé */}
            <Text style={styles.personalMessage}>
              {userName}, cette action est IRRÉVERSIBLE !
            </Text>

            {/* Container d'avertissement rouge */}
            <View style={styles.warningContainer}>
              <Text style={styles.warningTitle}>
                🗑️ DONNÉES QUI SERONT SUPPRIMÉES :
              </Text>
              
              <View style={styles.dataList}>
                <Text style={styles.dataItem}>• Votre profil utilisateur complet</Text>
                <Text style={styles.dataItem}>• Tous vos repas et données nutritionnelles</Text>
                <Text style={styles.dataItem}>• Votre historique d'hydratation</Text>
                <Text style={styles.dataItem}>• Vos mesures de poids et progression</Text>
                <Text style={styles.dataItem}>• Vos préférences et paramètres</Text>
                <Text style={styles.dataItem}>• Votre photo de profil</Text>
                <Text style={styles.dataItem}>• TOUTES vos données d'utilisation</Text>
              </View>
              
              <Text style={styles.finalWarning}>
                ⚠️ Cette action ne peut pas être annulée !
              </Text>
            </View>

            {/* Boutons d'action */}
            <View style={styles.buttonsContainer}>
              <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.deleteButton} onPress={onConfirm}>
                <Text style={styles.deleteButtonText}>Supprimer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  safeArea: {
    width: '100%',
    maxWidth: 420,
  },
  modalContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    paddingVertical: 30,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 15,
    },
    shadowOpacity: 0.35,
    shadowRadius: 25,
    elevation: 25,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  iconContainer: {
    marginBottom: 20,
    marginTop: 16,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  personalMessage: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: 24,
  },
  warningContainer: {
    width: '100%',
    backgroundColor: COLORS.error + '10',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: COLORS.error + '30',
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.error,
    marginBottom: 12,
    textAlign: 'center',
  },
  dataList: {
    marginBottom: 16,
  },
  dataItem: {
    fontSize: 13,
    color: COLORS.text,
    marginBottom: 4,
    lineHeight: 18,
  },
  finalWarning: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.error,
    textAlign: 'center',
    backgroundColor: COLORS.surface,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  buttonsContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: COLORS.error,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.surface,
  },
});

export default DeleteAccountModal;