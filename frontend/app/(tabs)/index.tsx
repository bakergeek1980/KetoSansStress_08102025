import React, { useEffect, useState } from 'react';
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
import { useRouter } from 'expo-router';
import { Camera, Plus, Target, Utensils, TrendingUp, Bell } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import MacroRing from '../../components/macro/MacroRing';
import TodayMeals from '../../components/meals/TodayMeals';
import { getDailySummary } from '../../lib/api';

const { width } = Dimensions.get('window');

// KetoDiet inspired color scheme
const COLORS = {
  primary: '#4CAF50',      // Fresh green
  secondary: '#81C784',    // Light green
  accent: '#FF7043',       // Orange accent
  background: '#FAFAFA',   // Very light gray
  surface: '#FFFFFF',      // White
  text: '#212121',         // Dark gray
  textSecondary: '#757575', // Medium gray
  textLight: '#9E9E9E',    // Light gray
  divider: '#E0E0E0',      // Very light gray
  error: '#F44336',        // Red
  warning: '#FF9800',      // Orange
  success: '#4CAF50',      // Green
};

interface DailySummary {
  date: string;
  totals: {
    calories: number;
    proteins: number;
    carbs: number;
    net_carbs: number;
    fats: number;
    fiber: number;
  };
  targets: {
    calories: number;
    carbs: number;
    proteins: number;
    fats: number;
  };
  progress: {
    calories: number;
    carbs: number;
    proteins: number;
    fats: number;
  };
  meals_count: number;
  keto_status: 'excellent' | 'attention' | 'dépassé';
}

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDailySummary = async () => {
    if (!user?.email) return;
    
    try {
      const summary = await getDailySummary(user.email);
      setDailySummary(summary);
    } catch (error) {
      console.error('Erreur lors du chargement du résumé:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDailySummary();
    setRefreshing(false);
  };

  useEffect(() => {
    loadDailySummary();
  }, [user]);

  const getKetoStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return COLORS.success;
      case 'attention': return COLORS.warning;
      case 'dépassé': return COLORS.error;
      default: return COLORS.textLight;
    }
  };

  const getKetoStatusText = (status: string) => {
    switch (status) {
      case 'excellent': return 'Parfait ! Vous êtes en cétose';
      case 'attention': return 'Attention aux glucides';
      case 'dépassé': return 'Limite dépassée';
      default: return 'Commencez votre suivi';
    }
  };

  const getCurrentDate = () => {
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    };
    return today.toLocaleDateString('fr-FR', options);
  };

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
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.appName}>KetoSansStress</Text>
              <Text style={styles.dateText}>{getCurrentDate()}</Text>
            </View>
            <TouchableOpacity style={styles.notificationButton}>
              <Bell color={COLORS.textSecondary} size={24} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Greeting Card */}
        <View style={styles.greetingCard}>
          <Text style={styles.greeting}>Bonjour {user?.name || 'Utilisateur'} !</Text>
          <Text style={styles.subtitle}>Comment vous sentez-vous aujourd'hui ?</Text>
          
          {/* Status Badge */}
          <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, { backgroundColor: getKetoStatusColor(dailySummary?.keto_status || '') + '20' }]}>
              <View style={[styles.statusDot, { backgroundColor: getKetoStatusColor(dailySummary?.keto_status || '') }]} />
              <Text style={[styles.statusText, { color: getKetoStatusColor(dailySummary?.keto_status || '') }]}>
                {getKetoStatusText(dailySummary?.keto_status || '')}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Add Button */}
        <TouchableOpacity
          style={styles.quickAddButton}
          onPress={() => router.push('/scanner')}
          activeOpacity={0.7}
        >
          <View style={styles.quickAddContent}>
            <View style={styles.quickAddIcon}>
              <Plus color={COLORS.surface} size={24} />
            </View>
            <View style={styles.quickAddText}>
              <Text style={styles.quickAddTitle}>Ajouter un repas</Text>
              <Text style={styles.quickAddSubtitle}>Scanner ou rechercher</Text>
            </View>
            <Camera color={COLORS.textSecondary} size={20} />
          </View>
        </TouchableOpacity>

        {/* Daily Overview */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Target color={COLORS.text} size={20} />
            <Text style={styles.sectionTitle}>Aujourd'hui</Text>
          </View>

          {dailySummary ? (
            <View style={styles.overviewCard}>
              <View style={styles.macroRow}>
                <MacroRing
                  label="Calories"
                  current={dailySummary.totals.calories}
                  target={dailySummary.targets.calories}
                  color={COLORS.accent}
                  unit="kcal"
                />
                <View style={styles.macroDetails}>
                  <View style={styles.macroItem}>
                    <Text style={styles.macroLabel}>Glucides nets</Text>
                    <Text style={[styles.macroValue, { color: dailySummary.progress.carbs > 100 ? COLORS.error : COLORS.success }]}>
                      {Math.round(dailySummary.totals.net_carbs)}g / {dailySummary.targets.carbs}g
                    </Text>
                  </View>
                  <View style={styles.macroItem}>
                    <Text style={styles.macroLabel}>Protéines</Text>
                    <Text style={styles.macroValue}>
                      {Math.round(dailySummary.totals.proteins)}g / {dailySummary.targets.proteins}g
                    </Text>
                  </View>
                  <View style={styles.macroItem}>
                    <Text style={styles.macroLabel}>Lipides</Text>
                    <Text style={styles.macroValue}>
                      {Math.round(dailySummary.totals.fats)}g / {dailySummary.targets.fats}g
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Aucun repas aujourd'hui</Text>
              <Text style={styles.emptySubtitle}>Ajoutez votre premier repas pour commencer</Text>
            </View>
          )}
        </View>

        {/* Recent Meals */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Utensils color={COLORS.text} size={20} />
            <Text style={styles.sectionTitle}>Repas récents</Text>
          </View>
          <TodayMeals userEmail={user?.email || ''} />
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/(tabs)/meals')}
          >
            <View style={[styles.actionIcon, { backgroundColor: COLORS.primary + '20' }]}>
              <Utensils color={COLORS.primary} size={24} />
            </View>
            <Text style={styles.actionTitle}>Historique</Text>
            <Text style={styles.actionSubtitle}>Voir tous les repas</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/(tabs)/progress')}
          >
            <View style={[styles.actionIcon, { backgroundColor: COLORS.accent + '20' }]}>
              <TrendingUp color={COLORS.accent} size={24} />
            </View>
            <Text style={styles.actionTitle}>Progrès</Text>
            <Text style={styles.actionSubtitle}>Statistiques</Text>
          </TouchableOpacity>
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
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
  },
  dateText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
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
  greetingCard: {
    marginHorizontal: 20,
    marginBottom: 20,
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
  greeting: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  statusContainer: {
    alignItems: 'flex-start',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  quickAddButton: {
    marginHorizontal: 20,
    marginBottom: 24,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  quickAddContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  quickAddIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  quickAddText: {
    flex: 1,
  },
  quickAddTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  quickAddSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
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
  overviewCard: {
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
  macroRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  macroDetails: {
    flex: 1,
    marginLeft: 24,
  },
  macroItem: {
    marginBottom: 12,
  },
  macroLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  macroValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
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
  quickActionsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 16,
  },
  actionCard: {
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
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  bottomSpacing: {
    height: 24,
  },
});