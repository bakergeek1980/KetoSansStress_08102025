import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Modal,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Timer, Play, Square, Clock, ChevronRight, X } from 'lucide-react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

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

interface FastingType {
  id: string;
  name: string;
  description: string;
  duration: number; // en heures
  icon: string;
}

const FASTING_TYPES: FastingType[] = [
  {
    id: 'circadian',
    name: 'Rythme Circadien',
    description: 'Jeûne naturel de 12h selon votre rythme biologique',
    duration: 12,
    icon: '🌙',
  },
  {
    id: '16:8',
    name: '16:8',
    description: 'Jeûne de 16h, fenêtre alimentaire de 8h',
    duration: 16,
    icon: '⏰',
  },
  {
    id: '18:6',
    name: '18:6',
    description: 'Jeûne de 18h, fenêtre alimentaire de 6h',
    duration: 18,
    icon: '⏳',
  },
  {
    id: '20:4',
    name: '20:4',
    description: 'Jeûne de 20h, fenêtre alimentaire de 4h',
    duration: 20,
    icon: '🔥',
  },
  {
    id: 'custom',
    name: 'Personnalisé',
    description: 'Définissez votre propre durée de jeûne',
    duration: 24,
    icon: '⚙️',
  },
];

interface FastingWidgetProps {
  isFasting: boolean;
  startTime: Date | null;
  onStart: (time: Date, duration: number) => void;
  onStop: () => void;
  isCollapsed?: boolean;
}

const FastingTimer = ({ 
  percentage, 
  size = 120, 
  strokeWidth = 12,
  isCollapsed = false 
}: {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  isCollapsed?: boolean;
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <View style={[styles.timerRing, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id={`fastingGradient_${isCollapsed}`} cx="50%" cy="30%" r="70%">
            <Stop offset="0%" stopColor={COLORS.primary} stopOpacity="0.8" />
            <Stop offset="100%" stopColor={COLORS.secondary} stopOpacity="1" />
          </RadialGradient>
        </Defs>
        
        {/* Background ring */}
        <Circle
          stroke="#E2E8F0"
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          opacity={0.3}
        />
        
        {/* Progress ring */}
        <Circle
          stroke={`url(#fastingGradient_${isCollapsed})`}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{
            filter: 'drop-shadow(0px 4px 12px rgba(139, 92, 246, 0.3))',
          }}
        />
      </Svg>
      
      <View style={styles.timerCenter}>
        <Text style={[styles.timerPercentage, { fontSize: isCollapsed ? 14 : 24 }]}>
          {Math.round(percentage)}%
        </Text>
      </View>
    </View>
  );
};

const FastingTypeSelector = ({ 
  visible, 
  onClose, 
  onSelect 
}: { 
  visible: boolean; 
  onClose: () => void; 
  onSelect: (type: FastingType) => void;
}) => {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Choisir un type de jeûne</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X color={COLORS.textSecondary} size={24} />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent}>
          {FASTING_TYPES.map((type) => (
            <TouchableOpacity
              key={type.id}
              style={styles.fastingTypeCard}
              onPress={() => onSelect(type)}
            >
              <View style={styles.fastingTypeIcon}>
                <Text style={styles.fastingTypeEmoji}>{type.icon}</Text>
              </View>
              <View style={styles.fastingTypeInfo}>
                <Text style={styles.fastingTypeName}>{type.name}</Text>
                <Text style={styles.fastingTypeDescription}>{type.description}</Text>
                <Text style={styles.fastingTypeDuration}>
                  {type.id === 'custom' ? 'Durée variable' : `${type.duration}h de jeûne`}
                </Text>
              </View>
              <ChevronRight color={COLORS.textLight} size={20} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
};

const FastingDetailModal = ({
  visible,
  onClose,
  fastingType,
  onStartFasting
}: {
  visible: boolean;
  onClose: () => void;
  fastingType: FastingType | null;
  onStartFasting: (duration: number, startTime: Date) => void;
}) => {
  const [customDuration, setCustomDuration] = useState(24);
  const [startTime, setStartTime] = useState(new Date());

  useEffect(() => {
    if (fastingType) {
      setCustomDuration(fastingType.duration);
      setStartTime(new Date());
    }
  }, [fastingType]);

  const getEndTime = () => {
    const end = new Date(startTime.getTime() + (fastingType?.id === 'custom' ? customDuration : fastingType?.duration || 16) * 60 * 60 * 1000);
    return end;
  };

  const formatDateTime = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    let dayText = '';
    if (date.toDateString() === today.toDateString()) {
      dayText = 'Aujourd\'hui';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      dayText = 'Demain';
    } else {
      dayText = date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    }
    
    const timeText = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    return `${dayText}, ${timeText}`;
  };

  const handleStart = () => {
    if (fastingType) {
      const duration = fastingType.id === 'custom' ? customDuration : fastingType.duration;
      onStartFasting(duration, startTime);
      onClose();
    }
  };

  if (!fastingType) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{fastingType.name}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X color={COLORS.textSecondary} size={24} />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent}>
          <View style={styles.fastingDetail}>
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Durée de l'objectif</Text>
              <Text style={styles.detailValue}>
                {fastingType.id === 'custom' ? `${customDuration}h` : `${fastingType.duration}h`}
              </Text>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Début</Text>
              <Text style={styles.detailValue}>{formatDateTime(startTime)}</Text>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Fin</Text>
              <Text style={styles.detailValue}>{formatDateTime(getEndTime())}</Text>
            </View>

            {fastingType.id === 'custom' && (
              <View style={styles.customControls}>
                <Text style={styles.customLabel}>Durée personnalisée (heures)</Text>
                <View style={styles.durationControls}>
                  <TouchableOpacity 
                    style={styles.durationButton}
                    onPress={() => setCustomDuration(Math.max(1, customDuration - 1))}
                  >
                    <Text style={styles.durationButtonText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.durationDisplay}>{customDuration}h</Text>
                  <TouchableOpacity 
                    style={styles.durationButton}
                    onPress={() => setCustomDuration(Math.min(48, customDuration + 1))}
                  >
                    <Text style={styles.durationButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <TouchableOpacity style={styles.startFastingButton} onPress={handleStart}>
              <LinearGradient
                colors={['#4CAF50', '#FFF176']}
                style={styles.startButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Play color={COLORS.surface} size={20} fill={COLORS.surface} />
                <Text style={styles.startButtonText}>Commencer le jeûne</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

export default function FastingWidget({ isFasting, startTime, onStart, onStop, isCollapsed = false, currentDuration = 16 }: FastingWidgetProps & { currentDuration?: number }) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedDuration, setSelectedDuration] = useState(currentDuration);
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedFastingType, setSelectedFastingType] = useState<FastingType | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setSelectedDuration(currentDuration);
  }, [currentDuration]);

  const getFastingStats = () => {
    if (!isFasting || !startTime) {
      return {
        elapsedHours: 0,
        elapsedMinutes: 0,
        remainingHours: selectedDuration,
        remainingMinutes: 0,
        percentage: 0,
        endTime: null,
      };
    }

    const elapsed = currentTime.getTime() - startTime.getTime();
    const elapsedHours = Math.floor(elapsed / (1000 * 60 * 60));
    const elapsedMinutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60));
    
    const totalMinutes = selectedDuration * 60;
    const elapsedTotalMinutes = Math.floor(elapsed / (1000 * 60));
    const percentage = Math.min((elapsedTotalMinutes / totalMinutes) * 100, 100);
    
    const endTime = new Date(startTime.getTime() + selectedDuration * 60 * 60 * 1000);
    const remaining = endTime.getTime() - currentTime.getTime();
    const remainingHours = Math.max(Math.floor(remaining / (1000 * 60 * 60)), 0);
    const remainingMinutes = Math.max(Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60)), 0);

    return {
      elapsedHours,
      elapsedMinutes,
      remainingHours,
      remainingMinutes,
      percentage,
      endTime,
    };
  };

  const handleFastingTypeSelect = (type: FastingType) => {
    setSelectedFastingType(type);
    setShowTypeSelector(false);
    setShowDetailModal(true);
  };

  const handleStartFasting = (duration: number, startDateTime: Date) => {
    setSelectedDuration(duration);
    onStart(startDateTime, duration);
  };

  const handleStopFasting = () => {
    onStop();
  };

  const stats = getFastingStats();

  const formatTime = (hours: number, minutes: number) => {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  // Version collapsée
  if (isCollapsed) {
    return (
      <View style={styles.collapsedWidget}>
        <LinearGradient
          colors={['#FFFFFF', '#FEFBFF']}
          style={styles.collapsedContainer}
        >
          <View style={styles.collapsedContent}>
            <Timer color={COLORS.primary} size={16} />
            <View style={styles.collapsedProgressSection}>
              <FastingTimer percentage={stats.percentage} size={40} strokeWidth={4} isCollapsed={true} />
              <Text style={styles.collapsedText}>
                {isFasting ? `${formatTime(stats.elapsedHours, stats.elapsedMinutes)}` : 'Pas de jeûne'}
              </Text>
            </View>
            <Text style={styles.collapsedPercentage}>
              {isFasting ? `${Math.round(stats.percentage)}%` : '0%'}
            </Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.widget}>
      <LinearGradient
        colors={['#FFFFFF', '#FEFBFF']}
        style={styles.widgetGradient}
      >
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Timer color={COLORS.primary} size={20} />
            <Text style={styles.widgetTitle}>Jeûne Intermittent</Text>
          </View>
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>{selectedDuration}h</Text>
          </View>
        </View>

        {/* Timer display */}
        <View style={styles.timerContainer}>
          <FastingTimer percentage={stats.percentage} />
          
          <View style={styles.timeDisplay}>
            <Text style={styles.elapsedTime}>
              {formatTime(stats.elapsedHours, stats.elapsedMinutes)}
            </Text>
            <Text style={styles.timeLabel}>Temps écoulé</Text>
            
            {isFasting && (
              <View style={styles.remainingContainer}>
                <Text style={styles.remainingTime}>
                  {formatTime(stats.remainingHours, stats.remainingMinutes)} restant
                </Text>
                {stats.endTime && (
                  <View style={styles.endTimeContainer}>
                    <Clock color={COLORS.textLight} size={12} />
                    <Text style={styles.endTime}>
                      Fin à {stats.endTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Action button */}
        {isFasting ? (
          <TouchableOpacity
            style={[styles.actionButton, styles.stopButton]}
            onPress={handleStopFasting}
          >
            <LinearGradient
              colors={[COLORS.error, COLORS.accent]}
              style={styles.buttonGradient}
            >
              <Square color={COLORS.surface} size={20} fill={COLORS.surface} />
              <Text style={styles.buttonText}>Arrêter le jeûne</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.actionButton, styles.startButton]}
            onPress={() => setShowTypeSelector(true)}
          >
            <LinearGradient
              colors={['#4CAF50', '#FFF176']}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Play color={COLORS.surface} size={20} fill={COLORS.surface} />
              <Text style={styles.buttonText}>Commencer le jeûne</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Quick stats */}
        {isFasting && (
          <View style={styles.quickStats}>
            <View style={styles.quickStat}>
              <Text style={styles.quickStatLabel}>Phase</Text>
              <Text style={styles.quickStatValue}>
                {stats.elapsedHours < 12 ? 'Digestion' : 
                 stats.elapsedHours < 16 ? 'Cétose' : 
                 'Autophagie'}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.quickStat}>
              <Text style={styles.quickStatLabel}>Bénéfices</Text>
              <Text style={styles.quickStatValue}>
                {stats.elapsedHours < 8 ? 'Début' : 
                 stats.elapsedHours < 16 ? 'Actifs' : 
                 'Maximaux'}
              </Text>
            </View>
          </View>
        )}
      </LinearGradient>

      {/* Modals */}
      <FastingTypeSelector
        visible={showTypeSelector}
        onClose={() => setShowTypeSelector(false)}
        onSelect={handleFastingTypeSelect}
      />

      <FastingDetailModal
        visible={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        fastingType={selectedFastingType}
        onStartFasting={handleStartFasting}
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
  durationBadge: {
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  durationText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  timerRing: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  timerCenter: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerPercentage: {
    fontWeight: '800',
    color: COLORS.primary,
  },
  timeDisplay: {
    flex: 1,
  },
  elapsedTime: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -1,
    marginBottom: 4,
  },
  timeLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginBottom: 8,
  },
  remainingContainer: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 8,
  },
  remainingTime: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  endTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  endTime: {
    fontSize: 12,
    color: COLORS.textLight,
    marginLeft: 4,
    fontWeight: '500',
  },
  actionButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  startButton: {},
  stopButton: {},
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  buttonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  quickStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  quickStat: {
    flex: 1,
    alignItems: 'center',
  },
  quickStatLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  quickStatValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.border,
    marginHorizontal: 16,
  },

  // Collapsed styles
  collapsedWidget: {
    backgroundColor: COLORS.surface,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  collapsedContainer: {
    borderRadius: 8,
  },
  collapsedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  collapsedProgressSection: {
    flex: 1,
    marginHorizontal: 12,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  collapsedText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  collapsedPercentage: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '700',
    minWidth: 35,
    textAlign: 'right',
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
  fastingTypeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.background,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border + '50',
  },
  fastingTypeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  fastingTypeEmoji: {
    fontSize: 20,
  },
  fastingTypeInfo: {
    flex: 1,
  },
  fastingTypeName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  fastingTypeDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 4,
    lineHeight: 18,
  },
  fastingTypeDuration: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },

  // Detail modal styles
  fastingDetail: {
    flex: 1,
  },
  detailSection: {
    marginBottom: 24,
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 18,
    color: COLORS.text,
    fontWeight: '700',
  },
  customControls: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: COLORS.background,
    borderRadius: 16,
  },
  customLabel: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: 12,
  },
  durationControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationButtonText: {
    color: COLORS.surface,
    fontSize: 18,
    fontWeight: '700',
  },
  durationDisplay: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginHorizontal: 24,
    minWidth: 60,
    textAlign: 'center',
  },
  startFastingButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 20,
  },
  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  startButtonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
});