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
import { LinearGradient } from 'expo-linear-gradient';
import { 
  User, 
  Mail, 
  Calendar, 
  Weight, 
  Ruler, 
  Target, 
  Activity, 
  LogOut,
  Edit,
  Save
} from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { createOrUpdateProfile, saveWeight } from '../../lib/api';

const COLORS = {
  primary: '#27AE60',
  purple: '#8E44AD',
  white: '#FFFFFF',
  gray: '#F8F9FA',
  dark: '#2C3E50',
  lightGray: '#BDC3C7'
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

    // Validation
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

      // Mettre à jour le profil
      await createOrUpdateProfile(updatedProfile);
      await updateUser(updatedProfile);

      setEditing(false);
      Alert.alert('Succès', 'Profil mis à jour avec succès');
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
      
      // Mettre à jour le poids dans le profil
      await updateUser({ ...user, weight });
      
      setNewWeight('');
      Alert.alert('Succès', 'Poids enregistré avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du poids:', error);
      Alert.alert('Erreur', 'Impossible d\'enregistrer le poids');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
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
          <Text style={styles.errorText}>Erreur de chargement du profil</Text>
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
          <LinearGradient
            colors={[COLORS.primary, COLORS.purple]}
            style={styles.header}
          >
            <View style={styles.headerContent}>
              <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>
                  {user.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => editing ? handleSave() : setEditing(true)}
              disabled={loading}
            >
              <View style={styles.editButtonContent}>
                {editing ? (
                  <Save color={COLORS.primary} size={18} />
                ) : (
                  <Edit color={COLORS.primary} size={18} />
                )}
                <Text style={styles.editButtonText}>
                  {editing ? (loading ? 'Sauvegarde...' : 'Sauvegarder') : 'Modifier'}
                </Text>
              </View>
            </TouchableOpacity>
          </LinearGradient>

          {/* Informations personnelles */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informations personnelles</Text>
            
            <View style={styles.infoContainer}>
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
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
                <View style={styles.infoIcon}>
                  <Mail color={COLORS.primary} size={20} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoValue}>{user.email}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Calendar color={COLORS.primary} size={20} />
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
                <View style={styles.infoIcon}>
                  <User color={COLORS.primary} size={20} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Genre</Text>
                  <Text style={styles.infoValue}>{GENDER_LABELS[user.gender as keyof typeof GENDER_LABELS] || user.gender}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Mesures corporelles */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mesures corporelles</Text>
            
            <View style={styles.infoContainer}>
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Weight color={COLORS.purple} size={20} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Poids</Text>
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
                <View style={styles.infoIcon}>
                  <Ruler color={COLORS.purple} size={20} />
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

          {/* Objectifs et activité */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Objectifs et activité</Text>
            
            <View style={styles.infoContainer}>
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Target color={COLORS.primary} size={20} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Objectif</Text>
                  {editing ? (
                    <View style={styles.optionsContainer}>
                      {GOAL_OPTIONS.map((option) => (
                        <TouchableOpacity
                          key={option.key}
                          style={[
                            styles.optionButton,
                            editData.goal === option.key && styles.selectedOption,
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
                <View style={styles.infoIcon}>
                  <Activity color={COLORS.primary} size={20} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Niveau d'activité</Text>
                  {editing ? (
                    <View style={styles.optionsContainer}>
                      {ACTIVITY_OPTIONS.map((option) => (
                        <TouchableOpacity
                          key={option.key}
                          style={[
                            styles.optionButton,
                            editData.activity_level === option.key && styles.selectedOption,
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

          {/* Nouveau poids */}
          {!editing && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Enregistrer nouveau poids</Text>
              
              <View style={styles.weightInputContainer}>
                <TextInput
                  style={styles.weightInput}
                  value={newWeight}
                  onChangeText={setNewWeight}
                  placeholder="Nouveau poids en kg"
                  keyboardType="numeric"
                />
                <TouchableOpacity
                  style={styles.weightSaveButton}
                  onPress={handleSaveWeight}
                  disabled={!newWeight}
                >
                  <Text style={styles.weightSaveButtonText}>Enregistrer</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Bouton de déconnexion */}
          {!editing && (
            <View style={styles.section}>
              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <LogOut color={COLORS.white} size={20} />
                <Text style={styles.logoutButtonText}>Se déconnecter</Text>
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
    backgroundColor: COLORS.gray,
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
    color: COLORS.dark,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    alignItems: 'center',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: COLORS.white,
    opacity: 0.9,
  },
  editButton: {
    marginTop: 20,
    alignSelf: 'center',
  },
  editButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  editButtonText: {
    color: COLORS.primary,
    fontWeight: '600',
    marginLeft: 8,
  },
  section: {
    marginHorizontal: 20,
    marginTop: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 16,
  },
  infoContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
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
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoIcon: {
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: COLORS.lightGray,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
  },
  editInput: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.primary,
    paddingVertical: 4,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedOption: {
    backgroundColor: COLORS.primary + '20',
    borderColor: COLORS.primary,
  },
  optionEmoji: {
    fontSize: 14,
    marginRight: 6,
  },
  optionText: {
    fontSize: 12,
    color: COLORS.dark,
  },
  selectedOptionText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  weightInputContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 12,
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
  weightInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.dark,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 12,
  },
  weightSaveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    justifyContent: 'center',
  },
  weightSaveButtonText: {
    color: COLORS.white,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E74C3C',
    borderRadius: 12,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  logoutButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  bottomSpacing: {
    height: 30,
  },
});