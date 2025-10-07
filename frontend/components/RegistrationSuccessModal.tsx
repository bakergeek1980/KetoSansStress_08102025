import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { CheckCircle, Mail, X } from 'lucide-react-native';

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

interface RegistrationSuccessModalProps {
  visible: boolean;
  email: string;
  fullName: string;
  onClose: () => void;
}

const RegistrationSuccessModal: React.FC<RegistrationSuccessModalProps> = ({
  visible,
  email,
  fullName,
  onClose,
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.modalContainer}>
            {/* Bouton fermer */}
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>

            {/* Icône de succès */}
            <View style={styles.iconContainer}>
              <CheckCircle size={80} color={COLORS.success} />
            </View>

            {/* Titre */}
            <Text style={styles.title}>
              Merci pour votre inscription !
            </Text>

            {/* Message personnalisé */}
            <Text style={styles.personalMessage}>
              Bonjour {fullName} ! 👋
            </Text>

            {/* Section info email */}
            <View style={styles.emailSection}>
              <View style={styles.emailHeader}>
                <Mail size={24} color={COLORS.primary} />
                <Text style={styles.emailTitle}>
                  Un email de validation a été envoyé à l'adresse :
                </Text>
              </View>
              
              <Text style={styles.emailAddress}>
                {email}
              </Text>
            </View>

            {/* Instructions */}
            <View style={styles.instructionsContainer}>
              <Text style={styles.instructions}>
                📧 Veuillez confirmer votre adresse email en cliquant sur le lien dans l'email.
              </Text>
              
              <Text style={styles.spamNote}>
                (Vérifiez également vos spams si vous ne le trouvez pas)
              </Text>
            </View>

            {/* Bouton fermer */}
            <TouchableOpacity style={styles.closeButtonLarge} onPress={onClose}>
              <Text style={styles.closeButtonText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  safeArea: {
    width: '100%',
    maxWidth: 400,
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
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
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
    marginBottom: 24,
    marginTop: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  personalMessage: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 32,
  },
  emailSection: {
    width: '100%',
    backgroundColor: COLORS.primary + '10',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.primary + '20',
  },
  emailHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  emailTitle: {
    fontSize: 14,
    color: COLORS.text,
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  emailAddress: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
    backgroundColor: COLORS.surface,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  instructionsContainer: {
    width: '100%',
    marginBottom: 32,
  },
  instructions: {
    fontSize: 14,
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
  spamNote: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  closeButtonLarge: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.surface,
  },
});

export default RegistrationSuccessModal;