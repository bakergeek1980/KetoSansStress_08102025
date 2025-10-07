import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { 
  ArrowLeft,
  User, 
  Lock, 
  LogOut, 
  Trash2, 
  Camera,
  Save,
  Eye,
  EyeOff,
  Mail,
  Calendar,
  Ruler,
  Weight,
  UserCheck,
} from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import SimpleInput from '../components/forms/SimpleInput';

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

interface UserProfile {
  full_name: string;
  age: string;
  gender: 'male' | 'female' | 'other';
  height: string;
  weight: string;
  activity_level: string;
  goal: string;
  profile_picture_url?: string;
}

type TabType = 'profile' | 'security' | 'account';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, updateProfile, changePassword, deleteAccount, loading } = useAuth();
  
  // States
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [profileData, setProfileData] = useState<UserProfile>({
    full_name: '',
    age: '',
    gender: 'male',
    height: '',
    weight: '',
    activity_level: 'moderately_active',
    goal: 'maintenance',
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  
  const [uploading, setUploading] = useState(false);

  // Initialize profile data from user
  useEffect(() => {
    if (user) {
      setProfileData({
        full_name: user.full_name || '',
        age: user.age?.toString() || '',
        gender: user.gender || 'male',
        height: user.height?.toString() || '',
        weight: user.weight?.toString() || '',
        activity_level: user.activity_level || 'moderately_active',
        goal: user.goal || 'maintenance',
        profile_picture_url: user.profile_picture_url,
      });
    }
  }, [user]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      router.replace('/auth');
      return;
    }
  }, [user]);

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={COLORS.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const handleImagePicker = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission requise', 'Nous avons besoin d\'accéder à vos photos pour changer votre photo de profil.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setUploading(true);
        // TODO: Upload to Supabase Storage and update profile
        // For now, just update local state
        setProfileData(prev => ({
          ...prev,
          profile_picture_url: result.assets[0].uri
        }));
        setUploading(false);
      }
    } catch (error) {
      console.error('Erreur upload image:', error);
      Alert.alert('Erreur', 'Impossible d\'uploader l\'image');
      setUploading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const dataToUpdate = {
        full_name: profileData.full_name,
        age: parseInt(profileData.age) || 0,
        gender: profileData.gender,
        height: parseInt(profileData.height) || 0,
        weight: parseFloat(profileData.weight) || 0,
        activity_level: profileData.activity_level,
        goal: profileData.goal,
      };

      const success = await updateProfile(dataToUpdate);
      if (success) {
        Alert.alert('Succès', 'Profil mis à jour avec succès !');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de mettre à jour le profil');
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert('Erreur', 'Les nouveaux mots de passe ne correspondent pas');
      return;
    }

    try {
      const success = await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      
      if (success) {
        Alert.alert('Succès', 'Mot de passe changé avec succès !');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de changer le mot de passe');
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      '🔴 SUPPRIMER LE COMPTE DÉFINITIVEMENT',
      '⚠️ ATTENTION : Cette action est IRRÉVERSIBLE !\n\n' +
      'Toutes vos données seront supprimées :\n' +
      '• Profil et informations personnelles\n' +
      '• Historique des repas et nutrition\n' +
      '• Photos et préférences\n' +
      '• Tous vos paramètres\n\n' +
      '✉️ Un email de confirmation de suppression sera envoyé à : ' + user.email,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'OUI, SUPPRIMER MON COMPTE', 
          style: 'destructive',
          onPress: () => confirmFinalDeletion()
        }
      ]
    );
  };

  const confirmFinalDeletion = () => {
    Alert.alert(
      '🚨 DERNIÈRE CONFIRMATION',
      'Êtes-vous absolument certain(e) de vouloir supprimer votre compte ?\n\n' +
      'Cette action supprimera immédiatement et définitivement toutes vos données.',
      [
        { text: 'Non, annuler', style: 'cancel' },
        { 
          text: 'OUI, SUPPRIMER MAINTENANT', 
          style: 'destructive',
          onPress: executeFinalDeletion
        }
      ]
    );
  };

  const executeFinalDeletion = async () => {
    try {
      // Call the direct deletion function
      const success = await deleteAccountDirectly();
      if (success) {
        Alert.alert(
          '✅ Compte supprimé',
          'Votre compte a été supprimé avec succès. Un email de confirmation a été envoyé.',
          [
            {
              text: 'OK',
              onPress: () => {
                logout();
                router.replace('/auth');
              }
            }
          ]
        );
      }
    } catch (error) {
      Alert.alert(
        'Erreur',
        'Impossible de supprimer le compte. Veuillez réessayer.'
      );
    }
  };

  const deleteAccountDirectly = async (): Promise<boolean> => {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || ''}/api/auth/delete-account-direct`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token || ''}`,
        },
        body: JSON.stringify({
          email: user.email,
          full_name: user.full_name || 'Utilisateur'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        return true;
      } else {
        console.error('Delete account error:', data);
        return false;
      }
    } catch (error) {
      console.error('Delete account request failed:', error);
      return false;
    }
  };

  const renderProfileTab = () => (
    <ScrollView style={styles.tabContent}>
      {/* Profile Picture Section - Zone photo principale */}
      <View style={styles.profilePictureSection}>
        <Text style={styles.photoSectionTitle}>Photo de profil</Text>
        <Text style={styles.photoSectionSubtitle}>
          Ajoutez une photo pour personnaliser votre profil
        </Text>
        
        <TouchableOpacity 
          style={styles.profilePictureContainer}
          onPress={handleImagePicker}
          disabled={uploading}
        >
          {profileData.profile_picture_url ? (
            <Image 
              source={{ uri: profileData.profile_picture_url }}
              style={styles.profileImage}
            />
          ) : (
            <View style={styles.initialsContainer}>
              <Text style={styles.initialsText}>
                {getInitials(profileData.full_name || 'U')}
              </Text>
            </View>
          )}
          
          {/* Overlay avec icône camera */}
          <View style={styles.photoOverlay}>
            <View style={styles.cameraIconContainer}>
              {uploading ? (
                <ActivityIndicator size="small" color={COLORS.surface} />
              ) : (
                <Camera size={20} color={COLORS.surface} />
              )}
            </View>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.changePhotoButton}
          onPress={handleImagePicker} 
          disabled={uploading}
        >
          <Camera size={18} color={COLORS.primary} />
          <Text style={styles.changePhotoText}>
            {profileData.profile_picture_url ? 'Changer la photo' : 'Ajouter une photo'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Profile Form */}
      <View style={styles.formSection}>
        <SimpleInput
          label="Nom complet"
          value={profileData.full_name}
          onChangeText={(text) => setProfileData(prev => ({ ...prev, full_name: text }))}
          placeholder="Votre nom complet"
          leftIcon="user"
        />

        <DateInput
          label="Date de naissance"
          value={profileData.birth_date ? new Date(profileData.birth_date) : null}
          onChange={(date) => {
            setProfileData(prev => ({ 
              ...prev, 
              birth_date: date.toISOString().split('T')[0],
              age: (new Date().getFullYear() - date.getFullYear()).toString()
            }));
          }}
          placeholder="Sélectionnez votre date de naissance"
          maximumDate={new Date()}
          minimumDate={new Date(1900, 0, 1)}
        />

        <View style={styles.selectContainer}>
          <Text style={styles.selectLabel}>Genre</Text>
          <View style={styles.selectWrapper}>
            <UserCheck size={20} color={COLORS.textLight} style={styles.selectIcon} />
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => {
                Alert.alert(
                  'Sélectionner votre genre',
                  '',
                  [
                    { text: 'Homme', onPress: () => setProfileData(prev => ({ ...prev, gender: 'male' })) },
                    { text: 'Femme', onPress: () => setProfileData(prev => ({ ...prev, gender: 'female' })) },
                    { text: 'Autre', onPress: () => setProfileData(prev => ({ ...prev, gender: 'other' })) },
                    { text: 'Annuler', style: 'cancel' }
                  ]
                );
              }}
            >
              <Text style={styles.selectText}>
                {profileData.gender === 'male' ? 'Homme' : 
                 profileData.gender === 'female' ? 'Femme' : 'Autre'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <SimpleInput
          label="Taille (cm)"
          value={profileData.height}
          onChangeText={(text) => setProfileData(prev => ({ ...prev, height: text }))}
          placeholder="Ex: 170"
          keyboardType="numeric"
          leftIcon="ruler"
        />

        <SimpleInput
          label="Poids (kg)"
          value={profileData.weight}
          onChangeText={(text) => setProfileData(prev => ({ ...prev, weight: text }))}
          placeholder="Ex: 70"
          keyboardType="decimal-pad"
          leftIcon="weight"
        />

        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleUpdateProfile}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.surface} size="small" />
          ) : (
            <>
              <Save size={20} color={COLORS.surface} />
              <Text style={styles.saveButtonText}>Valider les modifications</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderSecurityTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Changer le mot de passe</Text>
        
        <View style={styles.passwordContainer}>
          <Text style={styles.inputLabel}>Mot de passe actuel</Text>
          <View style={styles.passwordInputWrapper}>
            <Lock size={20} color={COLORS.textLight} style={styles.inputIcon} />
            <TextInput
              style={styles.passwordInput}
              value={passwordData.currentPassword}
              onChangeText={(text) => setPasswordData(prev => ({ ...prev, currentPassword: text }))}
              secureTextEntry={!showPasswords.current}
              placeholder="Mot de passe actuel"
              placeholderTextColor={COLORS.textLight}
            />
            <TouchableOpacity
              onPress={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
              style={styles.eyeIcon}
            >
              {showPasswords.current ? 
                <EyeOff size={20} color={COLORS.textLight} /> :
                <Eye size={20} color={COLORS.textLight} />
              }
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.passwordContainer}>
          <Text style={styles.inputLabel}>Nouveau mot de passe</Text>
          <View style={styles.passwordInputWrapper}>
            <Lock size={20} color={COLORS.textLight} style={styles.inputIcon} />
            <TextInput
              style={styles.passwordInput}
              value={passwordData.newPassword}
              onChangeText={(text) => setPasswordData(prev => ({ ...prev, newPassword: text }))}
              secureTextEntry={!showPasswords.new}
              placeholder="Nouveau mot de passe"
              placeholderTextColor={COLORS.textLight}
            />
            <TouchableOpacity
              onPress={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
              style={styles.eyeIcon}
            >
              {showPasswords.new ? 
                <EyeOff size={20} color={COLORS.textLight} /> :
                <Eye size={20} color={COLORS.textLight} />
              }
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.passwordContainer}>
          <Text style={styles.inputLabel}>Confirmer le nouveau mot de passe</Text>
          <View style={styles.passwordInputWrapper}>
            <Lock size={20} color={COLORS.textLight} style={styles.inputIcon} />
            <TextInput
              style={styles.passwordInput}
              value={passwordData.confirmPassword}
              onChangeText={(text) => setPasswordData(prev => ({ ...prev, confirmPassword: text }))}
              secureTextEntry={!showPasswords.confirm}
              placeholder="Confirmer le mot de passe"
              placeholderTextColor={COLORS.textLight}
            />
            <TouchableOpacity
              onPress={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
              style={styles.eyeIcon}
            >
              {showPasswords.confirm ? 
                <EyeOff size={20} color={COLORS.textLight} /> :
                <Eye size={20} color={COLORS.textLight} />
              }
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleChangePassword}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.surface} size="small" />
          ) : (
            <>
              <Save size={20} color={COLORS.surface} />
              <Text style={styles.saveButtonText}>Changer le mot de passe</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderAccountTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Gestion du compte</Text>
        
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <LogOut size={20} color={COLORS.surface} />
          <Text style={styles.logoutButtonText}>Se déconnecter</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
          <Trash2 size={20} color={COLORS.surface} />
          <Text style={styles.deleteButtonText}>Supprimer le compte</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mon Profil</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* User Info - Simplifié sans photo */}
        <View style={styles.userInfoContainer}>
          <Text style={styles.userName}>{profileData.full_name || 'Utilisateur'}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          <Text style={styles.userWelcome}>Gérez votre profil et vos paramètres</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'profile' && styles.activeTab]}
            onPress={() => setActiveTab('profile')}
          >
            <User size={20} color={activeTab === 'profile' ? COLORS.primary : COLORS.textSecondary} />
            <Text style={[styles.tabText, activeTab === 'profile' && styles.activeTabText]}>
              Profil
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'security' && styles.activeTab]}
            onPress={() => setActiveTab('security')}
          >
            <Lock size={20} color={activeTab === 'security' ? COLORS.primary : COLORS.textSecondary} />
            <Text style={[styles.tabText, activeTab === 'security' && styles.activeTabText]}>
              Sécurité
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'account' && styles.activeTab]}
            onPress={() => setActiveTab('account')}
          >
            <UserCheck size={20} color={activeTab === 'account' ? COLORS.primary : COLORS.textSecondary} />
            <Text style={[styles.tabText, activeTab === 'account' && styles.activeTabText]}>
              Compte
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === 'profile' && renderProfileTab()}
        {activeTab === 'security' && renderSecurityTab()}
        {activeTab === 'account' && renderAccountTab()}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 44,
  },
  userInfoContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  avatarContainer: {
    marginBottom: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.surface,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginLeft: 8,
  },
  activeTabText: {
    color: COLORS.primary,
  },
  tabContent: {
    flex: 1,
  },
  profilePictureSection: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: COLORS.surface,
    marginBottom: 8,
  },
  profilePictureContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  initialsContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: COLORS.surface,
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  changePhotoText: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '600',
  },
  formSection: {
    backgroundColor: COLORS.surface,
    padding: 20,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 20,
  },
  selectContainer: {
    marginBottom: 16,
  },
  selectLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  selectWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    minHeight: 52,
  },
  selectIcon: {
    marginRight: 8,
  },
  selectButton: {
    flex: 1,
    paddingVertical: 12,
  },
  selectText: {
    fontSize: 16,
    color: COLORS.text,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.surface,
    marginLeft: 8,
  },
  passwordContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  passwordInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    minHeight: 52,
  },
  inputIcon: {
    marginRight: 8,
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    paddingVertical: 12,
  },
  eyeIcon: {
    paddingHorizontal: 4,
  },
  logoutButton: {
    backgroundColor: COLORS.textSecondary,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.surface,
    marginLeft: 8,
  },
  deleteButton: {
    backgroundColor: COLORS.error,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.surface,
    marginLeft: 8,
  },
});