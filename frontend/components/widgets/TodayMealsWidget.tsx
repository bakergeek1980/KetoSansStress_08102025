import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  Switch,
  Image,
} from 'react-native';
import {
  Plus,
  Settings,
  X,
  Coffee,
  Sun,
  Moon,
  Apple,
  Camera,
  BarChart3,
  Smartphone,
} from 'lucide-react-native';

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

interface Meal {
  id: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  food_name: string;
  calories: number;
  protein: number;
  carbohydrates: number;
  total_fat: number;
  fiber: number;
  keto_score: number;
  consumed_at: string;
  image_base64?: string;
}

interface MealSummary {
  breakfast: Meal[];
  lunch: Meal[];
  dinner: Meal[];
  snack: Meal[];
  totals: {
    calories: number;
    protein: number;
    carbohydrates: number;
    total_fat: number;
    net_carbs: number;
  };
  targets: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
  percentages: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
}

interface TodayMealsWidgetProps {
  userId: string;
  onAddMeal: (mealType: string) => void;
}

export default function TodayMealsWidget({ userId, onAddMeal }: TodayMealsWidgetProps) {
  const [mealsData, setMealsData] = useState<MealSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [healthAppEnabled, setHealthAppEnabled] = useState(false);
  const [mealPanelsEnabled, setMealPanelsEnabled] = useState(true);

  const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8001';

  // Charger les repas d'aujourd'hui
  const loadTodayMeals = async () => {
    try {
      setLoading(true);
      
      // Récupérer le résumé quotidien
      const response = await fetch(`${BACKEND_URL}/api/meals/daily-summary/${userId}`);
      
      if (response.ok) {
        const data = await response.json();
        
        // Récupérer les repas détaillés d'aujourd'hui
        const mealsResponse = await fetch(`${BACKEND_URL}/api/meals/user/${userId}?date=${new Date().toISOString().split('T')[0]}`);
        
        let mealsArray = [];
        if (mealsResponse.ok) {
          const mealsResult = await mealsResponse.json();
          mealsArray = mealsResult.meals || [];
        }

        // Organiser les repas par type
        const organizedMeals: MealSummary = {
          breakfast: mealsArray.filter((meal: Meal) => meal.meal_type === 'breakfast'),
          lunch: mealsArray.filter((meal: Meal) => meal.meal_type === 'lunch'),
          dinner: mealsArray.filter((meal: Meal) => meal.meal_type === 'dinner'),
          snack: mealsArray.filter((meal: Meal) => meal.meal_type === 'snack'),
          totals: data.totals || { calories: 0, protein: 0, carbohydrates: 0, total_fat: 0, net_carbs: 0 },
          targets: data.targets || { calories: 2000, protein: 100, carbs: 25, fats: 150 },
          percentages: data.percentages || { calories: 0, protein: 0, carbs: 0, fats: 0 },
        };

        setMealsData(organizedMeals);
      } else {
        console.error('Erreur lors du chargement des repas');
      }
    } catch (error) {
      console.error('Erreur réseau:', error);
    } finally {
      setLoading(false);
    }
  };

  // Recharger les données toutes les 30 secondes
  useEffect(() => {
    loadTodayMeals();
    
    const interval = setInterval(loadTodayMeals, 30000); // 30 secondes
    
    return () => clearInterval(interval);
  }, [userId]);

  const getMealTypeIcon = (mealType: string) => {
    switch (mealType) {
      case 'breakfast': return <Coffee color={COLORS.primary} size={20} />;
      case 'lunch': return <Sun color={COLORS.warning} size={20} />;
      case 'dinner': return <Moon color={COLORS.accent} size={20} />;
      case 'snack': return <Apple color={COLORS.secondary} size={20} />;
      default: return <Coffee color={COLORS.primary} size={20} />;
    }
  };

  const getMealTypeName = (mealType: string) => {
    switch (mealType) {
      case 'breakfast': return 'Petit-déjeuner';
      case 'lunch': return 'Déjeuner';
      case 'dinner': return 'Dîner';
      case 'snack': return 'Collation';
      default: return 'Repas';
    }
  };

  const getKetoScoreColor = (score: number) => {
    if (score >= 8) return COLORS.success;
    if (score >= 6) return COLORS.warning;
    return COLORS.error;
  };

  const renderMealSection = (mealType: string, meals: Meal[]) => {
    const totalCalories = meals.reduce((sum, meal) => sum + (meal.calories || 0), 0);
    
    return (
      <View key={mealType} style={styles.mealSection}>
        <View style={styles.mealHeader}>
          <View style={styles.mealTitleContainer}>
            {getMealTypeIcon(mealType)}
            <Text style={styles.mealTitle}>{getMealTypeName(mealType)}</Text>
            <Text style={styles.mealCalories}>{totalCalories} cal</Text>
          </View>
          
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => onAddMeal(mealType)}
            activeOpacity={0.7}
          >
            <Plus color={COLORS.surface} size={16} />
          </TouchableOpacity>
        </View>

        {mealPanelsEnabled && (
          <View style={styles.mealsContainer}>
            {meals.length === 0 ? (
              <TouchableOpacity
                style={styles.emptyMeal}
                onPress={() => onAddMeal(mealType)}
                activeOpacity={0.7}
              >
                <Camera color={COLORS.textLight} size={24} />
                <Text style={styles.emptyMealText}>Ajouter un repas</Text>
              </TouchableOpacity>
            ) : (
              meals.map((meal, index) => (
                <View key={`${meal.id}-${index}`} style={styles.mealCard}>
                  {meal.image_base64 && (
                    <Image
                      source={{ uri: `data:image/jpeg;base64,${meal.image_base64}` }}
                      style={styles.mealImage}
                    />
                  )}
                  <View style={styles.mealInfo}>
                    <Text style={styles.mealName} numberOfLines={2}>
                      {meal.food_name}
                    </Text>
                    <Text style={styles.mealMacros}>
                      {meal.calories}cal • P:{meal.protein}g • C:{meal.carbohydrates}g • L:{meal.total_fat}g
                    </Text>
                    <View style={styles.ketoScoreContainer}>
                      <View style={[
                        styles.ketoScoreBadge,
                        { backgroundColor: getKetoScoreColor(meal.keto_score) }
                      ]}>
                        <Text style={styles.ketoScoreText}>{meal.keto_score}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </View>
    );
  };

  const renderSummaryStats = () => {
    if (!mealsData) return null;

    return (
      <View style={styles.summaryStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{mealsData.totals.calories}</Text>
          <Text style={styles.statLabel}>Calories</Text>
          <Text style={styles.statProgress}>{mealsData.percentages.calories}%</Text>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{mealsData.totals.protein}g</Text>
          <Text style={styles.statLabel}>Protéines</Text>
          <Text style={styles.statProgress}>{mealsData.percentages.protein}%</Text>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{mealsData.totals.net_carbs}g</Text>
          <Text style={styles.statLabel}>Glucides nets</Text>
          <Text style={styles.statProgress}>{mealsData.percentages.carbs}%</Text>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{mealsData.totals.total_fat}g</Text>
          <Text style={styles.statLabel}>Lipides</Text>
          <Text style={styles.statProgress}>{mealsData.percentages.fats}%</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.widgetTitle}>Mes Repas d'Aujourd'hui</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* En-tête avec statistiques et paramètres */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.widgetTitle}>Mes Repas d'Aujourd'hui</Text>
          <Text style={styles.dateText}>{new Date().toLocaleDateString('fr-FR')}</Text>
        </View>
        
        <View style={styles.headerRight}>
          {renderSummaryStats()}
          
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => setSettingsVisible(true)}
            activeOpacity={0.7}
          >
            <Settings color={COLORS.textSecondary} size={20} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Sections des repas */}
      <ScrollView style={styles.mealsScrollView} showsVerticalScrollIndicator={false}>
        {mealsData && (
          <>
            {renderMealSection('breakfast', mealsData.breakfast)}
            {renderMealSection('lunch', mealsData.lunch)}
            {renderMealSection('dinner', mealsData.dinner)}
            {renderMealSection('snack', mealsData.snack)}
          </>
        )}
      </ScrollView>

      {/* Modal des paramètres */}
      <Modal
        visible={settingsVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSettingsVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* En-tête du modal */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Options Widget</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setSettingsVisible(false)}
                activeOpacity={0.7}
              >
                <X color={COLORS.textSecondary} size={24} />
              </TouchableOpacity>
            </View>

            {/* Options */}
            <View style={styles.modalContent}>
              {/* Option 1: Export HealthApp */}
              <View style={styles.optionContainer}>
                <View style={styles.optionInfo}>
                  <Smartphone color={COLORS.primary} size={24} />
                  <View style={styles.optionTextContainer}>
                    <Text style={styles.optionTitle}>Exporter vers HealthApp</Text>
                    <Text style={styles.optionDescription}>
                      Synchroniser automatiquement vos données nutritionnelles avec l'app Santé
                    </Text>
                  </View>
                </View>
                <Switch
                  value={healthAppEnabled}
                  onValueChange={setHealthAppEnabled}
                  thumbColor={healthAppEnabled ? COLORS.primary : COLORS.textLight}
                  trackColor={{ false: COLORS.border, true: COLORS.secondary }}
                />
              </View>

              <View style={styles.optionDivider} />

              {/* Option 2: Panneaux par repas */}
              <View style={styles.optionContainer}>
                <View style={styles.optionInfo}>
                  <BarChart3 color={COLORS.primary} size={24} />
                  <View style={styles.optionTextContainer}>
                    <Text style={styles.optionTitle}>Panneaux par repas</Text>
                    <Text style={styles.optionDescription}>
                      Afficher les détails de chaque repas dans des panneaux séparés
                    </Text>
                  </View>
                </View>
                <Switch
                  value={mealPanelsEnabled}
                  onValueChange={setMealPanelsEnabled}
                  thumbColor={mealPanelsEnabled ? COLORS.primary : COLORS.textLight}
                  trackColor={{ false: COLORS.border, true: COLORS.secondary }}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  titleContainer: {
    flex: 1,
  },
  widgetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  statItem: {
    alignItems: 'center',
    minWidth: 45,
  },
  statValue: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  statProgress: {
    fontSize: 9,
    color: COLORS.textLight,
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: COLORS.border,
    marginHorizontal: 8,
  },
  settingsButton: {
    padding: 8,
  },
  mealsScrollView: {
    maxHeight: 400,
  },
  mealSection: {
    marginBottom: 16,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mealTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  mealTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: 8,
    flex: 1,
  },
  mealCalories: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginRight: 8,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mealsContainer: {
    gap: 8,
  },
  emptyMeal: {
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  emptyMealText: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 8,
  },
  mealCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  mealImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  mealMacros: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  ketoScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ketoScoreBadge: {
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  ketoScoreText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.surface,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 150,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
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
    padding: 20,
  },
  optionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  optionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  optionTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  optionDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 8,
  },
});