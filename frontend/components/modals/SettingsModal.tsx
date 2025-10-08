import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  X,
  User,
  Bell,
  Target,
  HelpCircle,
  Leaf,
  Globe,
  Calculator,
  Sun,
  Moon,
  Smartphone,
  Instagram,
  Facebook,
  RotateCcw,
  Cloud,
  ChevronRight,
  Heart,
  Activity,
  Zap,
  Shield,
} from 'lucide-react-native';
import { useAuth } from '../../hooks/useAuth';
import { useHealthApp } from '../../hooks/useHealthApp';
import { useRouter } from 'expo-router';
import LoadingButton from '../forms/LoadingButton';

const COLORS = {
  primary: '#4CAF50',
  secondary: '#81C784',
  accent: '#FF7043',
  background: '#FAFAFA',
  surface: '#FFFFFF',
  text: '#212121',
  textSecondary: '#757575',
  textLight: '#9E9E9E',
  border: '#E0E0E0',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  dark: '#1A1A2E',
};

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function SettingsModal({ visible, onClose }: SettingsModalProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { 
    isConnected: healthAppConnected, 
    permissions, 
    loading: healthAppLoading, 
    lastSyncDate,
    requestPermissions, 
    syncHealthData, 
    disconnectHealthApp,
    isSupported: healthAppSupported 
  } = useHealthApp();

  const [currentView, setCurrentView] = useState<'main' | 'information'>('main');
  
  // États des paramètres
  const [userStatus, setUserStatus] = useState('Lite');
  const [reminders, setReminders] = useState('Aucun');
  const [objective, setObjective] = useState('Keto');
  const [countNetCarbs, setCountNetCarbs] = useState(true);
  const [region, setRegion] = useState('Suisse');
  const [units, setUnits] = useState('kcal,kg');
  const [darkMode, setDarkMode] = useState<'auto' | 'light' | 'dark'>('dark');
  const [synchronizationEnabled, setSynchronizationEnabled] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [autoSync, setAutoSync] = useState(true);
  const [ketoAlerts, setKetoAlerts] = useState(true);
  const [language, setLanguage] = useState('français');
  const [biometricLock, setBiometricLock] = useState(false);
  const [dataSaver, setDataSaver] = useState(false);

  const handleUpgradeToPro = () => {
    Alert.alert(
      'Passer à PRO',
      'Débloquez toutes les fonctionnalités premium de KetoSansStress !',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'En savoir plus', onPress: () => console.log('Upgrade to PRO') }
      ]
    );
  };

  const handleModifyReminders = () => {
    Alert.alert(
      'Rappels',
      'Configuration des notifications de rappel',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Configurer', onPress: () => console.log('Configure reminders') }
      ]
    );
  };

  const handleModifyObjectives = () => {
    // ✅ Fermer le modal et rediriger vers le questionnaire d'onboarding en mode édition
    onClose();
    router.push('/onboarding?mode=edit');
  };

  const handleCustomerService = () => {
    Alert.alert(
      'Service client',
      'Comment pouvons-nous vous aider ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'FAQ', onPress: () => console.log('Show FAQ') },
        { text: 'Contacter', onPress: () => console.log('Contact support') }
      ]
    );
  };

  const handleRegionChange = () => {
    Alert.alert(
      'Région',
      'Sélectionnez votre région',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'France', onPress: () => setRegion('France') },
        { text: 'Suisse', onPress: () => setRegion('Suisse') },
        { text: 'Belgique', onPress: () => setRegion('Belgique') },
        { text: 'Canada', onPress: () => setRegion('Canada') }
      ]
    );
  };

  const handleUnitsChange = () => {
    Alert.alert(
      'Unités',
      'Sélectionnez vos unités préférées',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'kcal, kg', onPress: () => setUnits('kcal,kg') },
        { text: 'cal, lb', onPress: () => setUnits('cal,lb') },
        { text: 'kJ, kg', onPress: () => setUnits('kJ,kg') }
      ]
    );
  };

  const handleResetTutorial = () => {
    Alert.alert(
      'Réinitialiser le tutoriel',
      'Voulez-vous redémarrer le guide d\'introduction ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Réinitialiser', onPress: () => console.log('Reset tutorial') }
      ]
    );
  };

  const handleDataManagement = () => {
    Alert.alert(
      'Gestion de données',
      'Gérer vos données personnelles',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Exporter', onPress: () => console.log('Export data') },
        { text: 'Supprimer', onPress: () => console.log('Delete data'), style: 'destructive' }
      ]
    );
  };

  const renderMainSettings = () => (
    <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
      {/* Section utilisateur */}
      <View style={styles.section}>
        {/* Profil utilisateur */}
        <TouchableOpacity style={styles.profileCard} activeOpacity={0.7}>
          <View style={styles.profileIcon}>
            <Text style={styles.profileEmoji}>🥑</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>Ben</Text>
            <Text style={styles.profileStatus}>Status: {userStatus}</Text>
          </View>
          <TouchableOpacity style={styles.proButton} onPress={handleUpgradeToPro}>
            <Text style={styles.proButtonText}>Devenir un PRO</Text>
          </TouchableOpacity>
        </TouchableOpacity>

        {/* Rappels */}
        <TouchableOpacity style={styles.settingCard} onPress={handleModifyReminders}>
          <View style={styles.settingIcon}>
            <Bell color={COLORS.primary} size={24} />
          </View>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Rappeler</Text>
            <Text style={styles.settingValue}>{reminders}</Text>
          </View>
          <TouchableOpacity style={styles.modifyButton} onPress={handleModifyReminders}>
            <Text style={styles.modifyButtonText}>Modifier</Text>
          </TouchableOpacity>
        </TouchableOpacity>

        {/* Changer objectifs */}
        <TouchableOpacity style={styles.settingCard} onPress={handleModifyObjectives}>
          <View style={styles.settingIcon}>
            <Target color={COLORS.primary} size={24} />
          </View>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Modifier mes objectifs</Text>
            <Text style={styles.settingValue}>Reprendre le questionnaire</Text>
          </View>
          <TouchableOpacity style={styles.modifyButton} onPress={handleModifyObjectives}>
            <Text style={styles.modifyButtonText}>Modifier</Text>
            <ChevronRight color={COLORS.primary} size={16} />
          </TouchableOpacity>
        </TouchableOpacity>

        {/* Service client */}
        <TouchableOpacity style={styles.settingCard} onPress={handleCustomerService}>
          <View style={styles.settingIcon}>
            <HelpCircle color={COLORS.primary} size={24} />
          </View>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Service client</Text>
          </View>
          <TouchableOpacity style={styles.contactButton} onPress={handleCustomerService}>
            <Text style={styles.contactButtonText}>Contact</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </View>

      {/* Section Paramètres */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Paramètres</Text>

        {/* Compter glucides nets */}
        <View style={styles.settingRow}>
          <View style={styles.settingRowIcon}>
            <Leaf color={COLORS.primary} size={20} />
          </View>
          <Text style={styles.settingRowText}>Compter glucides nets</Text>
          <Switch
            value={countNetCarbs}
            onValueChange={setCountNetCarbs}
            thumbColor={countNetCarbs ? COLORS.surface : COLORS.textLight}
            trackColor={{ false: COLORS.border, true: COLORS.primary }}
          />
        </View>

        {/* Région */}
        <TouchableOpacity style={styles.settingRow} onPress={handleRegionChange}>
          <View style={styles.settingRowIcon}>
            <Globe color={COLORS.primary} size={20} />
          </View>
          <Text style={styles.settingRowText}>Région</Text>
          <View style={styles.settingRowRight}>
            <Text style={styles.settingRowValue}>{region}</Text>
            <ChevronRight color={COLORS.textSecondary} size={16} />
          </View>
        </TouchableOpacity>

        {/* Unité */}
        <TouchableOpacity style={styles.settingRow} onPress={handleUnitsChange}>
          <View style={styles.settingRowIcon}>
            <Calculator color={COLORS.primary} size={20} />
          </View>
          <Text style={styles.settingRowText}>Unité</Text>
          <View style={styles.settingRowRight}>
            <Text style={styles.settingRowValue}>{units}</Text>
            <ChevronRight color={COLORS.textSecondary} size={16} />
          </View>
        </TouchableOpacity>

        {/* Mode sombre */}
        <View style={styles.settingRow}>
          <View style={styles.settingRowIcon}>
            <Sun color={COLORS.primary} size={20} />
          </View>
          <Text style={styles.settingRowText}>Mode sombre</Text>
          <View style={styles.darkModeSelector}>
            <TouchableOpacity
              style={[styles.darkModeOption, darkMode === 'light' && styles.selectedDarkModeOption]}
              onPress={() => setDarkMode('light')}
            >
              <Sun size={16} color={darkMode === 'light' ? COLORS.surface : COLORS.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.darkModeOption, darkMode === 'auto' && styles.selectedDarkModeOption]}
              onPress={() => setDarkMode('auto')}
            >
              <Text style={[styles.darkModeText, darkMode === 'auto' && styles.selectedDarkModeText]}>A</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.darkModeOption, darkMode === 'dark' && styles.selectedDarkModeOption]}
              onPress={() => setDarkMode('dark')}
            >
              <Moon size={16} color={darkMode === 'dark' ? COLORS.surface : COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Section HealthApp */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Synchronisation Santé</Text>
        
        {/* HealthApp Connection */}
        <View style={styles.settingCard}>
          <View style={styles.settingIcon}>
            <Heart color={healthAppConnected ? COLORS.success : COLORS.textSecondary} size={24} />
          </View>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>
              HealthApp {healthAppSupported ? '' : '(Non supporté)'}
            </Text>
            <Text style={styles.settingValue}>
              {healthAppConnected 
                ? `Connecté${lastSyncDate ? ` • Sync: ${lastSyncDate.toLocaleDateString('fr-FR')}` : ''}`
                : 'Non connecté'
              }
            </Text>
          </View>
          <LoadingButton
            title={healthAppConnected ? 'Sync' : 'Connecter'}
            onPress={healthAppConnected ? syncHealthData : requestPermissions}
            loading={healthAppLoading}
            variant={healthAppConnected ? 'secondary' : 'primary'}
            size="small"
            disabled={!healthAppSupported}
            style={styles.healthAppButton}
          />
        </View>

        {/* HealthApp Permissions */}
        {healthAppConnected && (
          <View style={styles.permissionsContainer}>
            <Text style={styles.permissionsTitle}>Données synchronisées :</Text>
            
            <View style={styles.permissionRow}>
              <Activity size={16} color={permissions.steps ? COLORS.success : COLORS.textSecondary} />
              <Text style={styles.permissionText}>Pas & Activité</Text>
              <Text style={styles.permissionStatus}>
                {permissions.steps ? 'Activé' : 'Désactivé'}
              </Text>
            </View>

            <View style={styles.permissionRow}>
              <Target size={16} color={permissions.weight ? COLORS.success : COLORS.textSecondary} />
              <Text style={styles.permissionText}>Poids</Text>
              <Text style={styles.permissionStatus}>
                {permissions.weight ? 'Activé' : 'Désactivé'}
              </Text>
            </View>

            <View style={styles.permissionRow}>
              <Zap size={16} color={permissions.activeEnergyBurned ? COLORS.success : COLORS.textSecondary} />
              <Text style={styles.permissionText}>Calories brûlées</Text>
              <Text style={styles.permissionStatus}>
                {permissions.activeEnergyBurned ? 'Activé' : 'Désactivé'}
              </Text>
            </View>

            <View style={styles.permissionRow}>
              <Heart size={16} color={permissions.heartRate ? COLORS.success : COLORS.textSecondary} />
              <Text style={styles.permissionText}>Rythme cardiaque</Text>
              <Text style={styles.permissionStatus}>
                {permissions.heartRate ? 'Activé' : 'Désactivé'}
              </Text>
            </View>

            {/* Disconnect Button */}
            <TouchableOpacity 
              style={styles.disconnectButton}
              onPress={disconnectHealthApp}
              disabled={healthAppLoading}
            >
              <Text style={styles.disconnectButtonText}>Déconnecter HealthApp</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Synchronisation automatique */}
        <View style={styles.settingRow}>
          <View style={styles.settingRowIcon}>
            <Cloud color={COLORS.primary} size={20} />
          </View>
          <Text style={styles.settingRowText}>Sync automatique</Text>
          <Switch
            value={autoSync}
            onValueChange={setAutoSync}
            trackColor={{ false: COLORS.border, true: COLORS.secondary }}
            thumbColor={autoSync ? COLORS.primary : COLORS.textLight}
          />
        </View>

        {/* Économiseur de données */}
        <View style={styles.settingRow}>
          <View style={styles.settingRowIcon}>
            <Shield size={20} color={COLORS.primary} />
          </View>
          <Text style={styles.settingRowText}>Économiseur de données</Text>
          <Switch
            value={dataSaver}
            onValueChange={setDataSaver}
            trackColor={{ false: COLORS.border, true: COLORS.secondary }}
            thumbColor={dataSaver ? COLORS.primary : COLORS.textLight}
          />
        </View>

        {/* Verrouillage biométrique */}
        <View style={styles.settingRow}>
          <View style={styles.settingRowIcon}>
            <Smartphone size={20} color={COLORS.primary} />
          </View>
          <Text style={styles.settingRowText}>Verrouillage biométrique</Text>
          <Switch
            value={biometricLock}
            onValueChange={setBiometricLock}
            trackColor={{ false: COLORS.border, true: COLORS.secondary }}
            thumbColor={biometricLock ? COLORS.primary : COLORS.textLight}
          />
        </View>
      </View>

      {/* Bouton Information */}
      <View style={styles.section}>
        <TouchableOpacity 
          style={styles.informationButton} 
          onPress={() => setCurrentView('information')}
        >
          <Text style={styles.informationButtonText}>Information</Text>
          <ChevronRight color={COLORS.primary} size={20} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderInformationView = () => (
    <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Information</Text>

        {/* Instagram */}
        <TouchableOpacity style={styles.informationRow}>
          <View style={styles.informationIcon}>
            <Instagram color="#E4405F" size={20} />
          </View>
          <Text style={styles.informationText}>Instagram</Text>
          <ChevronRight color={COLORS.textSecondary} size={16} />
        </TouchableOpacity>

        {/* Facebook */}
        <TouchableOpacity style={styles.informationRow}>
          <View style={styles.informationIcon}>
            <Facebook color="#1877F2" size={20} />
          </View>
          <Text style={styles.informationText}>Facebook</Text>
          <ChevronRight color={COLORS.textSecondary} size={16} />
        </TouchableOpacity>

        {/* Pinterest */}
        <TouchableOpacity style={styles.informationRow}>
          <View style={styles.informationIcon}>
            <Text style={styles.pinterestIcon}>P</Text>
          </View>
          <Text style={styles.informationText}>Pinterest</Text>
          <ChevronRight color={COLORS.textSecondary} size={16} />
        </TouchableOpacity>

        {/* Réinitialiser le tutoriel */}
        <TouchableOpacity style={styles.informationRow} onPress={handleResetTutorial}>
          <View style={styles.informationIcon}>
            <RotateCcw color={COLORS.error} size={20} />
          </View>
          <Text style={styles.informationText}>Réinitialiser le tutoriel</Text>
          <ChevronRight color={COLORS.textSecondary} size={16} />
        </TouchableOpacity>

        {/* Gestion de données */}
        <TouchableOpacity style={styles.informationRow} onPress={handleDataManagement}>
          <View style={styles.informationIcon}>
            <Cloud color={COLORS.primary} size={20} />
          </View>
          <Text style={styles.informationText}>Gestion de données</Text>
          <ChevronRight color={COLORS.textSecondary} size={16} />
        </TouchableOpacity>

        {/* Synchronisation */}
        <View style={styles.informationRow}>
          <View style={styles.informationIcon}>
            <Cloud color={COLORS.success} size={20} />
          </View>
          <Text style={styles.informationText}>
            La synchronisation est {synchronizationEnabled ? 'activée' : 'désactivée'}
          </Text>
          <Switch
            value={synchronizationEnabled}
            onValueChange={setSynchronizationEnabled}
            thumbColor={synchronizationEnabled ? COLORS.surface : COLORS.textLight}
            trackColor={{ false: COLORS.border, true: COLORS.success }}
          />
        </View>

        {/* Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Version: 8.2.3 (6)</Text>
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
      <View style={styles.modalContainer}>
        {/* En-tête */}
        <View style={styles.modalHeader}>
          <View style={styles.headerContent}>
            {currentView === 'information' && (
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setCurrentView('main')}
              >
                <Text style={styles.backButtonText}>← Retour</Text>
              </TouchableOpacity>
            )}
            <Text style={styles.modalTitle}>
              {currentView === 'main' ? 'Paramètres' : 'Information'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <X color={COLORS.textSecondary} size={24} />
          </TouchableOpacity>
        </View>

        {/* Contenu */}
        {currentView === 'main' ? renderMainSettings() : renderInformationView()}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.dark, // Fond sombre comme dans les captures
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: COLORS.dark,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.surface,
  },
  closeButton: {
    padding: 8,
    marginLeft: 16,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: COLORS.dark,
  },
  section: {
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.surface,
    marginBottom: 16,
  },
  
  // Cartes de paramètres
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.textSecondary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  profileIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  profileEmoji: {
    fontSize: 24,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.surface,
    marginBottom: 4,
  },
  profileStatus: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  proButton: {
    backgroundColor: '#9ACD32', // Vert citron comme dans la capture
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  proButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
  },
  settingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.textSecondary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.surface,
    marginBottom: 4,
  },
  settingValue: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  modifyButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  modifyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.surface,
  },
  contactButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  contactButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.surface,
  },
  
  // Lignes de paramètres
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.textSecondary,
  },
  settingRowIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  settingRowText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.surface,
    fontWeight: '500',
  },
  settingRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingRowValue: {
    fontSize: 16,
    color: COLORS.textLight,
    marginRight: 8,
  },
  
  // Sélecteur mode sombre
  darkModeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  darkModeOption: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  selectedDarkModeOption: {
    backgroundColor: COLORS.primary,
  },
  darkModeText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  selectedDarkModeText: {
    color: COLORS.surface,
  },
  
  // Bouton Information
  informationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.textSecondary,
    borderRadius: 16,
    padding: 16,
  },
  informationButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.surface,
  },
  
  // Vue Information
  informationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.textSecondary,
  },
  informationIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  pinterestIcon: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E60023',
  },
  informationText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.surface,
    fontWeight: '500',
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  versionText: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  
  // Styles HealthApp
  healthAppButton: {
    minWidth: 80,
  },
  permissionsContainer: {
    backgroundColor: COLORS.textSecondary,
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  permissionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.surface,
    marginBottom: 12,
  },
  permissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  permissionText: {
    fontSize: 14,
    color: COLORS.surface,
    marginLeft: 12,
    flex: 1,
  },
  permissionStatus: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  disconnectButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.error,
    borderRadius: 8,
    alignItems: 'center',
  },
  disconnectButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.surface,
  },
});