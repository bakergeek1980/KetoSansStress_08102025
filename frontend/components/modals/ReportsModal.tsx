import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {
  X,
  TrendingUp,
  Calendar,
  BarChart3,
  PieChart,
} from 'lucide-react-native';
import { VictoryChart, VictoryArea, VictoryPie, VictoryAxis, VictoryTheme } from 'victory-native';
import { useAuth } from '../../hooks/useAuth';
import { useApi } from '../../hooks/useApi';
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
};

interface ReportsModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
}

interface NutrientData {
  calories: { total: number; target: number; percentage: number };
  net_carbs: { total: number; target: number; percentage: number };
  proteins: { total: number; target: number; percentage: number };
  lipids: { total: number; target: number; percentage: number };
  fiber: { total: number; target: number; percentage: number };
}

interface MealBreakdown {
  breakfast: { calories: number; percentage: number };
  lunch: { calories: number; percentage: number };
  dinner: { calories: number; percentage: number };
  snack: { calories: number; percentage: number };
}

export default function ReportsModal({ visible, onClose, userId }: ReportsModalProps) {
  const [selectedNutrient, setSelectedNutrient] = useState<'calories' | 'net_carbs' | 'proteins' | 'lipids' | 'fiber'>('calories');
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | '3months' | 'year'>('today');
  const [loading, setLoading] = useState(false);
  const [nutritionData, setNutritionData] = useState<NutrientData | null>(null);
  const [mealBreakdown, setMealBreakdown] = useState<MealBreakdown | null>(null);

  const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8001';

  // Charger les données de rapport
  const loadReportData = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`${BACKEND_URL}/api/meals/daily-summary/${userId}`);
      
      if (response.ok) {
        const data = await response.json();
        
        // Simuler les données nutritionnelles basées sur les vraies données
        const mockNutritionData: NutrientData = {
          calories: { 
            total: data.totals?.calories || 0, 
            target: data.targets?.calories || 1843, 
            percentage: data.percentages?.calories || 0 
          },
          net_carbs: { 
            total: data.totals?.net_carbs || 0, 
            target: data.targets?.carbs || 23, 
            percentage: data.percentages?.carbs || 0 
          },
          proteins: { 
            total: data.totals?.protein || 0, 
            target: data.targets?.protein || 92, 
            percentage: data.percentages?.protein || 0 
          },
          lipids: { 
            total: data.totals?.total_fat || 0, 
            target: data.targets?.fats || 154, 
            percentage: data.percentages?.fats || 0 
          },
          fiber: { 
            total: data.totals?.fiber || 0, 
            target: 25, 
            percentage: 0 
          },
        };

        // Simuler la répartition par repas
        const mockMealBreakdown: MealBreakdown = {
          breakfast: { calories: 0, percentage: 0 },
          lunch: { calories: 0, percentage: 0 },
          dinner: { calories: 0, percentage: 0 },
          snack: { calories: 0, percentage: 0 },
        };

        setNutritionData(mockNutritionData);
        setMealBreakdown(mockMealBreakdown);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des rapports:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      loadReportData();
    }
  }, [visible, selectedPeriod]);

  const getNutrientDisplayName = (nutrient: string) => {
    switch (nutrient) {
      case 'calories': return 'Calories';
      case 'net_carbs': return 'Gluc. nets';
      case 'proteins': return 'Protéines';
      case 'lipids': return 'Lipides';
      case 'fiber': return 'Fibres';
      default: return nutrient;
    }
  };

  const getNutrientUnit = (nutrient: string) => {
    return nutrient === 'calories' ? 'kcal' : 'g';
  };

  const getMealDisplayName = (meal: string) => {
    switch (meal) {
      case 'breakfast': return 'Petit déjeuner';
      case 'lunch': return 'Déjeuner';
      case 'dinner': return 'Dîner';
      case 'snack': return 'En-cas';
      default: return meal;
    }
  };

  const getCurrentData = () => {
    if (!nutritionData) return { total: 0, target: 0, percentage: 0 };
    return nutritionData[selectedNutrient];
  };

  const renderNutrientTabs = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false} 
      style={styles.tabsContainer}
      contentContainerStyle={styles.tabsContent}
    >
      {(['calories', 'net_carbs', 'proteins', 'lipids', 'fiber'] as const).map((nutrient) => (
        <TouchableOpacity
          key={nutrient}
          style={[
            styles.nutrientTab,
            selectedNutrient === nutrient && styles.selectedNutrientTab
          ]}
          onPress={() => setSelectedNutrient(nutrient)}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.nutrientTabText,
            selectedNutrient === nutrient && styles.selectedNutrientTabText
          ]}>
            {getNutrientDisplayName(nutrient)}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderCircularProgress = () => {
    const currentData = getCurrentData();
    const progressPercentage = Math.min(100, (currentData.total / currentData.target) * 100);

    return (
      <View style={styles.circularProgressContainer}>
        <View style={styles.circularProgress}>
          {/* Cercle de fond */}
          <View style={styles.progressBackground} />
          
          {/* Cercle de progression (simulé avec une bordure) */}
          <View 
            style={[
              styles.progressForeground,
              { 
                borderColor: progressPercentage > 0 ? COLORS.primary : COLORS.border,
                transform: [{ rotate: `${progressPercentage * 3.6}deg` }] 
              }
            ]} 
          />
          
          {/* Texte central */}
          <View style={styles.progressTextContainer}>
            <Text style={styles.progressValue}>
              {currentData.total}
            </Text>
            <Text style={styles.progressUnit}>
              {getNutrientUnit(selectedNutrient)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderMealBreakdown = () => {
    if (!mealBreakdown) return null;

    return (
      <View style={styles.mealBreakdownContainer}>
        <View style={styles.mealBreakdownHeader}>
          <Text style={styles.mealBreakdownTitle}>Total %</Text>
          <Text style={styles.mealBreakdownTitle}>Total</Text>
        </View>

        {Object.entries(mealBreakdown).map(([mealType, data]) => (
          <View key={mealType} style={styles.mealRow}>
            <View style={styles.mealIndicator} />
            <Text style={styles.mealName}>{getMealDisplayName(mealType)}</Text>
            <Text style={styles.mealPercentage}>{data.percentage.toFixed(0)}%</Text>
            <Text style={styles.mealCalories}>{data.calories} kcal</Text>
          </View>
        ))}

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>
            {getCurrentData().total} {getNutrientUnit(selectedNutrient)}
          </Text>
        </View>
      </View>
    );
  };

  const renderPeriodSelector = () => (
    <View style={styles.periodContainer}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.periodScrollContent}
      >
        {[
          { key: 'today', label: 'Aujourd\'hui' },
          { key: 'week', label: 'Semaine' },
          { key: 'month', label: 'Mois' },
          { key: '3months', label: '3 Mois' },
          { key: 'year', label: 'Année' }
        ].map((period) => (
          <TouchableOpacity
            key={period.key}
            style={[
              styles.periodTab,
              selectedPeriod === period.key && styles.selectedPeriodTab
            ]}
            onPress={() => setSelectedPeriod(period.key as any)}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.periodTabText,
              selectedPeriod === period.key && styles.selectedPeriodTabText
            ]}>
              {period.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const getDateTitle = () => {
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    
    switch (selectedPeriod) {
      case 'today':
        return `Aujourd'hui, ${today.getDate()} ${today.toLocaleDateString('fr-FR', { month: 'long' })}`;
      case 'week':
        return 'Cette semaine';
      case 'month':
        return `${today.toLocaleDateString('fr-FR', { month: 'long' })} ${today.getFullYear()}`;
      case '3months':
        return '3 derniers mois';
      case 'year':
        return `Année ${today.getFullYear()}`;
      default:
        return 'Rapport';
    }
  };

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
            <Text style={styles.modalTitle}>
              {selectedPeriod === 'today' ? 'Apport par repas' : 'Rapports nutritionnels'}
            </Text>
            <Text style={styles.dateSubtitle}>{getDateTitle()}</Text>
          </View>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <X color={COLORS.surface} size={24} />
          </TouchableOpacity>
        </View>

        {/* Contenu */}
        <View style={styles.modalContent}>
          {/* Sélecteur de période */}
          {renderPeriodSelector()}

          {/* Onglets des nutriments */}
          {renderNutrientTabs()}

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Chargement des rapports...</Text>
            </View>
          ) : (
            <ScrollView style={styles.contentScrollView} showsVerticalScrollIndicator={false}>
              {/* Graphique circulaire */}
              {renderCircularProgress()}

              {/* Répartition par repas (seulement pour "aujourd'hui") */}
              {selectedPeriod === 'today' && renderMealBreakdown()}
            </ScrollView>
          )}
        </View>

        {/* Barre d'icônes en bas */}
        <View style={styles.bottomIconBar}>
          <TouchableOpacity style={styles.bottomIcon}>
            <TrendingUp color={COLORS.textSecondary} size={20} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.bottomIcon}>
            <BarChart3 color={COLORS.primary} size={20} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.bottomIcon}>
            <PieChart color={COLORS.textSecondary} size={20} />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#1A1A2E', // Fond sombre comme dans les captures
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#1A1A2E',
  },
  headerContent: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.surface,
    marginBottom: 4,
  },
  dateSubtitle: {
    fontSize: 16,
    color: COLORS.textLight,
  },
  closeButton: {
    padding: 8,
    marginLeft: 16,
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#1A1A2E',
  },
  periodContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  periodScrollContent: {
    paddingVertical: 4,
  },
  periodTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    backgroundColor: COLORS.textSecondary,
    borderRadius: 16,
  },
  selectedPeriodTab: {
    backgroundColor: COLORS.primary,
  },
  periodTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.surface,
  },
  selectedPeriodTabText: {
    color: COLORS.surface,
  },
  tabsContainer: {
    marginBottom: 30,
  },
  tabsContent: {
    paddingHorizontal: 20,
    paddingVertical: 4,
  },
  nutrientTab: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginRight: 12,
    backgroundColor: COLORS.textSecondary,
    borderRadius: 20,
  },
  selectedNutrientTab: {
    backgroundColor: COLORS.surface,
  },
  nutrientTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.surface,
  },
  selectedNutrientTabText: {
    color: COLORS.text,
  },
  contentScrollView: {
    flex: 1,
  },
  circularProgressContainer: {
    alignItems: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  circularProgress: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  progressBackground: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 8,
    borderColor: COLORS.textSecondary,
  },
  progressForeground: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 8,
    borderColor: COLORS.border,
  },
  progressTextContainer: {
    alignItems: 'center',
  },
  progressValue: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.surface,
  },
  progressUnit: {
    fontSize: 16,
    color: COLORS.textLight,
    marginTop: -4,
  },
  mealBreakdownContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  mealBreakdownHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingRight: 20,
    marginBottom: 16,
  },
  mealBreakdownTitle: {
    fontSize: 12,
    color: COLORS.textLight,
    width: 60,
    textAlign: 'right',
    marginLeft: 12,
  },
  mealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.textSecondary,
  },
  mealIndicator: {
    width: 4,
    height: 20,
    backgroundColor: COLORS.textSecondary,
    marginRight: 16,
    borderRadius: 2,
  },
  mealName: {
    flex: 1,
    fontSize: 16,
    color: COLORS.surface,
    fontWeight: '500',
  },
  mealPercentage: {
    fontSize: 16,
    color: COLORS.textLight,
    width: 60,
    textAlign: 'right',
    marginRight: 12,
  },
  mealCalories: {
    fontSize: 16,
    color: COLORS.textLight,
    width: 60,
    textAlign: 'right',
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.surface,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.surface,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textLight,
    marginTop: 16,
  },
  bottomIconBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 40,
    backgroundColor: '#1A1A2E',
    gap: 40,
  },
  bottomIcon: {
    padding: 12,
    borderRadius: 20,
    backgroundColor: COLORS.textSecondary,
  },
});