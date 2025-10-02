import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { 
  Droplet, 
  Plus, 
  Copy, 
  Activity, 
  Weight, 
  Clock, 
  ChevronRight,
  Timer,
  Target
} from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import NutritionRingsWidget from '../../components/widgets/NutritionRingsWidget';
import WaterProgressWidget from '../../components/widgets/WaterProgressWidget';
import TipsCarouselWidget from '../../components/widgets/TipsCarouselWidget';
import MealsWidget from '../../components/widgets/MealsWidget';
import ActivityWidget from '../../components/widgets/ActivityWidget';
import WeightWidget from '../../components/widgets/WeightWidget';
import FastingWidget from '../../components/widgets/FastingWidget';
import { getDailySummary } from '../../lib/api';

const { width, height } = Dimensions.get('window');

// Design system colors
const COLORS = {
  primary: '#4CAF50',
  secondary: '#81C784',
  accent: '#FF7043',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  text: '#1E293B',
  textSecondary: '#64748B',
  textLight: '#94A3B8',
  border: '#E2E8F0',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  blue: '#3B82F6',
  purple: '#8B5CF6',
  pink: '#EC4899',
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
  const [waterIntake, setWaterIntake] = useState(1200); // ml
  const [waterTarget] = useState(2500); // ml
  const [isFasting, setIsFasting] = useState(false);
  const [fastingStartTime, setFastingStartTime] = useState<Date | null>(null);

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
          <View>
            <Text style={styles.appName}>KetoSansStress</Text>
            <Text style={styles.dateText}>{getCurrentDate()}</Text>
          </View>
          <TouchableOpacity style={styles.profileButton}>
            <Text style={styles.profileText}>
              {user?.name?.charAt(0).toUpperCase() || 'K'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Nutrition Rings Widget */}
        <View style={styles.widgetContainer}>
          <NutritionRingsWidget 
            dailySummary={dailySummary}
            user={user}
          />
        </View>

        {/* Water Progress Widget */}
        <View style={styles.widgetContainer}>
          <WaterProgressWidget 
            current={waterIntake}
            target={waterTarget}
            onAddWater={(amount) => setWaterIntake(prev => Math.min(prev + amount, waterTarget))}
          />
        </View>

        {/* Tips Carousel Widget */}
        <View style={styles.widgetContainer}>
          <TipsCarouselWidget />
        </View>

        {/* Meals Widget */}
        <View style={styles.widgetContainer}>
          <MealsWidget userEmail={user?.email || ''} />
        </View>

        {/* Activity Widget */}
        <View style={styles.widgetContainer}>
          <ActivityWidget />
        </View>

        {/* Weight Widget */}
        <View style={styles.widgetContainer}>
          <WeightWidget user={user} />
        </View>

        {/* Fasting Widget */}
        <View style={styles.widgetContainer}>
          <FastingWidget 
            isFasting={isFasting}
            startTime={fastingStartTime}
            onStart={(time) => {
              setIsFasting(true);
              setFastingStartTime(time);
            }}
            onStop={() => {
              setIsFasting(false);
              setFastingStartTime(null);
            }}
          />
        </View>

        {/* Bottom spacing for fixed bar */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Fixed Bottom Action Bar */}
      <View style={styles.fixedBottomBar}>
        <View style={styles.bottomBarContainer}>
          {/* Reports Button */}
          <TouchableOpacity style={styles.actionButton} onPress={() => handleReportsPress()}>
            <BarChart3 color={COLORS.textSecondary} size={22} />
            <Text style={styles.actionButtonText}>Rapports</Text>
          </TouchableOpacity>
          
          {/* Add Food Button (Center) */}
          <TouchableOpacity style={styles.centerActionButton} onPress={() => handleAddFoodPress()}>
            <View style={styles.centerButtonCircle}>
              <Plus color={COLORS.surface} size={24} />
            </View>
            <Text style={[styles.actionButtonText, styles.centerButtonText]}>Ajouter</Text>
          </TouchableOpacity>
          
          {/* Settings Button */}
          <TouchableOpacity style={styles.actionButton} onPress={() => handleSettingsPress()}>
            <Settings color={COLORS.textSecondary} size={22} />
            <Text style={styles.actionButtonText}>Paramètres</Text>
          </TouchableOpacity>
        </View>
      </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -1,
  },
  dateText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  profileText: {
    color: COLORS.surface,
    fontSize: 18,
    fontWeight: '700',
  },
  widgetContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
});