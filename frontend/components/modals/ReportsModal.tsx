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
  Dimensions,
} from 'react-native';
import {
  X,
  TrendingUp,
  Calendar,
  BarChart3,
  PieChart,
  Target,
  Award,
  Activity,
} from 'lucide-react-native';
// TODO: Re-enable Victory Native charts once the component import issue is resolved
// import { 
//   VictoryChart, 
//   VictoryArea, 
//   VictoryPie, 
//   VictoryAxis, 
//   VictoryTheme, 
//   VictoryLine, 
//   VictoryBar 
// } from 'victory-native';
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

const { width: screenWidth } = Dimensions.get('window');

interface ReportsModalProps {
  visible: boolean;
  onClose: () => void;
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

interface WeeklyData {
  day: string;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  ketoScore: number;
}

interface MacroDistribution {
  label: string;
  value: number;
  color: string;
}

interface ProgressMetrics {
  currentWeight: number;
  goalWeight: number;
  startWeight: number;
  daysInKetosis: number;
  totalDays: number;
  avgKetoScore: number;
}

export default function ReportsModal({ visible, onClose }: ReportsModalProps) {
  const { user } = useAuth();
  const { getDailySummary, getMeals, loading: apiLoading, error } = useApi();
  
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('week');
  const [refreshing, setRefreshing] = useState(false);
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [macroDistribution, setMacroDistribution] = useState<MacroDistribution[]>([]);
  const [progressMetrics, setProgressMetrics] = useState<ProgressMetrics | null>(null);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'trends' | 'goals'>('overview');

  // KetoDiet inspired colors
  const COLORS = {
    primary: '#4CAF50',
    secondary: '#81C784',
    accent: '#FF7043',
    background: '#FAFAFA',
    surface: '#FFFFFF',
    text: '#212121',
    textSecondary: '#757575',
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
    keto: '#2E7D32',
    carbs: '#FFA726',
    protein: '#42A5F5',
    fat: '#AB47BC',
  };

  useEffect(() => {
    if (visible && user) {
      loadReportsData();
    }
  }, [visible, selectedPeriod, user]);

  const loadReportsData = async () => {
    if (!user?.email) return;

    try {
      // Charger les données des 7 derniers jours
      const today = new Date();
      const promises = [];
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        promises.push(getDailySummary(user.email, dateStr));
      }

      const weekData = await Promise.all(promises);
      
      // Transformer les données pour les graphiques
      const processedWeekData: WeeklyData[] = weekData.map((day, index) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - index));
        
        return {
          day: date.toLocaleDateString('fr-FR', { weekday: 'short' }),
          calories: day?.totals?.calories || 0,
          carbs: day?.totals?.net_carbs || 0,
          protein: day?.totals?.proteins || 0,
          fat: day?.totals?.fats || 0,
          ketoScore: day?.keto_status === 'ketogenic' ? 10 : 5,
        };
      });

      setWeeklyData(processedWeekData);

      // Calculer la distribution des macros (moyenne de la semaine)
      const avgCalories = processedWeekData.reduce((sum, d) => sum + d.calories, 0) / 7;
      const avgCarbs = processedWeekData.reduce((sum, d) => sum + d.carbs, 0) / 7;
      const avgProtein = processedWeekData.reduce((sum, d) => sum + d.protein, 0) / 7;
      const avgFat = processedWeekData.reduce((sum, d) => sum + d.fat, 0) / 7;

      const totalMacros = (avgCarbs * 4) + (avgProtein * 4) + (avgFat * 9);
      
      setMacroDistribution([
        {
          label: 'Lipides',
          value: totalMacros > 0 ? Math.round(((avgFat * 9) / totalMacros) * 100) : 0,
          color: COLORS.fat,
        },
        {
          label: 'Protéines', 
          value: totalMacros > 0 ? Math.round(((avgProtein * 4) / totalMacros) * 100) : 0,
          color: COLORS.protein,
        },
        {
          label: 'Glucides',
          value: totalMacros > 0 ? Math.round(((avgCarbs * 4) / totalMacros) * 100) : 0,
          color: COLORS.carbs,
        },
      ]);

      // Calculer les métriques de progression
      const ketoticDays = processedWeekData.filter(d => d.ketoScore >= 8).length;
      const avgKetoScore = processedWeekData.reduce((sum, d) => sum + d.ketoScore, 0) / 7;

      setProgressMetrics({
        currentWeight: user.weight || 70,
        goalWeight: user.weight ? user.weight - 5 : 65,
        startWeight: user.weight ? user.weight + 2 : 72,
        daysInKetosis: ketoticDays,
        totalDays: 7,
        avgKetoScore: Math.round(avgKetoScore * 10) / 10,
      });

    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadReportsData();
    setRefreshing(false);
  }, [loadReportsData]);

  const getPeriodText = () => {
    switch (selectedPeriod) {
      case 'week': return 'Cette semaine';
      case 'month': return 'Ce mois-ci';
      case 'year': return 'Cette année';
      default: return 'Cette semaine';
    }
  };

  const renderOverviewTab = () => (
    <View style={styles.tabContent}>
      {/* Métriques de progression */}
      <View style={styles.metricsContainer}>
        <Text style={styles.sectionTitle}>Progression</Text>
        
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Target size={24} color={COLORS.success} />
            <Text style={styles.metricValue}>
              {progressMetrics?.daysInKetosis || 0}/{progressMetrics?.totalDays || 7}
            </Text>
            <Text style={styles.metricLabel}>Jours en cétose</Text>
          </View>

          <View style={styles.metricCard}>
            <Award size={24} color={COLORS.keto} />
            <Text style={styles.metricValue}>
              {progressMetrics?.avgKetoScore || 0}/10
            </Text>
            <Text style={styles.metricLabel}>Score Keto moyen</Text>
          </View>

          <View style={styles.metricCard}>
            <Activity size={24} color={COLORS.primary} />
            <Text style={styles.metricValue}>
              {progressMetrics?.currentWeight || 0} kg
            </Text>
            <Text style={styles.metricLabel}>Poids actuel</Text>
          </View>
        </View>
      </View>

      {/* Distribution des macronutriments */}
      <View style={styles.chartContainer}>
        <Text style={styles.sectionTitle}>Distribution des macros</Text>
        {macroDistribution.length > 0 ? (
          <View style={styles.pieChartContainer}>
            {/* Placeholder for VictoryPie chart */}
            <View style={styles.chartPlaceholder}>
              <Text style={styles.chartPlaceholderText}>Graphique des macros</Text>
              <Text style={styles.chartPlaceholderSubtext}>Affichage temporaire</Text>
            </View>
            <View style={styles.legend}>
              {macroDistribution.map((item, index) => (
                <View key={index} style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                  <Text style={styles.legendText}>
                    {item.label}: {item.value}%
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <Text style={styles.noDataText}>Aucune donnée disponible</Text>
        )}
      </View>
    </View>
  );

  const renderTrendsTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Tendances - {getPeriodText()}</Text>
      
      {weeklyData.length > 0 ? (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Calories quotidiennes</Text>
          {/* Placeholder for VictoryChart */}
          <View style={styles.chartPlaceholder}>
            <Text style={styles.chartPlaceholderText}>Graphique des calories</Text>
            <Text style={styles.chartPlaceholderSubtext}>Données des 7 derniers jours</Text>
          </View>

          <Text style={styles.chartTitle}>Score Keto quotidien</Text>
          {/* Placeholder for VictoryChart */}
          <View style={styles.chartPlaceholder}>
            <Text style={styles.chartPlaceholderText}>Graphique Keto Score</Text>
            <Text style={styles.chartPlaceholderSubtext}>Évolution hebdomadaire</Text>
          </View>
        </View>
      ) : (
        <Text style={styles.noDataText}>Aucune donnée de tendance disponible</Text>
      )}
    </View>
  );

  const renderGoalsTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Objectifs & Cibles</Text>
      
      <View style={styles.goalsContainer}>
        <View style={styles.goalCard}>
          <Text style={styles.goalTitle}>Objectif de poids</Text>
          <View style={styles.goalProgress}>
            <Text style={styles.goalCurrent}>{progressMetrics?.currentWeight} kg</Text>
            <Text style={styles.goalArrow}>→</Text>
            <Text style={styles.goalTarget}>{progressMetrics?.goalWeight} kg</Text>
          </View>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${Math.min(100, ((progressMetrics?.startWeight || 0) - (progressMetrics?.currentWeight || 0)) / ((progressMetrics?.startWeight || 0) - (progressMetrics?.goalWeight || 0)) * 100)}%`,
                  backgroundColor: COLORS.success 
                }
              ]} 
            />
          </View>
        </View>

        <View style={styles.goalCard}>
          <Text style={styles.goalTitle}>Cétose cette semaine</Text>
          <View style={styles.goalProgress}>
            <Text style={styles.goalCurrent}>
              {progressMetrics?.daysInKetosis} / {progressMetrics?.totalDays} jours
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${((progressMetrics?.daysInKetosis || 0) / (progressMetrics?.totalDays || 1)) * 100}%`,
                  backgroundColor: COLORS.keto 
                }
              ]} 
            />
          </View>
        </View>

        <View style={styles.goalCard}>
          <Text style={styles.goalTitle}>Macros quotidiens cibles</Text>
          <View style={styles.macroTargets}>
            <View style={styles.macroTarget}>
              <Text style={styles.macroLabel}>Lipides</Text>
              <Text style={styles.macroValue}>{user?.target_fat || 0}g (65-75%)</Text>
            </View>
            <View style={styles.macroTarget}>
              <Text style={styles.macroLabel}>Protéines</Text>
              <Text style={styles.macroValue}>{user?.target_protein || 0}g (20-25%)</Text>
            </View>
            <View style={styles.macroTarget}>
              <Text style={styles.macroLabel}>Glucides nets</Text>
              <Text style={styles.macroValue}>{user?.target_carbs || 0}g (5-10%)</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <View style={styles.headerContent}>
            <Text style={styles.modalTitle}>Rapports Nutritionnels</Text>
            <Text style={styles.dateSubtitle}>{getPeriodText()}</Text>
          </View>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <X color={COLORS.surface} size={24} />
          </TouchableOpacity>
        </View>

        {/* Period Selector */}
        <View style={styles.periodContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.periodScrollContent}
          >
            {[
              { key: 'week', label: 'Semaine' },
              { key: 'month', label: 'Mois' },
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

        {/* Tab Navigation */}
        <View style={styles.tabNavigation}>
          {[
            { key: 'overview', label: 'Vue d\'ensemble', icon: BarChart3 },
            { key: 'trends', label: 'Tendances', icon: TrendingUp },
            { key: 'goals', label: 'Objectifs', icon: Target }
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tabButton,
                selectedTab === tab.key && styles.selectedTabButton
              ]}
              onPress={() => setSelectedTab(tab.key as any)}
              activeOpacity={0.7}
            >
              <tab.icon 
                size={20} 
                color={selectedTab === tab.key ? COLORS.primary : COLORS.textSecondary} 
              />
              <Text style={[
                styles.tabButtonText,
                selectedTab === tab.key && styles.selectedTabButtonText
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content */}
        <ScrollView 
          style={styles.contentScrollView} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
        >
          {selectedTab === 'overview' && renderOverviewTab()}
          {selectedTab === 'trends' && renderTrendsTab()}
          {selectedTab === 'goals' && renderGoalsTab()}
        </ScrollView>
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
  // New styles for tab-based structure
  tabNavigation: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#1A1A2E',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: COLORS.textSecondary,
  },
  selectedTabButton: {
    backgroundColor: COLORS.surface,
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.surface,
    marginLeft: 6,
  },
  selectedTabButtonText: {
    color: COLORS.text,
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.surface,
    marginBottom: 16,
  },
  metricsContainer: {
    marginBottom: 30,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 4,
    backgroundColor: COLORS.textSecondary,
    borderRadius: 12,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.surface,
    marginTop: 8,
  },
  metricLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: 4,
  },
  chartContainer: {
    marginBottom: 30,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.surface,
    marginBottom: 12,
  },
  pieChartContainer: {
    alignItems: 'center',
  },
  legend: {
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
    color: COLORS.surface,
  },
  noDataText: {
    fontSize: 16,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: 40,
  },
  goalsContainer: {
    marginTop: 16,
  },
  goalCard: {
    backgroundColor: COLORS.textSecondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.surface,
    marginBottom: 12,
  },
  goalProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalCurrent: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.surface,
  },
  goalArrow: {
    fontSize: 16,
    color: COLORS.textLight,
    marginHorizontal: 12,
  },
  goalTarget: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  macroTargets: {
    marginTop: 8,
  },
  macroTarget: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  macroLabel: {
    fontSize: 14,
    color: COLORS.surface,
  },
  macroValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  chartPlaceholder: {
    height: 200,
    backgroundColor: COLORS.textSecondary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  chartPlaceholderText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.surface,
    marginBottom: 4,
  },
  chartPlaceholderSubtext: {
    fontSize: 14,
    color: COLORS.textLight,
  },
});