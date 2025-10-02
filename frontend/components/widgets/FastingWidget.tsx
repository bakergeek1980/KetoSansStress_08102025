import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Timer, Play, Square, Clock } from 'lucide-react-native';
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
};

interface FastingWidgetProps {
  isFasting: boolean;
  startTime: Date | null;
  onStart: (time: Date) => void;
  onStop: () => void;
}

const FastingTimer = ({ 
  percentage, 
  size = 120, 
  strokeWidth = 12 
}: {
  percentage: number;
  size?: number;
  strokeWidth?: number;
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <View style={[styles.timerRing, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id="fastingGradient" cx="50%" cy="30%" r="70%">
            <Stop offset="0%" stopColor={COLORS.purple} stopOpacity="0.8" />
            <Stop offset="100%" stopColor={COLORS.pink} stopOpacity="1" />
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
          stroke="url(#fastingGradient)"
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
        <Text style={styles.timerPercentage}>
          {Math.round(percentage)}%
        </Text>
      </View>
    </View>
  );
};

export default function FastingWidget({ isFasting, startTime, onStart, onStop }: FastingWidgetProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedDuration] = useState(16); // 16 hours default

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

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

  const handleStartFasting = () => {
    const now = new Date();
    onStart(now);
  };

  const handleStopFasting = () => {
    onStop();
  };

  const stats = getFastingStats();

  const formatTime = (hours: number, minutes: number) => {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.widget}>
      <LinearGradient
        colors={['#FFFFFF', '#FEFBFF']}
        style={styles.widgetGradient}
      >
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Timer color={COLORS.purple} size={20} />
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
        <TouchableOpacity
          style={[
            styles.actionButton,
            isFasting ? styles.stopButton : styles.startButton
          ]}
          onPress={isFasting ? handleStopFasting : handleStartFasting}
        >
          <LinearGradient
            colors={
              isFasting 
                ? [COLORS.error, COLORS.accent]
                : [COLORS.purple, COLORS.pink]
            }
            style={styles.buttonGradient}
          >
            {isFasting ? (
              <Square color={COLORS.surface} size={20} fill={COLORS.surface} />
            ) : (
              <Play color={COLORS.surface} size={20} fill={COLORS.surface} />
            )}
            <Text style={styles.buttonText}>
              {isFasting ? 'Arrêter le jeûne' : 'Commencer le jeûne'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

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

        {!isFasting && (
          <View style={styles.motivationContainer}>
            <Text style={styles.motivationText}>
              💪 Prêt pour votre prochain jeûne de {selectedDuration}h ?
            </Text>
          </View>
        )}
      </LinearGradient>
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
    backgroundColor: COLORS.purple + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.purple + '30',
  },
  durationText: {
    fontSize: 12,
    color: COLORS.purple,
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
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.purple,
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
    color: COLORS.purple,
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
    color: COLORS.purple,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.border,
    marginHorizontal: 16,
  },
  motivationContainer: {
    backgroundColor: COLORS.purple + '10',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.purple + '20',
  },
  motivationText: {
    fontSize: 14,
    color: COLORS.purple,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
  },
});