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
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Camera, Plus, Zap, Target, Utensils, TrendingUp } from 'lucide-react-native';
import { useAuth } from '../../../contexts/AuthContext';
import MacroRing from '../../../components/macro/MacroRing';
import TodayMeals from '../../../components/meals/TodayMeals';
import { getDailySummary } from '../../../lib/api';

const { width } = Dimensions.get('window');

const COLORS = {
  primary: '#27AE60',
  purple: '#8E44AD',
  white: '#FFFFFF',
  gray: '#F8F9FA',
  dark: '#2C3E50',
  lightGray: '#BDC3C7'
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
      case 'excellent': return COLORS.primary;
      case 'attention': return '#F39C12';
      case 'dépassé': return '#E74C3C';
      default: return COLORS.lightGray;
    }
  };

  const getKetoStatusText = (status: string) => {
    switch (status) {
      case 'excellent': return 'Excellent ! Vous êtes en cétose';
      case 'attention': return 'Attention aux glucides';
      case 'dépassé': return 'Limite de glucides dépassée';
      default: return 'Commencez votre journée keto';
    }
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
        <LinearGradient
          colors={[COLORS.primary, COLORS.purple]}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greeting}>Bonjour,</Text>
              <Text style={styles.userName}>{user?.name || 'Utilisateur'} !</Text>
            </View>
            <TouchableOpacity style={styles.profileButton}>
              <Text style={styles.profileInitial}>
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Status Keto */}
          <View style={styles.ketoStatusContainer}>
            <View style={styles.ketoStatusBadge}>
              <Zap color={getKetoStatusColor(dailySummary?.keto_status || '')} size={16} />
              <Text style={[styles.ketoStatusText, { color: getKetoStatusColor(dailySummary?.keto_status || '') }]}>
                {getKetoStatusText(dailySummary?.keto_status || '')}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Bouton Scanner Principal */}
        <TouchableOpacity
          style={styles.scanButton}
          onPress={() => router.push('/scanner')}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[COLORS.primary, COLORS.purple]}
            style={styles.scanButtonGradient}
          >
            <Camera color={COLORS.white} size={32} />
            <Text style={styles.scanButtonText}>Scanner un repas</Text>
            <Text style={styles.scanButtonSubtext}>Analyse IA instantanée</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Macros du jour */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Target color={COLORS.dark} size={20} />
            <Text style={styles.sectionTitle}>Macros d'aujourd'hui</Text>
          </View>

          {dailySummary ? (
            <View style={styles.macroContainer}>
              <MacroRing
                label="Calories"
                current={dailySummary.totals.calories}
                target={dailySummary.targets.calories}
                color={COLORS.purple}
                unit="kcal"
              />
              <MacroRing
                label="Glucides nets"
                current={dailySummary.totals.net_carbs}
                target={dailySummary.targets.carbs}
                color={dailySummary.progress.carbs > 100 ? '#E74C3C' : COLORS.primary}
                unit="g"
              />
              <MacroRing
                label="Protéines"
                current={dailySummary.totals.proteins}
                target={dailySummary.targets.proteins}
                color={COLORS.primary}
                unit="g"
              />
              <MacroRing
                label="Lipides"
                current={dailySummary.totals.fats}
                target={dailySummary.targets.fats}
                color={COLORS.purple}
                unit="g"
              />
            </View>
          ) : (
            <View style={styles.emptyMacroContainer}>
              <Text style={styles.emptyMacroText}>Aucun repas enregistré aujourd'hui</Text>
              <Text style={styles.emptyMacroSubtext}>Commencez par scanner votre premier repas !</Text>
            </View>
          )}
        </View>

        {/* Repas du jour */}
        <TodayMeals userEmail={user?.email || ''} />

        {/* Actions rapides */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions rapides</Text>
          <View style={styles.quickActionsContainer}>
            <TouchableOpacity 
              style={styles.quickAction}
              onPress={() => router.push('/(tabs)/meals')}
            >
              <Utensils color={COLORS.primary} size={24} />
              <Text style={styles.quickActionText}>Mes repas</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickAction}
              onPress={() => router.push('/(tabs)/progress')}
            >
              <TrendingUp color={COLORS.purple} size={24} />
              <Text style={styles.quickActionText}>Progrès</Text>
            </TouchableOpacity>
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 16,
    color: COLORS.white,
    opacity: 0.9,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
    marginTop: 2,
  },
  profileButton: {
    width: 45,
    height: 45,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  ketoStatusContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  ketoStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  ketoStatusText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  scanButton: {
    marginHorizontal: 20,
    marginTop: -25,
    marginBottom: 30,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  scanButtonGradient: {
    paddingVertical: 24,
    paddingHorizontal: 30,
    borderRadius: 20,
    alignItems: 'center',
  },
  scanButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
    marginTop: 8,
  },
  scanButtonSubtext: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.9,
    marginTop: 4,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 30,
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
  macroContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    paddingVertical: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  emptyMacroContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    paddingVertical: 40,
    paddingHorizontal: 20,
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
  emptyMacroText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
    textAlign: 'center',
  },
  emptyMacroSubtext: {
    fontSize: 14,
    color: COLORS.lightGray,
    textAlign: 'center',
    marginTop: 8,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickAction: {
    backgroundColor: COLORS.white,
    flex: 1,
    marginHorizontal: 8,
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 12,
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
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
    marginTop: 8,
    textAlign: 'center',
  },
  bottomSpacing: {
    height: 30,
  },
});