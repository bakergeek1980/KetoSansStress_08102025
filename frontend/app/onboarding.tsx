import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  ArrowLeft, 
  ArrowRight,
  CheckCircle,
  Target,
  Activity,
  Calendar,
  User,
  Edit3
} from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import DateInput from '../components/forms/DateInput';
import LoadingButton from '../components/forms/LoadingButton';
import {
  OnboardingData,
  OnboardingStep,
  SEX_OPTIONS,
  GOAL_OPTIONS,
  ACTIVITY_LEVEL_OPTIONS,
  FOOD_RESTRICTION_OPTIONS,
  NutritionTargets,
  PersonalizedPlan,
  ACTIVITY_FACTORS
} from '../types/onboarding';

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

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const STORAGE_KEY = 'onboarding_progress';

export default function OnboardingScreen() {
  const router = useRouter();
  const searchParams = useLocalSearchParams<{ mode?: 'edit' }>();
  const isEditMode = searchParams.mode === 'edit';
  const { user, completeProfile, saveOnboardingProgress } = useAuth();
  
  // États principaux
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(1);
  const [onboardingData, setOnboardingData] = useState<Partial<OnboardingData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Animation
  const slideAnimation = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  // Initialisation avec les données utilisateur
  useEffect(() => {
    if (isEditMode && user) {
      // ✅ Mode édition : pré-remplir avec les données existantes de l'utilisateur
      console.log('🎯 Edit mode: pre-filling with user data:', user);
      setOnboardingData({
        first_name: user.first_name || user.full_name || '',
        sex: user.sex || user.gender || '',
        goal: user.goal || '',
        current_weight: user.current_weight || user.weight || 0,
        target_weight: user.target_weight || 0,
        height: user.height || 0,
        activity_level: user.activity_level || '',
        birth_date: user.birth_date ? new Date(user.birth_date) : new Date(),
        food_restrictions: user.food_restrictions || []
      });
    } else if (user?.first_name) {
      // ✅ Mode première fois : utiliser seulement le first_name si disponible
      setOnboardingData(prev => ({
        ...prev,
        first_name: user.first_name
      }));
    }
    
    // Restaurer les données sauvegardées seulement si pas en mode édition
    if (!isEditMode) {
      restoreProgress();
    }
  }, [user, isEditMode]);

  // Sauvegarde automatique à chaque changement
  useEffect(() => {
    if (Object.keys(onboardingData).length > 0) {
      saveProgress();
    }
  }, [onboardingData]);

  const saveProgress = async () => {
    // ✅ Ne pas sauvegarder la progression en mode édition
    if (isEditMode) return;
    
    try {
      // Sauvegarder localement
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
        step: currentStep,
        data: onboardingData
      }));
      
      // Sauvegarder aussi sur le serveur
      await saveOnboardingProgress(currentStep, onboardingData);
      
    } catch (error) {
      console.error('Erreur sauvegarde progression:', error);
    }
  };

  const restoreProgress = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        const { step, data } = JSON.parse(saved);
        setCurrentStep(step);
        setOnboardingData(data);
      }
    } catch (error) {
      console.error('Erreur restauration progression:', error);
    }
  };

  const clearProgress = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Erreur effacement progression:', error);
    }
  };

  // Navigation entre slides
  const goToNextStep = () => {
    if (validateCurrentStep()) {
      const nextStep = (currentStep + 1) as OnboardingStep;
      setCurrentStep(nextStep);
      animateToStep(nextStep);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      const prevStep = (currentStep - 1) as OnboardingStep;
      setCurrentStep(prevStep);
      animateToStep(prevStep);
    }
  };

  const animateToStep = (step: OnboardingStep) => {
    const offsetX = (step - 1) * SCREEN_WIDTH;
    
    Animated.timing(slideAnimation, {
      toValue: -offsetX,
      duration: 300,
      useNativeDriver: true,
    }).start();

    scrollViewRef.current?.scrollTo({
      x: offsetX,
      animated: true
    });
  };

  // Validation des étapes
  const validateCurrentStep = (): boolean => {
    setErrors({});
    
    switch (currentStep) {
      case 1:
        if (!onboardingData.sex) {
          setErrors({ sex: 'Veuillez sélectionner votre sexe' });
          return false;
        }
        break;
      case 2:
        if (!onboardingData.goal) {
          setErrors({ goal: 'Veuillez sélectionner votre objectif' });
          return false;
        }
        break;
      case 3:
        if (!onboardingData.current_weight || onboardingData.current_weight < 30 || onboardingData.current_weight > 300) {
          setErrors({ current_weight: 'Veuillez saisir un poids valide (30-300 kg)' });
          return false;
        }
        break;
      case 4:
        if (!onboardingData.target_weight) {
          setErrors({ target_weight: 'Veuillez saisir votre poids objectif' });
          return false;
        }
        
        // Validation cohérence avec objectif
        const weightDiff = onboardingData.target_weight - (onboardingData.current_weight || 0);
        if (onboardingData.goal === 'perdre' && weightDiff >= 0) {
          setErrors({ target_weight: 'Le poids objectif doit être inférieur au poids actuel pour perdre du poids' });
          return false;
        }
        if (onboardingData.goal === 'gagner' && weightDiff <= 0) {
          setErrors({ target_weight: 'Le poids objectif doit être supérieur au poids actuel pour gagner du poids' });
          return false;
        }
        break;
      case 5:
        if (!onboardingData.height || onboardingData.height < 100 || onboardingData.height > 250) {
          setErrors({ height: 'Veuillez saisir une taille valide (100-250 cm)' });
          return false;
        }
        if (!onboardingData.activity_level) {
          setErrors({ activity_level: 'Veuillez sélectionner votre niveau d\'activité' });
          return false;
        }
        break;
      case 6:
        if (!onboardingData.birth_date) {
          setErrors({ birth_date: 'Veuillez saisir votre date de naissance' });
          return false;
        }
        break;
      case 7:
        // Restrictions alimentaires optionnelles
        break;
      case 8:
        if (!onboardingData.first_name || onboardingData.first_name.length < 2) {
          setErrors({ first_name: 'Veuillez saisir un prénom valide (minimum 2 caractères)' });
          return false;
        }
        break;
    }
    
    return true;
  };

  // Calculs nutritionnels
  const calculateNutritionTargets = (): NutritionTargets => {
    const { sex, current_weight, height, birth_date, activity_level, goal } = onboardingData;
    
    if (!sex || !current_weight || !height || !birth_date || !activity_level || !goal) {
      return {
        calories: 2000,
        proteins: 100,
        carbs: 25,
        fats: 167,
        bmr: 1600,
        tdee: 2200,
        deficit_surplus: 0
      };
    }

    // Calcul de l'âge
    const age = new Date().getFullYear() - birth_date.getFullYear();
    
    // Calcul BMR (Harris-Benedict révisé)
    let bmr: number;
    if (sex === 'homme') {
      bmr = 88.362 + (13.397 * current_weight) + (4.799 * height) - (5.677 * age);
    } else {
      bmr = 447.593 + (9.247 * current_weight) + (3.098 * height) - (4.330 * age);
    }

    // Calcul TDEE
    const activityFactor = ACTIVITY_FACTORS[activity_level] || 1.55;
    const tdee = bmr * activityFactor;

    // Ajustement selon l'objectif
    let caloriesTarget: number;
    let deficitSurplus: number;
    
    switch (goal) {
      case 'perdre':
        deficitSurplus = -500;
        caloriesTarget = tdee + deficitSurplus;
        break;
      case 'gagner':
        deficitSurplus = 300;
        caloriesTarget = tdee + deficitSurplus;
        break;
      case 'maintenir':
      default:
        deficitSurplus = 0;
        caloriesTarget = tdee;
        break;
    }

    // Répartition keto (75% lipides, 20% protéines, 5% glucides nets)
    const proteins = Math.round((caloriesTarget * 0.20) / 4); // 4 kcal/g
    const fats = Math.round((caloriesTarget * 0.75) / 9);     // 9 kcal/g
    const carbs = Math.round((caloriesTarget * 0.05) / 4);    // 4 kcal/g

    return {
      calories: Math.round(caloriesTarget),
      proteins,
      carbs,
      fats,
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      deficit_surplus: deficitSurplus
    };
  };

  // Finalisation du profil
  const handleCompleteProfile = async () => {
    if (!validateCurrentStep()) return;

    setIsLoading(true);
    
    try {
      const nutritionTargets = calculateNutritionTargets();
      
      const completeData: OnboardingData = {
        sex: onboardingData.sex!,
        goal: onboardingData.goal!,
        current_weight: onboardingData.current_weight!,
        target_weight: onboardingData.target_weight!,
        height: onboardingData.height!,
        activity_level: onboardingData.activity_level!,
        birth_date: onboardingData.birth_date!,
        food_restrictions: onboardingData.food_restrictions || [],
        first_name: onboardingData.first_name!,
      };

      const success = await completeProfile(completeData, nutritionTargets);
      
      if (success) {
        if (!isEditMode) {
          // Mode première fois : effacer progression et aller au dashboard
          await clearProgress();
          Alert.alert(
            '🎉 Profil créé !',
            'Votre plan nutritionnel personnalisé a été créé avec succès.',
            [
              {
                text: 'Commencer',
                onPress: () => router.replace('/(tabs)')
              }
            ]
          );
        } else {
          // Mode édition : retourner aux paramètres avec notification
          Alert.alert(
            '✅ Objectifs mis à jour !',
            'Vos nouveaux objectifs nutritionnels ont été calculés et sauvegardés.',
            [
              {
                text: 'Retour aux paramètres',
                onPress: () => router.back()
              }
            ]
          );
        }
      } else {
        throw new Error(isEditMode ? 'Échec de la mise à jour' : 'Échec de la création du profil');
      }
    } catch (error) {
      console.error('Erreur profil:', error);
      const errorMessage = isEditMode 
        ? 'Impossible de mettre à jour vos objectifs. Veuillez réessayer.'
        : 'Impossible de créer votre profil. Veuillez réessayer.';
      Alert.alert('Erreur', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Composants des slides
  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressBar}>
        <View 
          style={[
            styles.progressFill, 
            { width: `${(currentStep / 9) * 100}%` }
          ]} 
        />
      </View>
      <Text style={styles.progressText}>
        Slide {currentStep}/9
      </Text>
    </View>
  );

  const renderSlide1 = () => (
    <View style={styles.slideContainer}>
      <View style={styles.slideContent}>
        <Text style={styles.avocadoEmoji}>🥑</Text>
        <Text style={styles.slideTitle}>Quel est votre sexe ?</Text>
        
        <View style={styles.optionsContainer}>
          {SEX_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionCard,
                onboardingData.sex === option.id && styles.optionCardSelected
              ]}
              onPress={() => setOnboardingData(prev => ({ ...prev, sex: option.id }))}
            >
              <Text style={styles.optionEmoji}>{option.emoji}</Text>
              <Text style={[
                styles.optionLabel,
                onboardingData.sex === option.id && styles.optionLabelSelected
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {errors.sex && <Text style={styles.errorText}>{errors.sex}</Text>}
      </View>
    </View>
  );

  const renderSlide2 = () => (
    <View style={styles.slideContainer}>
      <View style={styles.slideContent}>
        <Text style={styles.avocadoEmoji}>🎯</Text>
        <Text style={styles.slideTitle}>Quel est votre objectif ?</Text>
        
        <View style={styles.optionsContainer}>
          {GOAL_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.goalCard,
                onboardingData.goal === option.id && styles.optionCardSelected
              ]}
              onPress={() => setOnboardingData(prev => ({ ...prev, goal: option.id }))}
            >
              <Text style={styles.goalEmoji}>{option.emoji}</Text>
              <Text style={[
                styles.goalLabel,
                onboardingData.goal === option.id && styles.optionLabelSelected
              ]}>
                {option.label}
              </Text>
              <Text style={styles.goalDescription}>{option.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {errors.goal && <Text style={styles.errorText}>{errors.goal}</Text>}
      </View>
    </View>
  );

  const renderSlide3 = () => (
    <View style={styles.slideContainer}>
      <View style={styles.slideContent}>
        <Text style={styles.avocadoEmoji}>⚖️</Text>
        <Text style={styles.slideTitle}>Quel est votre poids actuel ?</Text>
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.numberInput}
            value={onboardingData.current_weight?.toString() || ''}
            onChangeText={(text) => {
              const weight = parseFloat(text.replace(',', '.'));
              if (!isNaN(weight)) {
                setOnboardingData(prev => ({ ...prev, current_weight: weight }));
              } else if (text === '') {
                setOnboardingData(prev => ({ ...prev, current_weight: undefined }));
              }
            }}
            placeholder="0.0"
            keyboardType="decimal-pad"
            placeholderTextColor={COLORS.textLight}
          />
          <Text style={styles.unitLabel}>kg</Text>
        </View>
        
        {errors.current_weight && <Text style={styles.errorText}>{errors.current_weight}</Text>}
      </View>
    </View>
  );

  const renderSlide4 = () => {
    const weightDifference = onboardingData.target_weight && onboardingData.current_weight 
      ? onboardingData.target_weight - onboardingData.current_weight 
      : 0;

    return (
      <View style={styles.slideContainer}>
        <View style={styles.slideContent}>
          <Text style={styles.avocadoEmoji}>🎯</Text>
          <Text style={styles.slideTitle}>Quel est votre poids objectif ?</Text>
          
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.numberInput}
              value={onboardingData.target_weight?.toString() || ''}
              onChangeText={(text) => {
                const weight = parseFloat(text.replace(',', '.'));
                if (!isNaN(weight)) {
                  setOnboardingData(prev => ({ ...prev, target_weight: weight }));
                } else if (text === '') {
                  setOnboardingData(prev => ({ ...prev, target_weight: undefined }));
                }
              }}
              placeholder="0.0"
              keyboardType="decimal-pad"
              placeholderTextColor={COLORS.textLight}
            />
            <Text style={styles.unitLabel}>kg</Text>
          </View>
          
          {weightDifference !== 0 && (
            <View style={styles.weightDifferenceContainer}>
              <Text style={[
                styles.weightDifferenceText,
                { color: weightDifference > 0 ? COLORS.success : COLORS.primary }
              ]}>
                {weightDifference > 0 ? '+' : ''}{weightDifference.toFixed(1)} kg {
                  onboardingData.goal === 'perdre' ? 'à perdre' :
                  onboardingData.goal === 'gagner' ? 'à gagner' :
                  'de différence'
                }
              </Text>
            </View>
          )}
          
          {errors.target_weight && <Text style={styles.errorText}>{errors.target_weight}</Text>}
        </View>
      </View>
    );
  };

  const renderSlide5 = () => (
    <View style={styles.slideContainer}>
      <View style={styles.slideContent}>
        <Text style={styles.avocadoEmoji}>📏</Text>
        <Text style={styles.slideTitle}>Combien mesurez-vous ?</Text>
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.numberInput}
            value={onboardingData.height?.toString() || ''}
            onChangeText={(text) => {
              const height = parseInt(text);
              if (!isNaN(height)) {
                setOnboardingData(prev => ({ ...prev, height }));
              } else if (text === '') {
                setOnboardingData(prev => ({ ...prev, height: undefined }));
              }
            }}
            placeholder="175"
            keyboardType="numeric"
            placeholderTextColor={COLORS.textLight}
          />
          <Text style={styles.unitLabel}>cm</Text>
        </View>
        
        {errors.height && <Text style={styles.errorText}>{errors.height}</Text>}
        
        <Text style={styles.subTitle}>Quel est votre niveau d'activité ?</Text>
        
        <View style={styles.activityOptionsContainer}>
          {ACTIVITY_LEVEL_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.activityCard,
                onboardingData.activity_level === option.id && styles.optionCardSelected
              ]}
              onPress={() => setOnboardingData(prev => ({ ...prev, activity_level: option.id }))}
            >
              <View style={styles.activityHeader}>
                <Text style={styles.activityEmoji}>{option.emoji}</Text>
                <Text style={[
                  styles.activityLabel,
                  onboardingData.activity_level === option.id && styles.optionLabelSelected
                ]}>
                  {option.label}
                </Text>
              </View>
              <Text style={styles.activityDescription}>{option.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {errors.activity_level && <Text style={styles.errorText}>{errors.activity_level}</Text>}
      </View>
    </View>
  );

  const renderSlide6 = () => (
    <View style={styles.slideContainer}>
      <View style={styles.slideContent}>
        <Text style={styles.avocadoEmoji}>📅</Text>
        <Text style={styles.slideTitle}>Quelle est votre date de naissance ?</Text>
        
        <DateInput
          label=""
          value={onboardingData.birth_date || null}
          onChange={(date) => {
            setOnboardingData(prev => ({ ...prev, birth_date: date }));
          }}
          maximumDate={new Date()}
          minimumDate={new Date(1900, 0, 1)}
        />
        
        {errors.birth_date && <Text style={styles.errorText}>{errors.birth_date}</Text>}
      </View>
    </View>
  );

  const renderSlide7 = () => (
    <View style={styles.slideContainer}>
      <View style={styles.slideContent}>
        <Text style={styles.avocadoEmoji}>🚫</Text>
        <Text style={styles.slideTitle}>Lequel de ces aliments ne mangez-vous pas ?</Text>
        <Text style={styles.slideSubtitle}>(sélection multiple possible)</Text>
        
        <View style={styles.restrictionsContainer}>
          {FOOD_RESTRICTION_OPTIONS.map((option) => {
            const isSelected = onboardingData.food_restrictions?.includes(option.id) || false;
            
            return (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.restrictionCard,
                  isSelected && styles.restrictionCardSelected
                ]}
                onPress={() => {
                  const current = onboardingData.food_restrictions || [];
                  let updated: string[];
                  
                  if (option.id === 'aucune') {
                    // Si "aucune" est sélectionné, déselectionner tout le reste
                    updated = isSelected ? [] : ['aucune'];
                  } else {
                    // Retirer "aucune" si on sélectionne autre chose
                    const filtered = current.filter(id => id !== 'aucune');
                    updated = isSelected 
                      ? filtered.filter(id => id !== option.id)
                      : [...filtered, option.id];
                  }
                  
                  setOnboardingData(prev => ({ ...prev, food_restrictions: updated }));
                }}
              >
                <Text style={styles.restrictionEmoji}>{option.emoji}</Text>
                <Text style={[
                  styles.restrictionLabel,
                  isSelected && styles.restrictionLabelSelected
                ]}>
                  {option.label}
                </Text>
                {isSelected && (
                  <CheckCircle size={20} color={COLORS.primary} style={styles.checkIcon} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );

  const renderSlide8 = () => (
    <View style={styles.slideContainer}>
      <View style={styles.slideContent}>
        <Text style={styles.avocadoEmoji}>👋</Text>
        <Text style={styles.slideTitle}>Comment vous appelez-vous ?</Text>
        
        <View style={styles.nameInputContainer}>
          <User size={24} color={COLORS.primary} />
          <TextInput
            style={styles.nameInput}
            value={onboardingData.first_name || ''}
            onChangeText={(text) => setOnboardingData(prev => ({ ...prev, first_name: text }))}
            placeholder="Votre prénom"
            placeholderTextColor={COLORS.textLight}
          />
        </View>
        
        {errors.first_name && <Text style={styles.errorText}>{errors.first_name}</Text>}
      </View>
    </View>
  );

  const renderSlide9 = () => {
    const nutritionTargets = calculateNutritionTargets();
    const weightDifference = onboardingData.target_weight && onboardingData.current_weight 
      ? Math.abs(onboardingData.target_weight - onboardingData.current_weight)
      : 0;
    
    // Estimation très simple : 1kg = 7000 kcal, déficit de 500 kcal/jour = 1kg/semaine
    const estimatedDays = Math.round((weightDifference * 7000) / Math.abs(nutritionTargets.deficit_surplus || 500));
    const estimatedWeeks = Math.round(estimatedDays / 7);

    return (
      <View style={styles.slideContainer}>
        <ScrollView style={styles.summaryScrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.slideContent}>
            <Text style={styles.summaryTitle}>
              {onboardingData.first_name}, voici ton plan personnalisé 🎯
            </Text>
            
            {/* Cercle nutritionnel */}
            <View style={styles.nutritionCircleContainer}>
              <View style={styles.nutritionCircle}>
                <Text style={styles.caloriesText}>{nutritionTargets.calories}</Text>
                <Text style={styles.caloriesLabel}>kcal</Text>
              </View>
              
              <View style={styles.macrosLegend}>
                <View style={styles.macroItem}>
                  <View style={[styles.macroColor, { backgroundColor: '#9C27B0' }]} />
                  <Text style={styles.macroText}>Glucides nets: {nutritionTargets.carbs}g (5%)</Text>
                </View>
                <View style={styles.macroItem}>
                  <View style={[styles.macroColor, { backgroundColor: COLORS.primary }]} />
                  <Text style={styles.macroText}>Protéines: {nutritionTargets.proteins}g (20%)</Text>
                </View>
                <View style={styles.macroItem}>
                  <View style={[styles.macroColor, { backgroundColor: COLORS.accent }]} />
                  <Text style={styles.macroText}>Lipides: {nutritionTargets.fats}g (75%)</Text>
                </View>
              </View>
            </View>
            
            {/* Graphique de progression */}
            <View style={styles.progressionContainer}>
              <Text style={styles.progressionTitle}>Progression du poids</Text>
              
              <View style={styles.weightProgressChart}>
                <View style={styles.weightPoint}>
                  <Text style={styles.weightValue}>{onboardingData.current_weight}kg</Text>
                  <Text style={styles.weightLabel}>Actuel</Text>
                </View>
                
                <View style={styles.progressLine} />
                
                <View style={styles.weightPoint}>
                  <Text style={styles.weightValue}>{onboardingData.target_weight}kg</Text>
                  <Text style={styles.weightLabel}>Objectif</Text>
                </View>
              </View>
              
              <Text style={styles.timelineText}>
                Durée estimée: {estimatedWeeks} semaines
              </Text>
            </View>
            
            {/* Message de motivation */}
            <View style={styles.motivationContainer}>
              <Text style={styles.motivationText}>
                {onboardingData.goal === 'perdre' && (
                  `Tu peux perdre ${weightDifference.toFixed(1)} kg en ${estimatedWeeks} semaines !`
                )}
                {onboardingData.goal === 'gagner' && (
                  `Tu peux gagner ${weightDifference.toFixed(1)} kg en ${estimatedWeeks} semaines !`
                )}
                {onboardingData.goal === 'maintenir' && (
                  'Maintiens ton poids idéal avec ce plan équilibré !'
                )}
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  };

  // Navigation buttons
  const renderNavigationButtons = () => {
    if (currentStep === 9) {
      return (
        <View style={styles.finalButtonsContainer}>
          <TouchableOpacity
            style={styles.editObjectivesButton}
            onPress={() => setCurrentStep(1)}
          >
            <Text style={styles.editObjectivesText}>🔙 ÉDITER OBJECTIFS</Text>
          </TouchableOpacity>
          
          <LoadingButton
            title={isEditMode ? "✅ METTRE À JOUR MES OBJECTIFS" : "✅ COMMENCER"}
            onPress={handleCompleteProfile}
            loading={isLoading}
            style={styles.startButton}
            textStyle={styles.startButtonText}
          />
        </View>
      );
    }

    return (
      <View style={styles.navigationContainer}>
        {currentStep > 1 && (
          <TouchableOpacity style={styles.prevButton} onPress={goToPreviousStep}>
            <ArrowLeft size={20} color={COLORS.textSecondary} />
            <Text style={styles.prevButtonText}>Précédent</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity style={styles.nextButton} onPress={goToNextStep}>
          <Text style={styles.nextButtonText}>Suivant</Text>
          <ArrowRight size={20} color={COLORS.surface} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {renderProgressBar()}
        
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEnabled={false}
          style={styles.slidesContainer}
        >
          {renderSlide1()}
          {renderSlide2()}
          {renderSlide3()}
          {renderSlide4()}
          {renderSlide5()}
          {renderSlide6()}
          {renderSlide7()}
          {renderSlide8()}
          {renderSlide9()}
        </ScrollView>
        
        {renderNavigationButtons()}
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
  // Progress bar
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  // Slides
  slidesContainer: {
    flex: 1,
  },
  slideContainer: {
    width: SCREEN_WIDTH,
    flex: 1,
    paddingHorizontal: 20,
  },
  slideContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avocadoEmoji: {
    fontSize: 64,
    marginBottom: 32,
  },
  slideTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 32,
  },
  slideSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  subTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    marginTop: 32,
    marginBottom: 24,
  },
  // Options
  optionsContainer: {
    width: '100%',
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  optionCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  optionEmoji: {
    fontSize: 24,
    marginRight: 16,
  },
  optionLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  optionLabelSelected: {
    color: COLORS.primary,
  },
  // Goals
  goalCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  goalEmoji: {
    fontSize: 32,
    marginBottom: 12,
  },
  goalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  goalDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  // Number inputs
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 16,
    marginBottom: 16,
  },
  numberInput: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    flex: 1,
    paddingHorizontal: 16,
  },
  unitLabel: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  weightDifferenceContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  weightDifferenceText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Activity levels
  activityOptionsContainer: {
    width: '100%',
  },
  activityCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  activityEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  activityLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  activityDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: 32,
  },
  // Restrictions
  restrictionsContainer: {
    width: '100%',
  },
  restrictionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  restrictionCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  restrictionEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  restrictionLabel: {
    fontSize: 16,
    color: COLORS.text,
    flex: 1,
  },
  restrictionLabelSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  checkIcon: {
    marginLeft: 8,
  },
  // Name input
  nameInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 16,
  },
  nameInput: {
    fontSize: 18,
    color: COLORS.text,
    marginLeft: 12,
    flex: 1,
  },
  // Summary (Slide 9)
  summaryScrollView: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 32,
  },
  nutritionCircleContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  nutritionCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: COLORS.surface,
    borderWidth: 8,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  caloriesText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  caloriesLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  macrosLegend: {
    width: '100%',
  },
  macroItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  macroColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  macroText: {
    fontSize: 14,
    color: COLORS.text,
  },
  // Weight progression
  progressionContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  progressionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  weightProgressChart: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  weightPoint: {
    alignItems: 'center',
  },
  weightValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  weightLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  progressLine: {
    flex: 1,
    height: 4,
    backgroundColor: COLORS.primary,
    marginHorizontal: 20,
    borderRadius: 2,
  },
  timelineText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  // Motivation
  motivationContainer: {
    backgroundColor: COLORS.primary + '15',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
  },
  motivationText: {
    fontSize: 16,
    color: COLORS.primary,
    textAlign: 'center',
    fontWeight: '600',
  },
  // Navigation
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  prevButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  prevButtonText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginLeft: 8,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 25,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.surface,
    marginRight: 8,
  },
  // Final buttons
  finalButtonsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 12,
  },
  editObjectivesButton: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  editObjectivesText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  startButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.surface,
  },
  // Errors
  errorText: {
    fontSize: 12,
    color: COLORS.error,
    textAlign: 'center',
    marginTop: 8,
  },
});