import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import { 
  X, 
  User, 
  Lock, 
  LogOut, 
  Trash2, 
  Edit3,
  Mail,
  Calendar,
  Ruler,
  Weight,
  UserCheck,
  Save,
  Eye,
  EyeOff
} from 'lucide-react-native';
import { useAuth } from '../../hooks/useAuth';
import ValidatedInput from '../forms/ValidatedInput';
import LoadingButton from '../forms/LoadingButton';
import Select from '../forms/Select';

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

interface UserProfileData {
  email: string;
  full_name: string;
  age: number | string;
  gender: 'male' | 'female' | 'other' | '';
  height: number | string;
  weight: number | string;
}

interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface UserProfileModalProps {
  visible: boolean;
  onClose: () => void;
}

// Schémas de validation
const profileSchema = Yup.object({
  email: Yup.string()
    .email('Format email invalide')
    .required('L\'email est requis'),
  full_name: Yup.string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères')
    .required('Le nom complet est requis'),
  age: Yup.number()
    .min(13, 'L\'âge minimum est de 13 ans')
    .max(120, 'L\'âge maximum est de 120 ans')
    .required('L\'âge est requis'),
  gender: Yup.string()
    .oneOf(['male', 'female', 'other'], 'Genre invalide')
    .required('Le genre est requis'),
  height: Yup.number()
    .min(100, 'La taille minimum est de 100 cm')
    .max(250, 'La taille maximum est de 250 cm')
    .required('La taille est requise'),
  weight: Yup.number()
    .min(30, 'Le poids minimum est de 30 kg')
    .max(300, 'Le poids maximum est de 300 kg')
    .required('Le poids est requis'),
});

const passwordSchema = Yup.object({
  currentPassword: Yup.string()
    .required('Le mot de passe actuel est requis'),
  newPassword: Yup.string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/,
      'Le mot de passe doit contenir : 1 minuscule, 1 majuscule, 1 chiffre et 1 caractère spécial (!@#$%^&*)'
    )
    .required('Le nouveau mot de passe est requis'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('newPassword')], 'Les mots de passe ne correspondent pas')
    .required('La confirmation est requise'),
});

export default function UserProfileModal({ visible, onClose }: UserProfileModalProps) {
  const { user, logout, loading, updateProfile, changePassword, deleteAccount } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'account'>('profile');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form pour le profil
  const { control: profileControl, handleSubmit: handleProfileSubmit, formState: { errors: profileErrors }, reset: resetProfile } = useForm<UserProfileData>({
    resolver: yupResolver(profileSchema),
    defaultValues: {
      email: '',
      full_name: '',
      age: '',
      gender: '',
      height: '',
      weight: '',
    },
    mode: 'onChange',
  });

  // Form pour le mot de passe
  const { control: passwordControl, handleSubmit: handlePasswordSubmit, formState: { errors: passwordErrors }, reset: resetPassword } = useForm<PasswordChangeData>({
    resolver: yupResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    mode: 'onChange',
  });

  // Charger les données utilisateur au montage
  useEffect(() => {
    if (user && visible) {
      resetProfile({
        email: user.email || '',
        full_name: user.full_name || '',
        age: user.age || '',
        gender: user.gender || '',
        height: user.height || '',
        weight: user.weight || '',
      });
    }
  }, [user, visible, resetProfile]);

  const handleProfileUpdate = async (data: UserProfileData) => {
    const success = await updateProfile({
      full_name: data.full_name,
      age: typeof data.age === 'string' ? parseInt(data.age) : data.age,
      gender: data.gender,
      height: typeof data.height === 'string' ? parseFloat(data.height) : data.height,
      weight: typeof data.weight === 'string' ? parseFloat(data.weight) : data.weight,
    });
    
    if (success) {
      // The success alert is already shown in the updateProfile function
    }
  };

  const handlePasswordChange = async (data: PasswordChangeData) => {
    const success = await changePassword({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
    
    if (success) {
      resetPassword(); // Clear the password form
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            await logout();
            onClose();
          }
        }
      ]
    );
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      'Supprimer le compte',
      'Cette action est irréversible. Toutes vos données seront définitivement supprimées.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteAccount();
            if (success) {
              onClose(); // Close the modal after successful deletion
            }
          }
        }
      ]
    );
  };

  const renderTabButton = (tab: typeof activeTab, icon: React.ReactNode, label: string) => (
    <TouchableOpacity
      key={tab}
      style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
      onPress={() => setActiveTab(tab)}
    >
      {icon}
      <Text style={[styles.tabLabel, activeTab === tab && styles.activeTabLabel]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderProfileTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Edit3 color={COLORS.primary} size={20} />
          <Text style={styles.sectionTitle}>Informations personnelles</Text>
        </View>

        <Controller
          control={profileControl}
          name="email"
          render={({ field: { onChange, value } }) => (
            <ValidatedInput
              label="Email"
              value={value}
              onChangeText={onChange}
              error={profileErrors.email?.message}
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
          control={profileControl}
          name="full_name"
          render={({ field: { onChange, value } }) => (
            <ValidatedInput
              label="Nom complet"
              value={value}
              onChangeText={onChange}
              error={profileErrors.full_name?.message}
              leftIcon="user"
              placeholder="Votre nom complet"
              required
              editable={true}
            />
          )}
        />

        <Controller
          control={profileControl}
          name="age"
          render={({ field: { onChange, value } }) => (
            <ValidatedInput
              label="Âge (années)"
              value={value ? value.toString() : ''}
              onChangeText={(text) => onChange(text ? parseInt(text) || '' : '')}
              error={profileErrors.age?.message}
              keyboardType="numeric"
              placeholder="Ex: 25"
              required
              editable={true}
            />
          )}
        />

        <Controller
          control={profileControl}
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
              error={profileErrors.gender?.message}
              placeholder="Sélectionner votre genre"
              required
            />
          )}
        />

        <Controller
          control={profileControl}
          name="height"
          render={({ field: { onChange, value } }) => (
            <ValidatedInput
              label="Taille (cm)"
              value={value ? value.toString() : ''}
              onChangeText={(text) => onChange(text ? parseInt(text) || '' : '')}
              error={profileErrors.height?.message}
              keyboardType="numeric"
              placeholder="Ex: 170"
              required
              editable={true}
            />
          )}
        />

        <Controller
          control={profileControl}
          name="weight"
          render={({ field: { onChange, value } }) => (
            <ValidatedInput
              label="Poids (kg)"
              value={value ? value.toString() : ''}
              onChangeText={(text) => onChange(text ? parseFloat(text) || '' : '')}
              error={profileErrors.weight?.message}
              keyboardType="decimal-pad"
              placeholder="Ex: 70.5"
              required
              editable={true}
            />
          )}
        />
      </View>

      <View style={styles.actionContainer}>
        <LoadingButton
          onPress={handleProfileSubmit(handleProfileUpdate)}
          loading={loading}
          style={styles.saveButton}
          textStyle={styles.saveButtonText}
        >
          <Save color={COLORS.surface} size={20} style={{ marginRight: 8 }} />
          Sauvegarder les modifications
        </LoadingButton>
      </View>
    </ScrollView>
  );

  const renderPasswordTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Lock color={COLORS.primary} size={20} />
          <Text style={styles.sectionTitle}>Changer le mot de passe</Text>
        </View>

        <Controller
          control={passwordControl}
          name="currentPassword"
          render={({ field: { onChange, value } }) => (
            <ValidatedInput
              label="Mot de passe actuel"
              value={value}
              onChangeText={onChange}
              error={passwordErrors.currentPassword?.message}
              isPassword
              showPasswordToggle
              placeholder="••••••••"
              required
              editable={true}
            />
          )}
        />

        <Controller
          control={passwordControl}
          name="newPassword"
          render={({ field: { onChange, value } }) => (
            <ValidatedInput
              label="Nouveau mot de passe"
              value={value}
              onChangeText={onChange}
              error={passwordErrors.newPassword?.message}
              isPassword
              showPasswordToggle
              placeholder="••••••••"
              required
              helperText="Au moins 8 caractères avec majuscule, minuscule, chiffre et caractère spécial"
              editable={true}
            />
          )}
        />

        <Controller
          control={passwordControl}
          name="confirmPassword"
          render={({ field: { onChange, value } }) => (
            <ValidatedInput
              label="Confirmer le nouveau mot de passe"
              value={value}
              onChangeText={onChange}
              error={passwordErrors.confirmPassword?.message}
              isPassword
              showPasswordToggle
              placeholder="••••••••"
              required
              editable={true}
            />
          )}
        />
      </View>

      <View style={styles.actionContainer}>
        <LoadingButton
          onPress={handlePasswordSubmit(handlePasswordChange)}
          loading={loading}
          style={styles.saveButton}
          textStyle={styles.saveButtonText}
        >
          <Lock color={COLORS.surface} size={20} style={{ marginRight: 8 }} />
          Changer le mot de passe
        </LoadingButton>
      </View>
    </ScrollView>
  );

  const renderAccountTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <UserCheck color={COLORS.primary} size={20} />
          <Text style={styles.sectionTitle}>Gestion du compte</Text>
        </View>

        <View style={styles.accountActions}>
          <TouchableOpacity
            style={styles.accountAction}
            onPress={handleLogout}
          >
            <View style={styles.actionIcon}>
              <LogOut color={COLORS.textSecondary} size={24} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Déconnexion</Text>
              <Text style={styles.actionDescription}>
                Se déconnecter de l'application
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.accountAction, styles.dangerAction]}
            onPress={handleDeleteAccount}
          >
            <View style={[styles.actionIcon, styles.dangerActionIcon]}>
              <Trash2 color={COLORS.error} size={24} />
            </View>
            <View style={styles.actionContent}>
              <Text style={[styles.actionTitle, styles.dangerActionTitle]}>
                Supprimer mon compte
              </Text>
              <Text style={styles.actionDescription}>
                Suppression définitive de toutes vos données
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.content}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X color={COLORS.text} size={24} />
            </TouchableOpacity>
            <Text style={styles.title}>Mon Profil</Text>
            <View style={styles.placeholder} />
          </View>

          {/* User Info */}
          <View style={styles.userInfo}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                </Text>
              </View>
            </View>
            <Text style={styles.userName}>{user?.full_name || 'Utilisateur'}</Text>
            <Text style={styles.userEmail}>{user?.email || ''}</Text>
          </View>

          {/* Tabs */}
          <View style={styles.tabs}>
            {renderTabButton('profile', <User color={activeTab === 'profile' ? COLORS.surface : COLORS.textSecondary} size={20} />, 'Profil')}
            {renderTabButton('password', <Lock color={activeTab === 'password' ? COLORS.surface : COLORS.textSecondary} size={20} />, 'Sécurité')}
            {renderTabButton('account', <UserCheck color={activeTab === 'account' ? COLORS.surface : COLORS.textSecondary} size={20} />, 'Compte')}
          </View>

          {/* Tab Content */}
          {activeTab === 'profile' && renderProfileTab()}
          {activeTab === 'password' && renderPasswordTab()}
          {activeTab === 'account' && renderAccountTab()}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  placeholder: {
    width: 40,
  },
  userInfo: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: COLORS.surface,
  },
  avatarContainer: {
    marginBottom: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.surface,
  },
  userName: {
    fontSize: 22,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  activeTabButton: {
    backgroundColor: COLORS.primary,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  activeTabLabel: {
    color: COLORS.surface,
  },
  tabContent: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: 8,
  },
  actionContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.surface,
  },
  accountActions: {
    gap: 12,
  },
  accountAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dangerAction: {
    borderColor: COLORS.error + '30',
    backgroundColor: COLORS.error + '05',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  dangerActionIcon: {
    backgroundColor: COLORS.error + '15',
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  dangerActionTitle: {
    color: COLORS.error,
  },
  actionDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
});