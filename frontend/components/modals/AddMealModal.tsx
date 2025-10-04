import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  X,
  Search,
  Plus,
  Minus,
  Check,
  Image as ImageIcon,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ExpoCamera from 'expo-camera';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import ValidatedInput from '../forms/ValidatedInput';
import LoadingButton from '../forms/LoadingButton';
import { mealSchema } from '../../validation/schemas';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../hooks/useAuth';

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
  border: '#E0E0E0',
};

interface AddMealModalProps {
  visible: boolean;
  mealType: string;
  onClose: () => void;
  onMealAdded: () => void;
}

interface NutritionalInfo {
  calories: number;
  protein: number;
  carbohydrates: number;
  total_fat: number;
  fiber: number;
  keto_score: number;
  foods_detected: string[];
  portions: string[];
  confidence: number;
}

interface MealFormData {
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  food_name: string;
  brand?: string;
  serving_size?: string;
  quantity: number;
  unit: string;
  calories?: number;
  protein?: number;
  carbohydrates?: number;
  total_fat?: number;
  saturated_fat?: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  notes?: string;
  preparation_method?: string;
}

export default function AddMealModal({ visible, mealType, onClose, onMealAdded }: AddMealModalProps) {
  const { user } = useAuth();
  const { saveMeal, analyzeFoodImage, loading: apiLoading, error } = useApi();
  
  const [currentStep, setCurrentStep] = useState<'method' | 'camera' | 'manual' | 'analysis' | 'confirm'>('method');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [nutritionalInfo, setNutritionalInfo] = useState<NutritionalInfo | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  
  // React Hook Form setup
  const { control, handleSubmit, reset, setValue, watch, formState: { errors, isValid } } = useForm<MealFormData>({
    resolver: yupResolver(mealSchema),
    defaultValues: {
      meal_type: mealType as 'breakfast' | 'lunch' | 'dinner' | 'snack',
      food_name: '',
      brand: '',
      serving_size: '',
      quantity: 1,
      unit: 'portion',
      calories: 0,
      protein: 0,
      carbohydrates: 0,
      total_fat: 0,
      saturated_fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0,
      notes: '',
      preparation_method: '',
    },
    mode: 'onChange',
  });

  const watchedValues = watch();

  const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8001';

  const getMealTypeName = (type: string) => {
    switch (type) {
      case 'breakfast': return 'Petit-déjeuner';
      case 'lunch': return 'Déjeuner';
      case 'dinner': return 'Dîner';
      case 'snack': return 'Collation';
      default: return 'Repas';
    }
  };

  const resetModal = () => {
    setCurrentStep('method');
    setSelectedImage(null);
    setNutritionalInfo(null);
    setLoading(false);
    setManualEntry({
      food_name: '',
      quantity: 1,
      unit: 'portion',
      calories: 0,
      protein: 0,
      carbohydrates: 0,
      total_fat: 0,
      fiber: 0,
    });
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const requestCameraPermissions = async () => {
    const { status } = await ExpoCamera.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', 'L\'accès à la caméra est nécessaire pour scanner vos repas.');
      return false;
    }
    return true;
  };

  const takePicture = async () => {
    const hasPermission = await requestCameraPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        const base64 = result.assets[0].base64;
        
        setSelectedImage(imageUri);
        if (base64) {
          await analyzeImage(base64);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la prise de photo:', error);
      Alert.alert('Erreur', 'Impossible de prendre la photo.');
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        const base64 = result.assets[0].base64;
        
        setSelectedImage(imageUri);
        if (base64) {
          await analyzeImage(base64);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la sélection d\'image:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner l\'image.');
    }
  };

  const analyzeImage = async (base64Image: string) => {
    setLoading(true);
    setCurrentStep('analysis');

    try {
      const response = await fetch(`${BACKEND_URL}/api/meals/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_base64: base64Image,
          meal_type: mealType,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setNutritionalInfo(data.nutritional_info);
        setCurrentStep('confirm');
      } else {
        throw new Error('Erreur lors de l\'analyse');
      }
    } catch (error) {
      console.error('Erreur d\'analyse:', error);
      Alert.alert('Erreur', 'Impossible d\'analyser l\'image. Veuillez réessayer.');
      setCurrentStep('method');
    } finally {
      setLoading(false);
    }
  };

  const saveMeal = async () => {
    setLoading(true);

    try {
      let mealData;
      
      if (nutritionalInfo) {
        // Repas analysé par IA
        mealData = {
          user_id: userId,
          meal_type: mealType,
          food_name: nutritionalInfo.foods_detected.join(', '),
          quantity: 1,
          unit: 'portion',
          calories: nutritionalInfo.calories,
          protein: nutritionalInfo.protein,
          carbohydrates: nutritionalInfo.carbohydrates,
          total_fat: nutritionalInfo.total_fat,
          fiber: nutritionalInfo.fiber,
          keto_score: nutritionalInfo.keto_score,
          image_base64: selectedImage ? selectedImage.split(',')[1] : null,
        };
      } else {
        // Saisie manuelle
        mealData = {
          user_id: userId,
          meal_type: mealType,
          ...manualEntry,
          keto_score: calculateKetoScore(manualEntry),
        };
      }

      const response = await fetch(`${BACKEND_URL}/api/meals/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mealData),
      });

      if (response.ok) {
        Alert.alert('Succès', 'Repas ajouté avec succès!');
        onMealAdded();
        handleClose();
      } else {
        throw new Error('Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Erreur de sauvegarde:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder le repas.');
    } finally {
      setLoading(false);
    }
  };

  const calculateKetoScore = (meal: typeof manualEntry): number => {
    const netCarbs = meal.carbohydrates - meal.fiber;
    const totalCalories = meal.calories;
    
    if (totalCalories === 0) return 5;
    
    const carbsPercentage = (netCarbs * 4 / totalCalories) * 100;
    const fatPercentage = (meal.total_fat * 9 / totalCalories) * 100;
    
    if (carbsPercentage <= 5 && fatPercentage >= 70) return 10;
    if (carbsPercentage <= 10 && fatPercentage >= 60) return 8;
    if (carbsPercentage <= 15 && fatPercentage >= 50) return 6;
    if (carbsPercentage <= 20) return 4;
    return 2;
  };

  const renderMethodSelection = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Comment voulez-vous ajouter ce {getMealTypeName(mealType).toLowerCase()} ?</Text>
      
      <TouchableOpacity
        style={styles.methodButton}
        onPress={takePicture}
        activeOpacity={0.7}
      >
        <ImageIcon color={COLORS.primary} size={24} />
        <View style={styles.methodTextContainer}>
          <Text style={styles.methodTitle}>Prendre une photo</Text>
          <Text style={styles.methodDescription}>Analyse automatique avec IA</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.methodButton}
        onPress={pickImage}
        activeOpacity={0.7}
      >
        <ImageIcon color={COLORS.primary} size={24} />
        <View style={styles.methodTextContainer}>
          <Text style={styles.methodTitle}>Choisir une image</Text>
          <Text style={styles.methodDescription}>Sélectionner depuis la galerie</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.methodButton}
        onPress={() => setCurrentStep('manual')}
        activeOpacity={0.7}
      >
        <Search color={COLORS.primary} size={24} />
        <View style={styles.methodTextContainer}>
          <Text style={styles.methodTitle}>Saisie manuelle</Text>
          <Text style={styles.methodDescription}>Rechercher ou saisir les informations</Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderAnalysis = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Analyse en cours...</Text>
      <View style={styles.analysisContainer}>
        {selectedImage && (
          <Image source={{ uri: selectedImage }} style={styles.analysisImage} />
        )}
        <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
        <Text style={styles.analysisText}>
          L'IA analyse votre repas et calcule les informations nutritionnelles...
        </Text>
      </View>
    </View>
  );

  const renderManualEntry = () => (
    <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Saisie manuelle</Text>
      
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Nom de l'aliment *</Text>
        <TextInput
          style={styles.formInput}
          value={manualEntry.food_name}
          onChangeText={(text) => setManualEntry(prev => ({ ...prev, food_name: text }))}
          placeholder="Ex: Salade de saumon"
          placeholderTextColor={COLORS.textLight}
        />
      </View>

      <View style={styles.formRow}>
        <View style={[styles.formGroup, { flex: 2 }]}>
          <Text style={styles.formLabel}>Quantité</Text>
          <View style={styles.quantityContainer}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => setManualEntry(prev => ({ 
                ...prev, 
                quantity: Math.max(0.1, prev.quantity - 0.1) 
              }))}
            >
              <Minus color={COLORS.primary} size={16} />
            </TouchableOpacity>
            <Text style={styles.quantityText}>{manualEntry.quantity.toFixed(1)}</Text>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => setManualEntry(prev => ({ 
                ...prev, 
                quantity: prev.quantity + 0.1 
              }))}
            >
              <Plus color={COLORS.primary} size={16} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.formGroup, { flex: 1 }]}>
          <Text style={styles.formLabel}>Unité</Text>
          <TextInput
            style={styles.formInput}
            value={manualEntry.unit}
            onChangeText={(text) => setManualEntry(prev => ({ ...prev, unit: text }))}
            placeholder="portion"
            placeholderTextColor={COLORS.textLight}
          />
        </View>
      </View>

      <Text style={styles.sectionTitle}>Informations nutritionnelles (pour 1 {manualEntry.unit})</Text>

      <View style={styles.formRow}>
        <View style={[styles.formGroup, { flex: 1 }]}>
          <Text style={styles.formLabel}>Calories</Text>
          <TextInput
            style={styles.formInput}
            value={manualEntry.calories.toString()}
            onChangeText={(text) => setManualEntry(prev => ({ 
              ...prev, 
              calories: parseInt(text) || 0 
            }))}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={COLORS.textLight}
          />
        </View>

        <View style={[styles.formGroup, { flex: 1 }]}>
          <Text style={styles.formLabel}>Protéines (g)</Text>
          <TextInput
            style={styles.formInput}
            value={manualEntry.protein.toString()}
            onChangeText={(text) => setManualEntry(prev => ({ 
              ...prev, 
              protein: parseFloat(text) || 0 
            }))}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={COLORS.textLight}
          />
        </View>
      </View>

      <View style={styles.formRow}>
        <View style={[styles.formGroup, { flex: 1 }]}>
          <Text style={styles.formLabel}>Glucides (g)</Text>
          <TextInput
            style={styles.formInput}
            value={manualEntry.carbohydrates.toString()}
            onChangeText={(text) => setManualEntry(prev => ({ 
              ...prev, 
              carbohydrates: parseFloat(text) || 0 
            }))}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={COLORS.textLight}
          />
        </View>

        <View style={[styles.formGroup, { flex: 1 }]}>
          <Text style={styles.formLabel}>Lipides (g)</Text>
          <TextInput
            style={styles.formInput}
            value={manualEntry.total_fat.toString()}
            onChangeText={(text) => setManualEntry(prev => ({ 
              ...prev, 
              total_fat: parseFloat(text) || 0 
            }))}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={COLORS.textLight}
          />
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Fibres (g)</Text>
        <TextInput
          style={styles.formInput}
          value={manualEntry.fiber.toString()}
          onChangeText={(text) => setManualEntry(prev => ({ 
            ...prev, 
            fiber: parseFloat(text) || 0 
          }))}
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor={COLORS.textLight}
        />
      </View>

      <View style={styles.ketoPreview}>
        <Text style={styles.ketoPreviewLabel}>Score Keto estimé:</Text>
        <View style={[
          styles.ketoScoreBadge,
          { backgroundColor: calculateKetoScore(manualEntry) >= 8 ? COLORS.success : 
                            calculateKetoScore(manualEntry) >= 6 ? COLORS.warning : COLORS.error }
        ]}>
          <Text style={styles.ketoScoreText}>{calculateKetoScore(manualEntry)}/10</Text>
        </View>
      </View>
    </ScrollView>
  );

  const renderConfirmation = () => (
    <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Confirmer le repas</Text>
      
      {selectedImage && (
        <Image source={{ uri: selectedImage }} style={styles.confirmImage} />
      )}

      {nutritionalInfo && (
        <View style={styles.nutritionCard}>
          <Text style={styles.nutritionTitle}>
            {nutritionalInfo.foods_detected.join(', ')}
          </Text>
          
          <View style={styles.nutritionGrid}>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{nutritionalInfo.calories}</Text>
              <Text style={styles.nutritionLabel}>Calories</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{nutritionalInfo.protein}g</Text>
              <Text style={styles.nutritionLabel}>Protéines</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>
                {(nutritionalInfo.carbohydrates - nutritionalInfo.fiber).toFixed(1)}g
              </Text>
              <Text style={styles.nutritionLabel}>Glucides nets</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{nutritionalInfo.total_fat}g</Text>
              <Text style={styles.nutritionLabel}>Lipides</Text>
            </View>
          </View>

          <View style={styles.ketoScoreContainer}>
            <Text style={styles.ketoScoreLabel}>Score Keto:</Text>
            <View style={[
              styles.ketoScoreBadge,
              { backgroundColor: nutritionalInfo.keto_score >= 8 ? COLORS.success : 
                               nutritionalInfo.keto_score >= 6 ? COLORS.warning : COLORS.error }
            ]}>
              <Text style={styles.ketoScoreText}>{nutritionalInfo.keto_score}/10</Text>
            </View>
          </View>

          <Text style={styles.confidenceText}>
            Confiance: {Math.round(nutritionalInfo.confidence * 100)}%
          </Text>
        </View>
      )}
    </ScrollView>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.modalContainer}>
        {/* En-tête */}
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>
            Ajouter - {getMealTypeName(mealType)}
          </Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            activeOpacity={0.7}
          >
            <X color={COLORS.textSecondary} size={24} />
          </TouchableOpacity>
        </View>

        {/* Contenu */}
        <View style={styles.modalContent}>
          {currentStep === 'method' && renderMethodSelection()}
          {currentStep === 'analysis' && renderAnalysis()}
          {currentStep === 'manual' && renderManualEntry()}
          {currentStep === 'confirm' && renderConfirmation()}
        </View>

        {/* Actions */}
        <View style={styles.modalActions}>
          {currentStep === 'manual' && (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryButton]}
                onPress={() => setCurrentStep('method')}
                activeOpacity={0.7}
              >
                <Text style={styles.secondaryButtonText}>Retour</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.primaryButton]}
                onPress={saveMeal}
                disabled={!manualEntry.food_name || loading}
                activeOpacity={0.7}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.surface} size="small" />
                ) : (
                  <Text style={styles.primaryButtonText}>Ajouter</Text>
                )}
              </TouchableOpacity>
            </>
          )}
          
          {currentStep === 'confirm' && (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryButton]}
                onPress={() => setCurrentStep('method')}
                activeOpacity={0.7}
              >
                <Text style={styles.secondaryButtonText}>Reprendre</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.primaryButton]}
                onPress={saveMeal}
                disabled={loading}
                activeOpacity={0.7}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.surface} size="small" />
                ) : (
                  <>
                    <Check color={COLORS.surface} size={16} />
                    <Text style={styles.primaryButtonText}>Confirmer</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  stepContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  methodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  methodTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  methodTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  methodDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  analysisContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  analysisImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
    marginBottom: 20,
  },
  loader: {
    marginBottom: 20,
  },
  analysisText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: COLORS.text,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 4,
  },
  quantityButton: {
    padding: 8,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    minWidth: 50,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 24,
    marginBottom: 16,
  },
  ketoPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  ketoPreviewLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  confirmImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 20,
  },
  nutritionCard: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 16,
  },
  nutritionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  nutritionItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 12,
  },
  nutritionValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
  },
  nutritionLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  ketoScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  ketoScoreLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginRight: 8,
  },
  ketoScoreBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  ketoScoreText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.surface,
  },
  confidenceText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  secondaryButton: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.surface,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
});