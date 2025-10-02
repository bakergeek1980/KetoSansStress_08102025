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
  Target,
  BarChart3,
  Settings
} from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import NutritionRingsWidget from '../../components/widgets/NutritionRingsWidgetNew';
import WaterProgressWidget from '../../components/widgets/WaterProgressWidgetNew';
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
  const [isNutritionCollapsed, setIsNutritionCollapsed] = useState(false);
  const [scrollY, setScrollY] = useState(0);

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

  const handleScroll = (event: any) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    setScrollY(currentScrollY);
    
    // Collapse nutrition widget when scrolling down past 100px
    const shouldCollapse = currentScrollY > 100;
    if (shouldCollapse !== isNutritionCollapsed) {
      setIsNutritionCollapsed(shouldCollapse);
    }
  };

  const handleCopyPreviousDay = (mealType: string) => {
    console.log('Copying previous day meal:', mealType);
    // Copy meal from previous day
  };

  const handleReportsPress = () => {
    console.log('Opening reports');
    // Navigate to reports screen with tabs for day/week/month/year
    // and categories for meals and nutritional breakdown
  };

  const handleAddFoodPress = () => {
    console.log('Opening add food modal');
    // Show modal with meal type selection (breakfast, lunch, dinner, snack)
    // then navigate to food scanner or search
  };

  const handleSettingsPress = () => {
    console.log('Opening settings');
    // Navigate to settings screen
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
        onScroll={handleScroll}
        scrollEventThrottle={16}
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

        {/* Nutrition Rings Widget - Normal Position */}
        {!isNutritionCollapsed && (
          <View style={styles.widgetContainer}>
            <NutritionRingsWidget 
              dailySummary={dailySummary}
              user={user}
              isCollapsed={false}
            />
          </View>
        )}

        {/* Add spacing when nutrition widget is collapsed */}
        {isNutritionCollapsed && <View style={styles.collapsedNutritionSpacing} />}

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

      {/* Fixed Collapsed Nutrition Widget */}
      {isNutritionCollapsed && (
        <View style={styles.fixedNutritionWidget}>
          <NutritionRingsWidget 
            dailySummary={dailySummary}
            user={user}
            isCollapsed={true}
          />
        </View>
      )}

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
  bottomSpacing: {
    height: 80, // Space for fixed bottom bar
  },
  fixedBottomBar: {
    position: 'absolute',
    bottom: 20,
    left: width / 6, // Center: (100% - 2/3) / 2 = 1/6 from each side
    width: width * 2/3, // 2/3 of screen width
    height: 60,
    backgroundColor: COLORS.surface,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
    borderWidth: 1,
    borderColor: COLORS.border + '30',
  },
  bottomBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 8,
  },
  centerActionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 4,
  },
  centerButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  actionButtonText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  centerButtonText: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  fixedNutritionWidget: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border + '30',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  collapsedNutritionSpacing: {
    height: 80, // Space for collapsed nutrition widget
  },
});