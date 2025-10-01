import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Camera, Image as ImageIcon, ArrowLeft, Zap } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { analyzeMeal, saveMeal, MealAnalysis, NutritionalInfo } from '../lib/api';

const COLORS = {
  primary: '#27AE60',
  purple: '#8E44AD',
  white: '#FFFFFF',
  gray: '#F8F9FA',
  dark: '#2C3E50',
  lightGray: '#BDC3C7'
};

const MEAL_TYPES = [
  { key: 'petit_dejeuner', label: 'Petit-déjeuner', icon: '🌅' },
  { key: 'dejeuner', label: 'Déjeuner', icon: '🌞' },
  { key: 'diner', label: 'Dîner', icon: '🌙' },
  { key: 'collation', label: 'Collation', icon: '🍎' },
];

export default function ScannerScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedMealType, setSelectedMealType] = useState<string>('dejeuner');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<NutritionalInfo | null>(null);
  const [saving, setSaving] = useState(false);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission requise',
        'Nous avons besoin de votre permission pour accéder à vos photos.'
      );
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].base64 || null);
        setAnalysisResult(null);
      }
    } catch (error) {
      console.error('Erreur lors de la sélection d\'image:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner l\'image');
    }
  };

  const takePhoto = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      if (cameraPermission.status !== 'granted') {
        Alert.alert(
          'Permission caméra requise',
          'Nous avons besoin de votre permission pour utiliser la caméra.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].base64 || null);
        setAnalysisResult(null);
      }
    } catch (error) {
      console.error('Erreur lors de la prise de photo:', error);
      Alert.alert('Erreur', 'Impossible de prendre une photo');
    }
  };

  const analyzeImage = async () => {
    if (!selectedImage || !user?.email) {
      Alert.alert('Erreur', 'Veuillez sélectionner une image d\'abord');
      return;
    }

    setAnalyzing(true);
    try {
      const analysisRequest: MealAnalysis = {
        image_base64: selectedImage,
        meal_type: selectedMealType,
      };

      const result = await analyzeMeal(analysisRequest);
      setAnalysisResult(result.nutritional_info);
    } catch (error) {
      console.error('Erreur lors de l\'analyse:', error);
      Alert.alert(
        'Erreur d\'analyse',
        'Impossible d\'analyser l\'image. Veuillez réessayer.'
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const saveMealEntry = async () => {
    if (!selectedImage || !analysisResult || !user?.email) {
      Alert.alert('Erreur', 'Données manquantes pour sauvegarder le repas');
      return;
    }

    setSaving(true);
    try {
      const mealEntry = {
        user_id: user.email,
        date: new Date().toISOString().split('T')[0],
        meal_type: selectedMealType,
        image_base64: selectedImage,
        nutritional_info: analysisResult,
        notes: '',
      };

      await saveMeal(mealEntry);
      Alert.alert(
        'Succès !',
        'Votre repas a été sauvegardé avec succès.',
        [
          {
            text: 'OK',
            onPress: () => {
              router.back();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder le repas');
    } finally {
      setSaving(false);
    }
  };

  const getKetoScoreColor = (score: number) => {
    if (score >= 8) return COLORS.primary;
    if (score >= 6) return '#F39C12';
    return '#E74C3C';
  };

  const getKetoScoreText = (score: number) => {
    if (score >= 8) return 'Excellent pour le keto !';
    if (score >= 6) return 'Compatible keto';
    if (score >= 4) return 'Modérément keto';
    return 'Peu compatible keto';
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft color={COLORS.dark} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scanner un repas</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Type de repas */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Type de repas</Text>
        <View style={styles.mealTypesContainer}>
          {MEAL_TYPES.map((mealType) => (
            <TouchableOpacity
              key={mealType.key}
              style={[
                styles.mealTypeButton,
                selectedMealType === mealType.key && styles.selectedMealType,
              ]}
              onPress={() => setSelectedMealType(mealType.key)}
            >
              <Text style={styles.mealTypeIcon}>{mealType.icon}</Text>
              <Text
                style={[
                  styles.mealTypeText,
                  selectedMealType === mealType.key && styles.selectedMealTypeText,
                ]}
              >
                {mealType.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Sélection d'image */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Photo du repas</Text>
        
        {selectedImage ? (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: `data:image/jpeg;base64,${selectedImage}` }}
              style={styles.selectedImage}
            />
            <TouchableOpacity
              style={styles.changeImageButton}
              onPress={pickImage}
            >
              <Text style={styles.changeImageText}>Changer</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.imagePlaceholder}>
            <View style={styles.imageButtons}>
              <TouchableOpacity style={styles.imageButton} onPress={takePhoto}>
                <Camera color={COLORS.white} size={24} />
                <Text style={styles.imageButtonText}>Prendre une photo</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
                <ImageIcon color={COLORS.white} size={24} />
                <Text style={styles.imageButtonText}>Choisir une image</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Bouton d'analyse */}
      {selectedImage && !analysisResult && (
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.analyzeButton, analyzing && styles.disabledButton]}
            onPress={analyzeImage}
            disabled={analyzing}
          >
            <LinearGradient
              colors={analyzing ? ['#BDC3C7', '#95A5A6'] : [COLORS.primary, COLORS.purple]}
              style={styles.analyzeButtonGradient}
            >
              {analyzing ? (
                <ActivityIndicator color={COLORS.white} size="small" />
              ) : (
                <Zap color={COLORS.white} size={20} />
              )}
              <Text style={styles.analyzeButtonText}>
                {analyzing ? 'Analyse en cours...' : 'Analyser avec l\'IA'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* Résultats de l'analyse */}
      {analysisResult && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Résultats de l'analyse</Text>
          <View style={styles.resultsContainer}>
            {/* Score Keto */}
            <View style={styles.ketoScoreContainer}>
              <View style={[styles.ketoScoreBadge, { backgroundColor: getKetoScoreColor(analysisResult.keto_score) }]}>
                <Text style={styles.ketoScoreNumber}>{analysisResult.keto_score}/10</Text>
              </View>
              <Text style={[styles.ketoScoreText, { color: getKetoScoreColor(analysisResult.keto_score) }]}>
                {getKetoScoreText(analysisResult.keto_score)}
              </Text>
            </View>

            {/* Informations nutritionnelles */}
            <View style={styles.nutritionGrid}>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{Math.round(analysisResult.calories)}</Text>
                <Text style={styles.nutritionLabel}>Calories</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{Math.round(analysisResult.net_carbs)}</Text>
                <Text style={styles.nutritionLabel}>Glucides nets (g)</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{Math.round(analysisResult.proteins)}</Text>
                <Text style={styles.nutritionLabel}>Protéines (g)</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{Math.round(analysisResult.fats)}</Text>
                <Text style={styles.nutritionLabel}>Lipides (g)</Text>
              </View>
            </View>

            {/* Aliments détectés */}
            <View style={styles.foodsDetected}>
              <Text style={styles.foodsTitle}>Aliments détectés :</Text>
              <Text style={styles.foodsList}>{analysisResult.foods_detected.join(', ')}</Text>
            </View>

            {/* Bouton de sauvegarde */}
            <TouchableOpacity
              style={[styles.saveButton, saving && styles.disabledButton]}
              onPress={saveMealEntry}
              disabled={saving}
            >
              <LinearGradient
                colors={saving ? ['#BDC3C7', '#95A5A6'] : [COLORS.primary, COLORS.purple]}
                style={styles.saveButtonGradient}
              >
                {saving ? (
                  <ActivityIndicator color={COLORS.white} size="small" />
                ) : null}
                <Text style={styles.saveButtonText}>
                  {saving ? 'Sauvegarde...' : 'Sauvegarder le repas'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  placeholder: {
    width: 40,
  },
  section: {
    marginHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 12,
  },
  mealTypesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  mealTypeButton: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 80,
  },
  selectedMealType: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  mealTypeIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  mealTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.dark,
  },
  selectedMealTypeText: {
    color: COLORS.primary,
  },
  imageContainer: {
    alignItems: 'center',
  },
  selectedImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
  },
  changeImageButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  changeImageText: {
    color: COLORS.white,
    fontWeight: '600',
  },
  imagePlaceholder: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  imageButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  imageButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 120,
  },
  imageButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  analyzeButton: {
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
  analyzeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  analyzeButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  resultsContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  ketoScoreContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  ketoScoreBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  ketoScoreNumber: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  ketoScoreText: {
    fontSize: 16,
    fontWeight: '600',
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  nutritionItem: {
    alignItems: 'center',
    width: '48%',
    marginBottom: 16,
  },
  nutritionValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  nutritionLabel: {
    fontSize: 12,
    color: COLORS.lightGray,
    textAlign: 'center',
  },
  foodsDetected: {
    marginBottom: 20,
  },
  foodsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 8,
  },
  foodsList: {
    fontSize: 14,
    color: COLORS.lightGray,
    lineHeight: 20,
  },
  saveButton: {
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
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});