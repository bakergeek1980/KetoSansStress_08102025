import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Modal,
  ScrollView,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Activity, Heart, Zap, Target, Settings, X } from 'lucide-react-native';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';

const { width } = Dimensions.get('window');

const COLORS = {
  primary: '#4CAF50',
  secondary: '#81C784',
  accent: '#FF7043',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  text: '#1E293B',
  textSecondary: '#64748B',
  textLight: '#94A3B8',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  blue: '#3B82F6',
  purple: '#8B5CF6',
  pink: '#EC4899',
};

interface ActivityData {
  caloriesBurned: number;
  caloriesTarget: number;
  workouts: number;
  workoutsTarget: number;
  steps: number;
  stepsTarget: number;
  heartRate: number;
}

const ProgressRing = ({ 
  current, 
  target, 
  size = 60, 
  strokeWidth = 6, 
  color,
  gradientColors 
}: {
  current: number;
  target: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  gradientColors: string[];
}) => {
  const percentage = Math.min((current / target) * 100, 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <View style={[styles.progressRing, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Defs>
          <SvgLinearGradient id={`gradient_${color}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={gradientColors[0]} stopOpacity="1" />
            <Stop offset="100%" stopColor={gradientColors[1]} stopOpacity="1" />
          </SvgLinearGradient>
        </Defs>
        
        {/* Background circle */}
        <Circle
          stroke="#E2E8F0"
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          opacity={0.3}
        />
        
        {/* Progress circle */}
        <Circle
          stroke={`url(#gradient_${color})`}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      
      <View style={styles.progressCenter}>
        <Text style={[styles.progressPercentage, { color }]}>
          {Math.round(percentage)}%
        </Text>
      </View>
    </View>
  );
};

export default function ActivityWidget() {
  const [activityData] = useState<ActivityData>({
    caloriesBurned: 320,
    caloriesTarget: 500,
    workouts: 1,
    workoutsTarget: 2,
    steps: 7250,
    stepsTarget: 10000,
    heartRate: 72,
  });

  const [selectedTab, setSelectedTab] = useState<'calories' | 'workouts' | 'steps'>('calories');
  const [showSettings, setShowSettings] = useState(false);
  
  // Settings states
  const [addCaloriesObjective, setAddCaloriesObjective] = useState(false);
  const [syncHealthApp, setSyncHealthApp] = useState(false);
  const [importFitbit, setImportFitbit] = useState(false);

  const getTabData = () => {
    switch (selectedTab) {
      case 'calories':
        return {
          current: activityData.caloriesBurned,
          target: activityData.caloriesTarget,
          unit: 'kcal',
          icon: Zap,
          color: COLORS.accent,
          gradientColors: ['#FF8A65', '#FF7043'],
        };
      case 'workouts':
        return {
          current: activityData.workouts,
          target: activityData.workoutsTarget,
          unit: 'séances',
          icon: Target,
          color: COLORS.purple,
          gradientColors: ['#A78BFA', '#8B5CF6'],
        };
      case 'steps':
        return {
          current: activityData.steps,
          target: activityData.stepsTarget,
          unit: 'pas',
          icon: Activity,
          color: COLORS.success,
          gradientColors: ['#34D399', '#10B981'],
        };
      default:
        return {
          current: 0,
          target: 1,
          unit: '',
          icon: Activity,
          color: COLORS.primary,
          gradientColors: ['#4CAF50', '#4CAF50'],
        };
    }
  };

  const tabData = getTabData();
  const TabIcon = tabData.icon;

  return (
    <View style={styles.widget}>
      <LinearGradient
        colors={['#FFFFFF', '#FEFEFE']}
        style={styles.widgetGradient}
      >
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Activity color={COLORS.accent} size={20} />
            <Text style={styles.widgetTitle}>Activité</Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.heartRateContainer}>
              <Heart color={COLORS.error} size={14} />
              <Text style={styles.heartRateText}>{activityData.heartRate} bpm</Text>
            </View>
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => setShowSettings(true)}
            >
              <Settings color={COLORS.textSecondary} size={18} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab selector */}
        <View style={styles.tabsContainer}>
          {['calories', 'workouts', 'steps'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tab,
                selectedTab === tab && [styles.activeTab, { backgroundColor: tabData.color + '15' }]
              ]}
              onPress={() => setSelectedTab(tab as any)}
            >
              <Text style={[
                styles.tabText,
                selectedTab === tab && [styles.activeTabText, { color: tabData.color }]
              ]}>
                {tab === 'calories' ? 'Calories' : tab === 'workouts' ? 'Séances' : 'Pas'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Progress display */}
        <View style={styles.progressContainer}>
          <ProgressRing
            current={tabData.current}
            target={tabData.target}
            size={100}
            strokeWidth={8}
            color={tabData.color}
            gradientColors={tabData.gradientColors}
          />
          
          <View style={styles.statsContainer}>
            <View style={styles.statRow}>
              <TabIcon color={tabData.color} size={18} />
              <Text style={styles.currentValue}>
                {selectedTab === 'steps' ? tabData.current.toLocaleString() : tabData.current}
              </Text>
              <Text style={styles.unit}>/ {selectedTab === 'steps' ? tabData.target.toLocaleString() : tabData.target} {tabData.unit}</Text>
            </View>
            
            <View style={styles.motivationContainer}>
              <Text style={styles.motivationText}>
                {tabData.current >= tabData.target 
                  ? '🎉 Objectif atteint !' 
                  : `Plus que ${selectedTab === 'steps' 
                      ? (tabData.target - tabData.current).toLocaleString() 
                      : tabData.target - tabData.current} ${tabData.unit}`
                }
              </Text>
            </View>
          </View>
        </View>

        {/* Quick stats */}
        <View style={styles.quickStats}>
          <View style={styles.quickStat}>
            <Zap color={COLORS.accent} size={16} />
            <Text style={styles.quickStatValue}>{activityData.caloriesBurned}</Text>
            <Text style={styles.quickStatLabel}>kcal</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.quickStat}>
            <Target color={COLORS.purple} size={16} />
            <Text style={styles.quickStatValue}>{activityData.workouts}</Text>
            <Text style={styles.quickStatLabel}>séances</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.quickStat}>
            <Activity color={COLORS.success} size={16} />
            <Text style={styles.quickStatValue}>{(activityData.steps / 1000).toFixed(1)}k</Text>
            <Text style={styles.quickStatLabel}>pas</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Settings Modal */}
      <Modal
        visible={showSettings}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSettings(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Paramètres Activité</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowSettings(false)}
            >
              <X color={COLORS.textSecondary} size={24} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Add calories objective setting */}
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Ajouter objectif calories</Text>
                <Text style={styles.settingDescription}>
                  Ajouter les calories dépensées pendant les activités énergétiques en plus de votre consommation d'énergie au repos
                </Text>
              </View>
              <Switch
                value={addCaloriesObjective}
                onValueChange={setAddCaloriesObjective}
                trackColor={{ false: COLORS.border, true: COLORS.primary + '50' }}
                thumbColor={addCaloriesObjective ? COLORS.primary : COLORS.textLight}
              />
            </View>

            {/* HealthApp sync setting */}
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Synch. avec HealthApp</Text>
                <Text style={styles.settingDescription}>
                  Synchroniser automatiquement vos données d'activité avec Apple Health
                </Text>
              </View>
              <Switch
                value={syncHealthApp}
                onValueChange={setSyncHealthApp}
                trackColor={{ false: COLORS.border, true: COLORS.primary + '50' }}
                thumbColor={syncHealthApp ? COLORS.primary : COLORS.textLight}
              />
            </View>

            {/* Fitbit import setting */}
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Importer de Fitbit</Text>
                <Text style={styles.settingDescription}>
                  Importer vos données d'activité depuis votre compte Fitbit
                </Text>
              </View>
              <Switch
                value={importFitbit}
                onValueChange={setImportFitbit}
                trackColor={{ false: COLORS.border, true: COLORS.primary + '50' }}
                thumbColor={importFitbit ? COLORS.primary : COLORS.textLight}
              />
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  widget: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 16,
  },
  widgetGradient: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  widgetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginLeft: 8,
  },
  heartRateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.error + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  heartRateText: {
    fontSize: 12,
    color: COLORS.error,
    fontWeight: '600',
    marginLeft: 4,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: COLORS.surface,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  activeTabText: {
    color: COLORS.text,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  progressRing: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  progressCenter: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: '800',
  },
  statsContainer: {
    flex: 1,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  currentValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginLeft: 8,
    marginRight: 4,
  },
  unit: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  motivationContainer: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 8,
  },
  motivationText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
  },
  quickStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 12,
  },
  quickStat: {
    flex: 1,
    alignItems: 'center',
  },
  quickStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 4,
    marginBottom: 2,
  },
  quickStatLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: COLORS.border,
    marginHorizontal: 12,
  },
  
  // Header styles
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingsButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  
  // Setting item styles
  settingItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: COLORS.background,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border + '50',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
});