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
import { TrendingUp, Target, Calendar, Award } from 'lucide-react-native';
// import { LineChart } from 'react-native-svg-charts';
import { useAuth } from '../../../contexts/AuthContext';
import { getWeightHistory, getDailySummary } from '../../lib/api';

const { width } = Dimensions.get('window');

const COLORS = {
  primary: '#27AE60',
  purple: '#8E44AD',
  white: '#FFFFFF',
  gray: '#F8F9FA',
  dark: '#2C3E50',
  lightGray: '#BDC3C7'
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
    { key: '7', label: '7 jours' },
    { key: '30', label: '30 jours' },
    { key: '90', label: '90 jours' },
  ];

  useEffect(() => {
    loadProgressData();
  }, [user, selectedPeriod]);

  const loadProgressData = async () => {
    if (!user?.email) return;
    
    try {
      // Charger l'historique de poids
      const weightResponse = await getWeightHistory(user.email, parseInt(selectedPeriod));
      setWeightHistory(weightResponse.weights || []);

      // Charger les stats hebdomadaires (simulation)
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
          <Text style={styles.loadingText}>Chargement de vos progrès...</Text>
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
          <Text style={styles.headerSubtitle}>Suivez votre évolution keto</Text>
        </View>

        {/* Période de sélection */}
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

        {/* Stats rapides */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Award color={COLORS.primary} size={24} />
            </View>
            <Text style={styles.statValue}>{avgKetoScore}/10</Text>
            <Text style={styles.statLabel}>Score keto moyen</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Target color={COLORS.purple} size={24} />
            </View>
            <Text style={styles.statValue}>{avgNetCarbs}g</Text>
            <Text style={styles.statLabel}>Glucides nets/jour</Text>
          </View>

          {weightTrend && (
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <TrendingUp 
                  color={weightTrend.trend === 'down' ? COLORS.primary : 
                        weightTrend.trend === 'up' ? '#E74C3C' : COLORS.lightGray} 
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

        {/* Graphique glucides nets */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <TrendingUp color={COLORS.dark} size={20} />
            <Text style={styles.sectionTitle}>Glucides nets (7 derniers jours)</Text>
          </View>
          
          <View style={styles.chartContainer}>
            {chartData.length > 0 && chartData.some(value => value > 0) ? (
              <View style={styles.simpleChart}>
                <Text style={styles.chartTitle}>Glucides nets par jour</Text>
                <View style={styles.chartBars}>
                  {chartData.map((value, index) => (
                    <View key={index} style={styles.chartBarContainer}>
                      <View 
                        style={[
                          styles.chartBar, 
                          { 
                            height: Math.max((value / 50) * 100, 5),
                            backgroundColor: value > 25 ? '#E74C3C' : value > 15 ? '#F39C12' : COLORS.primary
                          }
                        ]} 
                      />
                      <Text style={styles.chartBarLabel}>{Math.round(value)}g</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : (
              <View style={styles.emptyChart}>
                <Text style={styles.emptyChartText}>Pas assez de données</Text>
                <Text style={styles.emptyChartSubtext}>Scannez plus de repas pour voir vos tendances</Text>
              </View>
            )}
          </View>
        </View>

        {/* Historique de poids */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <TrendingUp color={COLORS.dark} size={20} />
            <Text style={styles.sectionTitle}>Historique de poids</Text>
          </View>
          
          {weightHistory.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>Aucune mesure de poids enregistrée</Text>
              <Text style={styles.emptyStateSubtext}>Ajoutez vos mesures dans votre profil</Text>
            </View>
          ) : (
            <View style={styles.weightHistoryContainer}>
              {weightHistory.slice(0, 10).map((entry, index) => (
                <View key={entry._id} style={styles.weightEntry}>
                  <View style={styles.weightDate}>
                    <Calendar color={COLORS.lightGray} size={16} />
                    <Text style={styles.weightDateText}>
                      {new Date(entry.date).toLocaleDateString('fr-FR')}
                    </Text>
                  </View>
                  <Text style={styles.weightValue}>{entry.weight.toFixed(1)} kg</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Badges et récompenses */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Award color={COLORS.dark} size={20} />
            <Text style={styles.sectionTitle}>Badges et récompenses</Text>
          </View>
          
          <View style={styles.badgesContainer}>
            <View style={styles.badge}>
              <Text style={styles.badgeEmoji}>🏆</Text>
              <Text style={styles.badgeTitle}>Premier scan</Text>
              <Text style={styles.badgeDescription}>Votre premier repas analysé</Text>
            </View>
            
            <View style={styles.badge}>
              <Text style={styles.badgeEmoji}>🔥</Text>
              <Text style={styles.badgeTitle}>Keto warrior</Text>
              <Text style={styles.badgeDescription}>7 jours consécutifs en cétose</Text>
            </View>
            
            <View style={styles.badge}>
              <Text style={styles.badgeEmoji}>📈</Text>
              <Text style={styles.badgeTitle}>Progress tracker</Text>
              <Text style={styles.badgeDescription}>Suivi régulier pendant 30 jours</Text>
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
    backgroundColor: COLORS.gray,
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
    color: COLORS.dark,
  },
  header: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.lightGray,
    marginTop: 4,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  periodButton: {
    backgroundColor: COLORS.gray,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
  },
  selectedPeriodButton: {
    backgroundColor: COLORS.primary,
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
  },
  selectedPeriodButtonText: {
    color: COLORS.white,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
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
  statIcon: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.lightGray,
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
    fontWeight: 'bold',
    color: COLORS.dark,
    marginLeft: 8,
  },
  chartContainer: {
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
  chart: {
    height: 200,
  },
  simpleChart: {
    height: 200,
    paddingVertical: 20,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 20,
    textAlign: 'center',
  },
  chartBars: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 120,
  },
  chartBarContainer: {
    alignItems: 'center',
  },
  chartBar: {
    width: 20,
    borderRadius: 10,
    marginBottom: 8,
  },
  chartBarLabel: {
    fontSize: 10,
    color: COLORS.lightGray,
  },
  emptyChart: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyChartText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 8,
  },
  emptyChartSubtext: {
    fontSize: 14,
    color: COLORS.lightGray,
    textAlign: 'center',
  },
  emptyState: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 30,
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
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: COLORS.lightGray,
    textAlign: 'center',
  },
  weightHistoryContainer: {
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
  weightEntry: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  weightDate: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weightDateText: {
    fontSize: 14,
    color: COLORS.lightGray,
    marginLeft: 8,
  },
  weightValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  badge: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: (width - 64) / 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  badgeEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  badgeTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 4,
  },
  badgeDescription: {
    fontSize: 12,
    color: COLORS.lightGray,
    textAlign: 'center',
  },
  bottomSpacing: {
    height: 30,
  },
});