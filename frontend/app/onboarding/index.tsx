import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, Zap, Target, Heart } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { createOrUpdateProfile } from '../lib/api';

const COLORS = {
  primary: '#27AE60',
  purple: '#8E44AD',
  white: '#FFFFFF',
  gray: '#F8F9FA',
  dark: '#2C3E50',
  lightGray: '#BDC3C7'
};

const ONBOARDING_STEPS = [
  {
    title: 'Bienvenue sur KetoScan !',
    subtitle: 'Votre œil intelligent pour le keto',
    description: 'Analysez vos repas avec l\'IA et suivez vos macros automatiquement',
    icon: '👋',
  },
  {
    title: 'Scanner intelligent',
    subtitle: 'IA de pointe',
    description: 'Prenez une photo de votre repas et obtenez instantanément les informations nutritionnelles',
    icon: '📸',
  },
  {
    title: 'Suivi cétogène',
    subtitle: 'Objectifs personnalisés',
    description: 'Calculez vos macros idéales et maintenez la cétose nutritionnelle',
    icon: '🎯',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    age: '',
    gender: '',
    weight: '',
    height: '',
    activity_level: '',
    goal: '',
  });

  const GENDER_OPTIONS = [
    { key: 'homme', label: 'Homme' },
    { key: 'femme', label: 'Femme' },
  ];

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

  const nextStep = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setShowForm(true);
    }
  };

  const prevStep = () => {
    if (showForm) {
      setShowForm(false);
    } else if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.name || !formData.email || !formData.age || !formData.gender || 
        !formData.weight || !formData.height || !formData.activity_level || !formData.goal) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    if (isNaN(Number(formData.age)) || isNaN(Number(formData.weight)) || isNaN(Number(formData.height))) {
      Alert.alert('Erreur', 'Veuillez entrer des valeurs numériques valides');
      return;
    }

    setLoading(true);
    try {
      // Créer le profil utilisateur
      const profileData = {
        ...formData,
        age: Number(formData.age),
        weight: Number(formData.weight),
        height: Number(formData.height),
      };

      // Sauvegarder le profil dans la base de données
      await createOrUpdateProfile(profileData);

      // Connecter l'utilisateur
      await login(profileData);

      router.replace('/(tabs)');
    } catch (error) {
      console.error('Erreur lors de la création du profil:', error);
      Alert.alert('Erreur', 'Impossible de créer votre profil. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  if (showForm) {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
          style={{ flex: 1 }} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>Créons votre profil</Text>
              <Text style={styles.formSubtitle}>Quelques informations pour personnaliser votre expérience</Text>
            </View>

            {/* Formulaire */}
            <View style={styles.form}>
              {/* Nom */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Prénom</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholder="Votre prénom"
                  placeholderTextColor={COLORS.lightGray}
                />
              </View>

              {/* Email */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  placeholder="votre.email@exemple.com"
                  placeholderTextColor={COLORS.lightGray}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Âge */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Âge</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.age}
                  onChangeText={(text) => setFormData({ ...formData, age: text })}
                  placeholder="25"
                  placeholderTextColor={COLORS.lightGray}
                  keyboardType="numeric"
                />
              </View>

              {/* Genre */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Genre</Text>
                <View style={styles.optionsContainer}>
                  {GENDER_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.key}
                      style={[
                        styles.optionButton,
                        formData.gender === option.key && styles.selectedOption,
                      ]}
                      onPress={() => setFormData({ ...formData, gender: option.key })}
                    >
                      <Text style={[
                        styles.optionText,
                        formData.gender === option.key && styles.selectedOptionText,
                      ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Poids */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Poids (kg)</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.weight}
                  onChangeText={(text) => setFormData({ ...formData, weight: text })}
                  placeholder="70"
                  placeholderTextColor={COLORS.lightGray}
                  keyboardType="numeric"
                />
              </View>

              {/* Taille */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Taille (cm)</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.height}
                  onChangeText={(text) => setFormData({ ...formData, height: text })}
                  placeholder="170"
                  placeholderTextColor={COLORS.lightGray}
                  keyboardType="numeric"
                />
              </View>

              {/* Niveau d'activité */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Niveau d'activité</Text>
                <View style={styles.optionsContainer}>
                  {ACTIVITY_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.key}
                      style={[
                        styles.optionButton,
                        formData.activity_level === option.key && styles.selectedOption,
                      ]}
                      onPress={() => setFormData({ ...formData, activity_level: option.key })}
                    >
                      <Text style={[
                        styles.optionText,
                        formData.activity_level === option.key && styles.selectedOptionText,
                      ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Objectif */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Objectif</Text>
                <View style={styles.goalOptions}>
                  {GOAL_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.key}
                      style={[
                        styles.goalOption,
                        formData.goal === option.key && styles.selectedGoalOption,
                      ]}
                      onPress={() => setFormData({ ...formData, goal: option.key })}
                    >
                      <Text style={styles.goalOptionIcon}>{option.icon}</Text>
                      <Text style={[
                        styles.goalOptionText,
                        formData.goal === option.key && styles.selectedGoalOptionText,
                      ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Boutons */}
            <View style={styles.formButtons}>
              <TouchableOpacity style={styles.backButton} onPress={prevStep}>
                <Text style={styles.backButtonText}>Retour</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.submitButton, loading && styles.disabledButton]}
                onPress={handleSubmit}
                disabled={loading}
              >
                <LinearGradient
                  colors={loading ? ['#BDC3C7', '#95A5A6'] : [COLORS.primary, COLORS.purple]}
                  style={styles.submitButtonGradient}
                >
                  <Text style={styles.submitButtonText}>
                    {loading ? 'Création...' : 'Commencer'}
                  </Text>
                  <ArrowRight color={COLORS.white} size={20} />
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View style={styles.bottomSpacing} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  const step = ONBOARDING_STEPS[currentStep];

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[COLORS.primary, COLORS.purple]}
        style={styles.onboardingContainer}
      >
        {/* Indicateurs de progression */}
        <View style={styles.progressContainer}>
          {ONBOARDING_STEPS.map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                index <= currentStep && styles.progressDotActive,
              ]}
            />
          ))}
        </View>

        {/* Contenu */}
        <View style={styles.contentContainer}>
          <View style={styles.iconContainer}>
            <Text style={styles.stepIcon}>{step.icon}</Text>
          </View>
          
          <Text style={styles.stepTitle}>{step.title}</Text>
          <Text style={styles.stepSubtitle}>{step.subtitle}</Text>
          <Text style={styles.stepDescription}>{step.description}</Text>
        </View>

        {/* Boutons */}
        <View style={styles.buttonsContainer}>
          {currentStep > 0 && (
            <TouchableOpacity style={styles.backButton} onPress={prevStep}>
              <Text style={styles.backButtonText}>Retour</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity style={styles.nextButton} onPress={nextStep}>
            <View style={styles.nextButtonContent}>
              <Text style={styles.nextButtonText}>
                {currentStep === ONBOARDING_STEPS.length - 1 ? 'Commencer' : 'Suivant'}
              </Text>
              <ArrowRight color={COLORS.primary} size={20} />
            </View>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray,
  },
  onboardingContainer: {
    flex: 1,
    padding: 20,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 5,
  },
  progressDotActive: {
    backgroundColor: COLORS.white,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  stepIcon: {
    fontSize: 40,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 10,
  },
  stepSubtitle: {
    fontSize: 16,
    color: COLORS.white,
    opacity: 0.9,
    textAlign: 'center',
    marginBottom: 20,
  },
  stepDescription: {
    fontSize: 16,
    color: COLORS.white,
    opacity: 0.8,
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  backButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButtonText: {
    color: COLORS.white,
    fontSize: 16,
    opacity: 0.8,
  },
  nextButton: {
    backgroundColor: COLORS.white,
    borderRadius: 25,
    paddingHorizontal: 30,
    paddingVertical: 15,
  },
  nextButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nextButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 10,
  },
  // Styles pour le formulaire
  formContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  formHeader: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 20,
    backgroundColor: COLORS.gray,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 16,
    color: COLORS.lightGray,
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.dark,
    backgroundColor: COLORS.white,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  optionButton: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.white,
  },
  selectedOption: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  optionText: {
    fontSize: 14,
    color: COLORS.dark,
  },
  selectedOptionText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  goalOptions: {
    gap: 12,
  },
  goalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    backgroundColor: COLORS.white,
  },
  selectedGoalOption: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  goalOptionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  goalOptionText: {
    fontSize: 16,
    color: COLORS.dark,
  },
  selectedGoalOptionText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  submitButton: {
    flex: 1,
    marginLeft: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  bottomSpacing: {
    height: 30,
  },
});