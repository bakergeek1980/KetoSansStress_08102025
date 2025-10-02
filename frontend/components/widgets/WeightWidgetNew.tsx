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
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Weight, TrendingUp, TrendingDown, Minus, Plus, Settings, X, ChevronRight } from 'lucide-react-native';
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';

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
  border: '#E2E8F0',
};

interface WeightData {
  current: number;
  target: number;
  initial: number;
  history: { date: string; weight: number }[];
}

interface WeightWidgetProps {
  user: any;
}

// Date Picker Component
const DatePicker = ({ 
  visible, 
  onClose, 
  onConfirm, 
  initialDate = new Date() 
}: {
  visible: boolean;
  onClose: () => void;
  onConfirm: (date: Date) => void;
  initialDate?: Date;
}) => {
  const [selectedDate, setSelectedDate] = useState(initialDate);

  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 20 }, (_, i) => currentYear - 10 + i);

  const [selectedDay, setSelectedDay] = useState(selectedDate.getDate());
  const [selectedMonth, setSelectedMonth] = useState(selectedDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(selectedDate.getFullYear());

  const handleConfirm = () => {
    const newDate = new Date(selectedYear, selectedMonth, selectedDay);
    setSelectedDate(newDate);
    onConfirm(newDate);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Editer date de début</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X color={COLORS.textSecondary} size={24} />
          </TouchableOpacity>
        </View>

        <View style={styles.datePickerContainer}>
          <View style={styles.dateColumn}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {days.map((day) => (
                <TouchableOpacity
                  key={day}
                  style={[styles.dateItem, selectedDay === day && styles.selectedDateItem]}
                  onPress={() => setSelectedDay(day)}
                >
                  <Text style={[styles.dateText, selectedDay === day && styles.selectedDateText]}>
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.dateColumn}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {months.map((month, index) => (
                <TouchableOpacity
                  key={month}
                  style={[styles.dateItem, selectedMonth === index && styles.selectedDateItem]}
                  onPress={() => setSelectedMonth(index)}
                >
                  <Text style={[styles.dateText, selectedMonth === index && styles.selectedDateText]}>
                    {month}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.dateColumn}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {years.map((year) => (
                <TouchableOpacity
                  key={year}
                  style={[styles.dateItem, selectedYear === year && styles.selectedDateItem]}
                  onPress={() => setSelectedYear(year)}
                >
                  <Text style={[styles.dateText, selectedYear === year && styles.selectedDateText]}>
                    {year}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </div>

        <Text style={styles.datePickerDescription}>
          Nous allons calculer vos changements de poids à partir de cette date.
        </Text>

        <TouchableOpacity style={styles.updateButton} onPress={handleConfirm}>
          <Text style={styles.updateButtonText}>Mise à jour</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

// Body Fat Percentage Modal
const BodyFatModal = ({ 
  visible, 
  onClose, 
  bodyFatPercentage, 
  setBodyFatPercentage 
}: {
  visible: boolean;
  onClose: () => void;
  bodyFatPercentage: number;
  setBodyFatPercentage: (value: number) => void;
}) => {
  const [tempPercentage, setTempPercentage] = useState(bodyFatPercentage);
  const [adjustNutrition, setAdjustNutrition] = useState(true);

  const handleUpdate = () => {
    setBodyFatPercentage(tempPercentage);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Pourcentage de graisse</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X color={COLORS.textSecondary} size={24} />
          </TouchableOpacity>
        </View>

        <View style={styles.modalContent}>
          <Text style={styles.percentageDisplay}>{tempPercentage}%</Text>

          <View style={styles.percentageControls}>
            <TouchableOpacity
              style={styles.percentageButton}
              onPress={() => setTempPercentage(Math.max(5, tempPercentage - 1))}
            >
              <Minus color={COLORS.surface} size={20} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.percentageButton}
              onPress={() => setTempPercentage(Math.min(50, tempPercentage + 1))}
            >
              <Plus color={COLORS.surface} size={20} />
            </TouchableOpacity>
          </View>

          <View style={styles.adjustmentOption}>
            <Text style={styles.adjustmentText}>
              Vos objectifs nutritionnels seront réajustés en fonction de la nouvelle valeur poids.
            </Text>
            <Switch
              value={adjustNutrition}
              onValueChange={setAdjustNutrition}
              trackColor={{ false: COLORS.border, true: COLORS.primary + '50' }}
              thumbColor={adjustNutrition ? COLORS.primary : COLORS.textLight}
            />
          </View>

          <TouchableOpacity style={styles.updateButton} onPress={handleUpdate}>
            <Text style={styles.updateButtonText}>Mise à jour</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// Health App Permission Modal
const HealthAppModal = ({ 
  visible, 
  onClose, 
  onPermissionResult 
}: {
  visible: boolean;
  onClose: () => void;
  onPermissionResult: (granted: boolean) => void;
}) => {
  const [writePermission, setWritePermission] = useState(false);
  const [readPermission, setReadPermission] = useState(false);

  const bothEnabled = writePermission && readPermission;
  const bothDisabled = !writePermission && !readPermission;

  const handleToggleAll = () => {
    if (bothEnabled) {
      setWritePermission(false);
      setReadPermission(false);
    } else {
      setWritePermission(true);
      setReadPermission(true);
    }
  };

  const handleAllow = () => {
    onPermissionResult(true);
    onClose();
  };

  const handleDeny = () => {
    onPermissionResult(false);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Santé</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X color={COLORS.textSecondary} size={24} />
          </TouchableOpacity>
        </View>

        <View style={styles.modalContent}>
          <Text style={styles.healthPermissionTitle}>
            KetoSansStress souhaite accéder à vos données Santé et les mettre à jour.
          </Text>

          <TouchableOpacity style={styles.toggleAllButton} onPress={handleToggleAll}>
            <Text style={styles.toggleAllText}>
              {bothEnabled ? 'Tout désactiver' : 'Tout activer'}
            </Text>
          </TouchableOpacity>

          <View style={styles.permissionItem}>
            <View style={styles.permissionInfo}>
              <Text style={styles.permissionTitle}>
                Autoriser "KetoSansStress à écrire" poids
              </Text>
              <Text style={styles.permissionDescription}>
                Explication de l'app : Pour stocker les données de santé saisies dans ketosansStress.app
              </Text>
            </View>
            <Switch
              value={writePermission}
              onValueChange={setWritePermission}
              trackColor={{ false: COLORS.border, true: COLORS.primary + '50' }}
              thumbColor={writePermission ? COLORS.primary : COLORS.textLight}
            />
          </View>

          <View style={styles.permissionItem}>
            <View style={styles.permissionInfo}>
              <Text style={styles.permissionTitle}>
                Autoriser "KetoSansStress à la lecture" poids
              </Text>
              <Text style={styles.permissionDescription}>
                Explication de l'app : Pour calculer et mettre correctement à jour vos objectifs nutritionnels
              </Text>
            </View>
            <Switch
              value={readPermission}
              onValueChange={setReadPermission}
              trackColor={{ false: COLORS.border, true: COLORS.primary + '50' }}
              thumbColor={readPermission ? COLORS.primary : COLORS.textLight}
            />
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.allowButton]} 
              onPress={handleAllow}
            >
              <Text style={styles.allowButtonText}>Autoriser</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.denyButton]} 
              onPress={handleDeny}
            >
              <Text style={styles.denyButtonText}>Refuser</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const WeightChart = ({ data }: { data: { date: string; weight: number }[] }) => {
  const chartWidth = width - 80;
  const chartHeight = 60;
  const minWeight = Math.min(...data.map(d => d.weight)) - 1;
  const maxWeight = Math.max(...data.map(d => d.weight)) + 1;
  const weightRange = maxWeight - minWeight;
  
  const points = data.map((point, index) => {
    const x = (chartWidth / (data.length - 1)) * index;
    const y = chartHeight - ((point.weight - minWeight) / weightRange) * chartHeight;
    return `${x},${y}`;
  });
  
  const pathData = `M ${points.join(' L ')}`;
  const areaData = `${pathData} L ${chartWidth},${chartHeight} L 0,${chartHeight} Z`;
  
  return (
    <View style={styles.chartContainer}>
      <Svg width={chartWidth} height={chartHeight}>
        <Defs>
          <SvgLinearGradient id="weightGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={COLORS.blue} stopOpacity="0.3" />
            <Stop offset="100%" stopColor={COLORS.blue} stopOpacity="0.05" />
          </SvgLinearGradient>
        </Defs>
        
        <Path d={areaData} fill="url(#weightGradient)" />
        <Path 
          d={pathData} 
          stroke={COLORS.blue} 
          strokeWidth="2" 
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {data.map((point, index) => {
          const x = (chartWidth / (data.length - 1)) * index;
          const y = chartHeight - ((point.weight - minWeight) / weightRange) * chartHeight;
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="3"
              fill={COLORS.blue}
              stroke={COLORS.surface}
              strokeWidth="2"
            />
          );
        })}
      </Svg>
    </View>
  );
};

export default function WeightWidget({ user }: WeightWidgetProps) {
  const [weightData] = useState<WeightData>({
    current: 72.5,
    target: 70.0,
    initial: 75.0,
    history: [
      { date: '2025-01-15', weight: 75.0 },
      { date: '2025-01-22', weight: 74.2 },
      { date: '2025-01-29', weight: 73.8 },
      { date: '2025-02-05', weight: 73.1 },
      { date: '2025-02-12', weight: 72.9 },
      { date: '2025-02-19', weight: 72.5 },
    ],
  });

  // Modal states
  const [showSettings, setShowSettings] = useState(false);
  const [showHealthApp, setShowHealthApp] = useState(false);
  const [showBodyFat, setShowBodyFat] = useState(false);
  const [showStartDate, setShowStartDate] = useState(false);

  // Settings states
  const [syncHealthApp, setSyncHealthApp] = useState(false);
  const [bodyFatPercentage, setBodyFatPercentage] = useState(15);
  const [startDate, setStartDate] = useState(new Date('2025-01-15'));

  const totalLoss = weightData.initial - weightData.current;
  const remainingToTarget = weightData.current - weightData.target;
  const progressPercentage = ((totalLoss) / (weightData.initial - weightData.target)) * 100;
  
  const getTrendIcon = () => {
    if (weightData.history.length < 2) return null;
    
    const lastTwo = weightData.history.slice(-2);
    const change = lastTwo[1].weight - lastTwo[0].weight;
    
    if (change < -0.1) return TrendingDown;
    if (change > 0.1) return TrendingUp;
    return Minus;
  };
  
  const getTrendColor = () => {
    if (weightData.history.length < 2) return COLORS.textSecondary;
    
    const lastTwo = weightData.history.slice(-2);
    const change = lastTwo[1].weight - lastTwo[0].weight;
    
    if (change < -0.1) return COLORS.success;
    if (change > 0.1) return COLORS.error;
    return COLORS.warning;
  };

  const TrendIcon = getTrendIcon();

  const handleHealthAppToggle = (value: boolean) => {
    setSyncHealthApp(value);
    if (value) {
      setShowHealthApp(true);
    }
  };

  const handleHealthAppPermission = (granted: boolean) => {
    if (!granted) {
      setSyncHealthApp(false);
    }
  };

  return (
    <View style={styles.widget}>
      <LinearGradient
        colors={['#FFFFFF', '#F8FAFF']}
        style={styles.widgetGradient}
      >
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Weight color={COLORS.blue} size={20} />
            <Text style={styles.widgetTitle}>Poids</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.addButton}>
              <Plus color={COLORS.blue} size={16} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.settingsButton} 
              onPress={() => setShowSettings(true)}
            >
              <Settings color={COLORS.textSecondary} size={18} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.currentWeightContainer}>
          <Text style={styles.currentWeight}>{weightData.current.toFixed(1)}</Text>
          <Text style={styles.weightUnit}>kg</Text>
          {TrendIcon && (
            <View style={styles.trendContainer}>
              <TrendIcon color={getTrendColor()} size={16} />
            </View>
          )}
        </View>

        <View style={styles.progressStats}>
          <View style={styles.progressItem}>
            <Text style={styles.progressLabel}>Perdu</Text>
            <Text style={[styles.progressValue, { color: COLORS.success }]}>
              -{totalLoss.toFixed(1)} kg
            </Text>
          </View>
          <View style={styles.progressDivider} />
          <View style={styles.progressItem}>
            <Text style={styles.progressLabel}>Objectif</Text>
            <Text style={[styles.progressValue, { color: COLORS.blue }]}>
              {weightData.target.toFixed(1)} kg
            </Text>
          </View>
          <View style={styles.progressDivider} />
          <View style={styles.progressItem}>
            <Text style={styles.progressLabel}>Restant</Text>
            <Text style={[styles.progressValue, { color: COLORS.textSecondary }]}>
              -{remainingToTarget.toFixed(1)} kg
            </Text>
          </View>
        </View>

        <View style={styles.progressBarContainer}>
          <View style={styles.progressBar}>
            <LinearGradient
              colors={[COLORS.success, COLORS.blue]}
              style={[
                styles.progressFill,
                { width: `${Math.min(progressPercentage, 100)}%` }
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </View>
          <Text style={styles.progressPercentage}>
            {Math.round(progressPercentage)}% de l'objectif
          </Text>
        </View>

        <Text style={styles.chartTitle}>Évolution (6 semaines)</Text>
        <WeightChart data={weightData.history} />
        
        <View style={styles.lastUpdateContainer}>
          <Text style={styles.lastUpdateText}>
            Dernière pesée: {new Date().toLocaleDateString('fr-FR')}
          </Text>
        </View>
      </LinearGradient>

      {/* Settings Modal */}
      <Modal visible={showSettings} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Options du widget</Text>
            <TouchableOpacity style={styles.closeButton} onPress={() => setShowSettings(false)}>
              <X color={COLORS.textSecondary} size={24} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Health App Sync */}
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Synch avec HealthApp</Text>
              </View>
              <Switch
                value={syncHealthApp}
                onValueChange={handleHealthAppToggle}
                trackColor={{ false: COLORS.border, true: COLORS.primary + '50' }}
                thumbColor={syncHealthApp ? COLORS.primary : COLORS.textLight}
              />
            </View>

            {/* Body Fat Percentage */}
            <TouchableOpacity style={styles.optionItem} onPress={() => setShowBodyFat(true)}>
              <View style={styles.optionInfo}>
                <Text style={styles.optionTitle}>Modifier % de graisse</Text>
              </View>
              <View style={styles.optionArrow}>
                <ChevronRight color={COLORS.primary} size={20} />
              </View>
            </TouchableOpacity>

            {/* Start Date */}
            <TouchableOpacity style={styles.optionItem} onPress={() => setShowStartDate(true)}>
              <View style={styles.optionInfo}>
                <Text style={styles.optionTitle}>Éditer date de début</Text>
              </View>
              <View style={styles.optionArrow}>
                <ChevronRight color={COLORS.primary} size={20} />
              </View>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Health App Permission Modal */}
      <HealthAppModal
        visible={showHealthApp}
        onClose={() => setShowHealthApp(false)}
        onPermissionResult={handleHealthAppPermission}
      />

      {/* Body Fat Modal */}
      <BodyFatModal
        visible={showBodyFat}
        onClose={() => setShowBodyFat(false)}
        bodyFatPercentage={bodyFatPercentage}
        setBodyFatPercentage={setBodyFatPercentage}
      />

      {/* Date Picker Modal */}
      <DatePicker
        visible={showStartDate}
        onClose={() => setShowStartDate(false)}
        onConfirm={(date) => setStartDate(date)}
        initialDate={startDate}
      />
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
    marginBottom: 20,
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.blue + '15',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.blue + '30',
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
  currentWeightContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 20,
  },
  currentWeight: {
    fontSize: 48,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -2,
  },
  weightUnit: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginLeft: 4,
    marginBottom: 8,
  },
  trendContainer: {
    marginLeft: 12,
    marginBottom: 12,
  },
  progressStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  progressItem: {
    flex: 1,
    alignItems: 'center',
  },
  progressDivider: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.border,
    marginHorizontal: 12,
  },
  progressLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  progressValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  progressBarContainer: {
    marginBottom: 20,
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  lastUpdateContainer: {
    alignItems: 'center',
  },
  lastUpdateText: {
    fontSize: 11,
    color: COLORS.textLight,
    fontWeight: '500',
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

  // Settings styles
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },

  // Option item styles
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: COLORS.background,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border + '50',
  },
  optionInfo: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  optionArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Health app permission styles
  healthPermissionTitle: {
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: '600',
  },
  toggleAllButton: {
    backgroundColor: COLORS.primary + '15',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  toggleAllText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '700',
  },
  permissionItem: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: COLORS.background,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border + '50',
  },
  permissionInfo: {
    marginBottom: 12,
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  permissionDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  allowButton: {
    backgroundColor: COLORS.primary,
  },
  denyButton: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  allowButtonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: '700',
  },
  denyButtonText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: '700',
  },

  // Date picker styles
  datePickerContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  dateColumn: {
    flex: 1,
    height: 200,
    marginHorizontal: 8,
  },
  dateItem: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  selectedDateItem: {
    backgroundColor: COLORS.primary + '15',
    borderRadius: 8,
  },
  dateText: {
    fontSize: 18,
    color: COLORS.textSecondary,
  },
  selectedDateText: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  datePickerDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginHorizontal: 20,
    marginBottom: 30,
    lineHeight: 20,
  },

  // Body fat styles
  percentageDisplay: {
    fontSize: 72,
    fontWeight: '800',
    color: COLORS.primary,
    textAlign: 'center',
    marginVertical: 20,
  },
  percentageControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
    marginBottom: 30,
  },
  percentageButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adjustmentOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: COLORS.border + '50',
  },
  adjustmentText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    marginRight: 12,
    lineHeight: 20,
  },

  // Update button
  updateButton: {
    backgroundColor: COLORS.text,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  updateButtonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: '700',
  },
});