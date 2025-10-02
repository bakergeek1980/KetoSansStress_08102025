import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  User, 
  Mail, 
  Calendar, 
  Weight, 
  Ruler, 
  Target, 
  Activity, 
  LogOut,
  Edit2,
  Save,
  Settings
} from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { createOrUpdateProfile, saveWeight } from '../../lib/api';

// KetoDiet inspired colors
const COLORS = {
  primary: '#4CAF50',
  secondary: '#81C784',
  accent: '#FF7043',
  background: '#FAFAFA',
  surface: '#FFFFFF',
  text: '#212121',
  textSecondary: '#757575',
  textLight: '#9E9E9E',
  error: '#F44336',
  warning: '#FF9800',
  success: '#4CAF50',
};

export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newWeight, setNewWeight] = useState('');
  
  const [editData, setEditData] = useState({
    name: user?.name || '',
    age: user?.age.toString() || '',
    weight: user?.weight.toString() || '',
    height: user?.height.toString() || '',
    activity_level: user?.activity_level || '',
    goal: user?.goal || '',
  });

  const GENDER_LABELS = {
    homme: 'Homme',
    femme: 'Femme',
  };

  const ACTIVITY_LABELS = {
    sedentaire: 'Sédentaire',
    leger: 'Léger',
    modere: 'Modéré',
    intense: 'Intense',
    extreme: 'Extrême',
  };

  const GOAL_LABELS = {
    perte_poids: 'Perte de poids',
    maintenance: 'Maintenance',
    prise_masse: 'Prise de masse',
  };

  const ACTIVITY_OPTIONS = [
    { key: 'sedentaire', label: 'Sédentaire' },
    { key: 'leger', label: 'Léger' },
    { key: 'modere', label: 'Modéré' },
    { key: 'intense', label: 'Intense' },
    { key: 'extreme', label: 'Extrême' },
  ];

  const GOAL_OPTIONS = [
    { key: 'perte_poids', label: 'Perte de poids', icon: '⬇️' },
    { key: 'maintenance', label: 'Maintenance', icon: '🎯' },
    { key: 'prise_masse', label: 'Prise de masse', icon: '⬆️' },
  ];

  const handleSave = async () => {
    if (!user) return;

    if (!editData.name || !editData.age || !editData.weight || !editData.height) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (isNaN(Number(editData.age)) || isNaN(Number(editData.weight)) || isNaN(Number(editData.height))) {
      Alert.alert('Erreur', 'Veuillez entrer des valeurs numériques valides');
      return;
    }

    setLoading(true);
    try {
      const updatedProfile = {
        ...user,
        ...editData,
        age: Number(editData.age),
        weight: Number(editData.weight),
        height: Number(editData.height),
      };

      await createOrUpdateProfile(updatedProfile);
      await updateUser(updatedProfile);

      setEditing(false);
      Alert.alert('Succès', 'Profil mis à jour');
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour le profil');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWeight = async () => {
    if (!user || !newWeight) {
      Alert.alert('Erreur', 'Veuillez entrer un poids valide');
      return;
    }

    const weight = Number(newWeight);
    if (isNaN(weight) || weight <= 0) {
      Alert.alert('Erreur', 'Veuillez entrer un poids valide');
      return;
    }

    try {
      await saveWeight({
        user_id: user.email,
        weight,
        date: new Date().toISOString().split('T')[0],
      });
      
      await updateUser({ ...user, weight });
      
      setNewWeight('');
      Alert.alert('Succès', 'Poids enregistré');
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du poids:', error);
      Alert.alert('Erreur', 'Impossible d\'enregistrer le poids');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Déconnecter', style: 'destructive', onPress: logout },
      ]
    );
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Erreur de chargement</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.profileSection}>
              <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>
                  {user.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.userName}>{user.name}</Text>
                <Text style={styles.userEmail}>{user.email}</Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => editing ? handleSave() : setEditing(true)}
              disabled={loading}
            >
              <View style={[styles.editIcon, { backgroundColor: editing ? COLORS.success + '20' : COLORS.primary + '20' }]}>
                {editing ? (
                  <Save color={editing ? COLORS.success : COLORS.primary} size={18} />
                ) : (
                  <Edit2 color={COLORS.primary} size={18} />
                )}
              </View>
            </TouchableOpacity>
          </View>

          {/* Personal Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informations personnelles</Text>
            
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <View style={[styles.infoIconContainer, { backgroundColor: COLORS.primary + '20' }]}>
                  <User color={COLORS.primary} size={20} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Nom</Text>
                  {editing ? (
                    <TextInput
                      style={styles.editInput}
                      value={editData.name}
                      onChangeText={(text) => setEditData({ ...editData, name: text })}
                      placeholder="Votre nom"
                    />
                  ) : (
                    <Text style={styles.infoValue}>{user.name}</Text>
                  )}
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={[styles.infoIconContainer, { backgroundColor: COLORS.accent + '20' }]}>
                  <Mail color={COLORS.accent} size={20} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoValue}>{user.email}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={[styles.infoIconContainer, { backgroundColor: COLORS.secondary + '20' }]}>
                  <Calendar color={COLORS.secondary} size={20} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Âge</Text>
                  {editing ? (
                    <TextInput
                      style={styles.editInput}
                      value={editData.age}
                      onChangeText={(text) => setEditData({ ...editData, age: text })}
                      keyboardType="numeric"
                      placeholder="25"
                    />
                  ) : (
                    <Text style={styles.infoValue}>{user.age} ans</Text>
                  )}
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={[styles.infoIconContainer, { backgroundColor: COLORS.primary + '20' }]}>
                  <User color={COLORS.primary} size={20} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Genre</Text>
                  <Text style={styles.infoValue}>{GENDER_LABELS[user.gender as keyof typeof GENDER_LABELS] || user.gender}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Body Metrics */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mesures corporelles</Text>
            
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <View style={[styles.infoIconContainer, { backgroundColor: COLORS.accent + '20' }]}>
                  <Weight color={COLORS.accent} size={20} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Poids actuel</Text>
                  {editing ? (
                    <TextInput
                      style={styles.editInput}
                      value={editData.weight}
                      onChangeText={(text) => setEditData({ ...editData, weight: text })}
                      keyboardType="numeric"
                      placeholder="70"
                    />
                  ) : (
                    <Text style={styles.infoValue}>{user.weight} kg</Text>
                  )}
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={[styles.infoIconContainer, { backgroundColor: COLORS.primary + '20' }]}>
                  <Ruler color={COLORS.primary} size={20} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Taille</Text>
                  {editing ? (
                    <TextInput
                      style={styles.editInput}
                      value={editData.height}
                      onChangeText={(text) => setEditData({ ...editData, height: text })}
                      keyboardType="numeric"
                      placeholder="170"
                    />
                  ) : (
                    <Text style={styles.infoValue}>{user.height} cm</Text>
                  )}
                </View>
              </View>
            </View>
          </View>

          {/* Goals & Activity */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Objectifs</Text>
            
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <View style={[styles.infoIconContainer, { backgroundColor: COLORS.success + '20' }]}>
                  <Target color={COLORS.success} size={20} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Objectif</Text>
                  {editing ? (
                    <View style={styles.optionsGrid}>
                      {GOAL_OPTIONS.map((option) => (
                        <TouchableOpacity
                          key={option.key}
                          style={[
                            styles.optionChip,
                            editData.goal === option.key && styles.selectedOptionChip,
                          ]}
                          onPress={() => setEditData({ ...editData, goal: option.key })}
                        >
                          <Text style={styles.optionEmoji}>{option.icon}</Text>
                          <Text style={[
                            styles.optionText,
                            editData.goal === option.key && styles.selectedOptionText,
                          ]}>
                            {option.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : (
                    <Text style={styles.infoValue}>{GOAL_LABELS[user.goal as keyof typeof GOAL_LABELS] || user.goal}</Text>
                  )}
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={[styles.infoIconContainer, { backgroundColor: COLORS.accent + '20' }]}>
                  <Activity color={COLORS.accent} size={20} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Niveau d'activité</Text>
                  {editing ? (
                    <View style={styles.optionsGrid}>
                      {ACTIVITY_OPTIONS.map((option) => (
                        <TouchableOpacity
                          key={option.key}
                          style={[
                            styles.optionChip,
                            editData.activity_level === option.key && styles.selectedOptionChip,
                          ]}
                          onPress={() => setEditData({ ...editData, activity_level: option.key })}
                        >
                          <Text style={[
                            styles.optionText,
                            editData.activity_level === option.key && styles.selectedOptionText,
                          ]}>
                            {option.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : (
                    <Text style={styles.infoValue}>{ACTIVITY_LABELS[user.activity_level as keyof typeof ACTIVITY_LABELS] || user.activity_level}</Text>
                  )}
                </View>
              </View>
            </View>
          </View>

          {/* Weight Tracker */}
          {!editing && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Nouveau poids</Text>
              
              <View style={styles.weightCard}>
                <View style={styles.weightInputRow}>
                  <TextInput
                    style={styles.weightInput}
                    value={newWeight}
                    onChangeText={setNewWeight}
                    placeholder="Nouveau poids (kg)"
                    keyboardType="numeric"
                  />
                  <TouchableOpacity
                    style={styles.weightButton}
                    onPress={handleSaveWeight}
                    disabled={!newWeight}
                  >
                    <Text style={styles.weightButtonText}>Enregistrer</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* Logout */}
          {!editing && (
            <View style={styles.section}>
              <TouchableOpacity style={styles.logoutCard} onPress={handleLogout}>
                <View style={[styles.infoIconContainer, { backgroundColor: COLORS.error + '20' }]}>
                  <LogOut color={COLORS.error} size={20} />
                </View>
                <Text style={styles.logoutText}>Se déconnecter</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.bottomSpacing} />
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
  scrollContainer: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: COLORS.text,
  },
  header: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 20,
    paddingVertical: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.surface,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
  },
  userEmail: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  editButton: {
    marginLeft: 16,
  },
  editIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
  },
  editInput: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.primary,
    paddingVertical: 4,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  optionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.background,
  },
  selectedOptionChip: {
    backgroundColor: COLORS.primary + '20',
    borderColor: COLORS.primary,
  },
  optionEmoji: {
    fontSize: 12,
    marginRight: 6,
  },
  optionText: {
    fontSize: 12,
    color: COLORS.text,
  },
  selectedOptionText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  weightCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  weightInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weightInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
  },
  weightButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  weightButtonText: {
    color: COLORS.surface,
    fontWeight: '600',
  },
  logoutCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.error,
    marginLeft: 16,
  },
  bottomSpacing: {
    height: 24,
  },
});