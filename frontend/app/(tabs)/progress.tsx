import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TrendingUp, Target, Calendar, Award, BarChart3 } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { getWeightHistory, getDailySummary } from '../../lib/api';

const { width } = Dimensions.get('window');

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

interface WeightEntry {
  _id: string;
  weight: number;
  date: string;
  created_at: string;
}

export default function ProgressScreen() {
  const { user } = useAuth();
  const [weightHistory, setWeightHistory] = useState<WeightEntry[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'7' | '30' | '90'>('30');

  const PERIOD_OPTIONS = [
    { key: '7', label: '7j' },
    { key: '30', label: '30j' },
    { key: '90', label: '90j' },
  ];

  useEffect(() => {
    loadProgressData();
  }, [user, selectedPeriod]);

  const loadProgressData = async () => {
    if (!user?.email) return;
    
    try {
      const weightResponse = await getWeightHistory(user.email, parseInt(selectedPeriod));
      setWeightHistory(weightResponse.weights || []);

      const weeklyData = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        try {
          const dailySummary = await getDailySummary(user.email, date.toISOString().split('T')[0]);
          weeklyData.push({
            date: date.toISOString().split('T')[0],
            calories: dailySummary.totals.calories || 0,
            net_carbs: dailySummary.totals.net_carbs || 0,
            keto_score: dailySummary.keto_status === 'excellent' ? 10 : 
                       dailySummary.keto_status === 'attention' ? 7 : 4,
          });
        } catch {
          weeklyData.push({
            date: date.toISOString().split('T')[0],
            calories: 0,
            net_carbs: 0,
            keto_score: 0,
          });
        }
      }
      setWeeklyStats(weeklyData);
    } catch (error) {
      console.error('Erreur lors du chargement des données de progrès:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProgressData();
    setRefreshing(false);
  };

  const getWeightTrend = () => {
    if (weightHistory.length < 2) return null;
    
    const sortedWeights = [...weightHistory].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    const firstWeight = sortedWeights[0].weight;
    const lastWeight = sortedWeights[sortedWeights.length - 1].weight;
    const difference = lastWeight - firstWeight;
    
    return {
      difference: Math.abs(difference),
      trend: difference < 0 ? 'down' : difference > 0 ? 'up' : 'stable',
      percentage: Math.abs((difference / firstWeight) * 100),
    };
  };

  const getAverageKetoScore = () => {
    if (weeklyStats.length === 0) return 0;
    const total = weeklyStats.reduce((sum, day) => sum + day.keto_score, 0);
    return Math.round(total / weeklyStats.length);
  };

  const getAverageNetCarbs = () => {
    if (weeklyStats.length === 0) return 0;
    const total = weeklyStats.reduce((sum, day) => sum + day.net_carbs, 0);
    return Math.round(total / weeklyStats.length);
  };

  const weightTrend = getWeightTrend();
  const avgKetoScore = getAverageKetoScore();
  const avgNetCarbs = getAverageNetCarbs();
  const chartData = weeklyStats.map(stat => stat.net_carbs);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mes Progrès</Text>
          <Text style={styles.headerSubtitle}>Suivez votre évolution</Text>
        </View>

        {/* Period Selector */}
        <View style={styles.periodContainer}>
          <View style={styles.periodSelector}>
            {PERIOD_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.periodButton,
                  selectedPeriod === option.key && styles.selectedPeriodButton,
                ]}
                onPress={() => setSelectedPeriod(option.key as '7' | '30' | '90')}
              >
                <Text style={[
                  styles.periodButtonText,
                  selectedPeriod === option.key && styles.selectedPeriodButtonText,
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: COLORS.success + '20' }]}>
              <Award color={COLORS.success} size={24} />
            </View>
            <Text style={styles.statValue}>{avgKetoScore}/10</Text>
            <Text style={styles.statLabel}>Score Keto moyen</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: COLORS.accent + '20' }]}>
              <Target color={COLORS.accent} size={24} />
            </View>
            <Text style={styles.statValue}>{avgNetCarbs}g</Text>
            <Text style={styles.statLabel}>Glucides nets/jour</Text>
          </View>

          {weightTrend && (
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: 
                weightTrend.trend === 'down' ? COLORS.success + '20' : 
                weightTrend.trend === 'up' ? COLORS.error + '20' : COLORS.textLight + '20' 
              }]}>
                <TrendingUp 
                  color={weightTrend.trend === 'down' ? COLORS.success : 
                        weightTrend.trend === 'up' ? COLORS.error : COLORS.textLight} 
                  size={24} 
                />
              </View>
              <Text style={styles.statValue}>
                {weightTrend.trend === 'down' ? '-' : weightTrend.trend === 'up' ? '+' : ''}
                {weightTrend.difference.toFixed(1)}kg
              </Text>
              <Text style={styles.statLabel}>Variation poids</Text>
            </View>
          )}
        </View>

        {/* Chart Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <BarChart3 color={COLORS.text} size={20} />
            <Text style={styles.sectionTitle}>Glucides nets (7 derniers jours)</Text>
          </View>
          
          <View style={styles.chartCard}>
            {chartData.length > 0 && chartData.some(value => value > 0) ? (
              <View style={styles.chart}>
                <Text style={styles.chartTitle}>Glucides par jour</Text>
                <View style={styles.chartBars}>
                  {chartData.map((value, index) => (
                    <View key={index} style={styles.chartBarContainer}>
                      <View 
                        style={[
                          styles.chartBar, 
                          { 
                            height: Math.max((value / 50) * 80, 4),
                            backgroundColor: value > 25 ? COLORS.error : value > 15 ? COLORS.warning : COLORS.success
                          }
                        ]} 
                      />
                      <Text style={styles.chartBarLabel}>{Math.round(value)}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : (
              <View style={styles.emptyChart}>
                <Text style={styles.emptyChartTitle}>Pas assez de données</Text>
                <Text style={styles.emptyChartText}>Ajoutez plus de repas pour voir vos tendances</Text>
              </View>
            )}
          </View>
        </View>

        {/* Weight History */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <TrendingUp color={COLORS.text} size={20} />
            <Text style={styles.sectionTitle}>Historique de poids</Text>
          </View>
          
          {weightHistory.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Aucune mesure enregistrée</Text>
              <Text style={styles.emptySubtitle}>Ajoutez vos mesures dans votre profil</Text>
            </View>
          ) : (
            <View style={styles.weightCard}>
              {weightHistory.slice(0, 5).map((entry, index) => (
                <View key={entry._id} style={styles.weightEntry}>
                  <View style={styles.weightInfo}>
                    <Text style={styles.weightValue}>{entry.weight.toFixed(1)} kg</Text>
                    <Text style={styles.weightDate}>
                      {new Date(entry.date).toLocaleDateString('fr-FR')}
                    </Text>
                  </View>
                  <View style={styles.weightDivider} />
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Achievements */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Award color={COLORS.text} size={20} />
            <Text style={styles.sectionTitle}>Réalisations</Text>
          </View>
          
          <View style={styles.achievementsGrid}>
            <View style={styles.achievementCard}>
              <Text style={styles.achievementEmoji}>🏆</Text>
              <Text style={styles.achievementTitle}>Premier pas</Text>
              <Text style={styles.achievementDescription}>Premier repas ajouté</Text>
            </View>
            
            <View style={styles.achievementCard}>
              <Text style={styles.achievementEmoji}>🔥</Text>
              <Text style={styles.achievementTitle}>En forme !</Text>
              <Text style={styles.achievementDescription}>7 jours en cétose</Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.text,
  },
  header: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  periodContainer: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectedPeriodButton: {
    backgroundColor: COLORS.surface,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  selectedPeriodButtonText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    width: (width - 56) / 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: 8,
  },
  chartCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
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
  chart: {
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 20,
  },
  chartBars: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    width: '100%',
    height: 100,
  },
  chartBarContainer: {
    alignItems: 'center',
  },
  chartBar: {
    width: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  chartBarLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  emptyChart: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyChartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  emptyChartText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  emptyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 32,
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
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  weightCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
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
  weightEntry: {
    marginBottom: 16,
  },
  weightInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  weightValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  weightDate: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  weightDivider: {
    height: 1,
    backgroundColor: COLORS.background,
  },
  achievementsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  achievementCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
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
  achievementEmoji: {
    fontSize: 32,
    marginBottom: 12,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  bottomSpacing: {
    height: 24,
  },
});