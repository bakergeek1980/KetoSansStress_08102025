import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Droplet, Plus } from 'lucide-react-native';
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
  blue: '#3B82F6',
  lightBlue: '#60A5FA',
  border: '#E2E8F0',
};

interface WaterProgressWidgetProps {
  current: number;
  target: number;
  onAddWater: (amount: number) => void;
  isCollapsed?: boolean;
}

const WaveAnimation = ({ percentage, isCollapsed = false }: { percentage: number; isCollapsed?: boolean }) => {
  const barWidth = isCollapsed ? width - 32 : width - 64;
  const barHeight = isCollapsed ? 16 : 24;
  const waveHeight = isCollapsed ? 2 : 4;
  const fillWidth = (barWidth * percentage) / 100;
  
  // Simplified wave path for both states
  const wavePoints = [
    0, barHeight / 2,
    fillWidth * 0.25, barHeight / 2 - waveHeight,
    fillWidth * 0.5, barHeight / 2,
    fillWidth * 0.75, barHeight / 2 + waveHeight,
    fillWidth, barHeight / 2,
  ];

  const wavePath = `M 0 ${barHeight / 2} Q ${wavePoints[2]} ${wavePoints[3]} ${wavePoints[4]} ${wavePoints[5]} Q ${wavePoints[6]} ${wavePoints[7]} ${fillWidth} ${barHeight / 2} L ${fillWidth} ${barHeight} L 0 ${barHeight} Z`;

  return (
    <View style={[styles.progressBarContainer, { width: barWidth, height: barHeight }]}>
      <Svg width={barWidth} height={barHeight}>
        <Defs>
          <SvgLinearGradient id={`waterGradient_${isCollapsed ? 'collapsed' : 'expanded'}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={COLORS.lightBlue} stopOpacity="0.8" />
            <Stop offset="50%" stopColor={COLORS.blue} stopOpacity="0.9" />
            <Stop offset="100%" stopColor={COLORS.blue} stopOpacity="1" />
          </SvgLinearGradient>
        </Defs>
        
        {/* Background bar */}
        <Path
          d={`M 0 0 L ${barWidth} 0 L ${barWidth} ${barHeight} L 0 ${barHeight} Z`}
          fill="#E2E8F0"
          opacity="0.3"
        />
        
        {/* Water fill with wave animation */}
        {fillWidth > 0 && (
          <Path
            d={wavePath}
            fill={`url(#waterGradient_${isCollapsed ? 'collapsed' : 'expanded'})`}
            style={{
              filter: 'drop-shadow(0px 2px 4px rgba(59, 130, 246, 0.3))',
            }}
          />
        )}
      </Svg>
    </View>
  );
};

export default function WaterProgressWidget({ 
  current, 
  target, 
  onAddWater, 
  isCollapsed = false 
}: WaterProgressWidgetProps) {
  const percentage = Math.min((current / target) * 100, 100);
  const remaining = Math.max(target - current, 0);

  // Collapsed state - just the progress bar
  if (isCollapsed) {
    return (
      <View style={styles.collapsedWidget}>
        <LinearGradient
          colors={['#FFFFFF', '#FEFEFE']}
          style={styles.collapsedContainer}
        >
          <View style={styles.collapsedContent}>
            <Droplet color={COLORS.blue} size={16} />
            <View style={styles.collapsedProgressSection}>
              <WaveAnimation percentage={percentage} isCollapsed={true} />
              <Text style={styles.collapsedText}>
                {current}ml / {target}ml
              </Text>
            </View>
            <Text style={styles.collapsedPercentage}>
              {Math.round(percentage)}%
            </Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  // Expanded state - full widget
  return (
    <View style={styles.widget}>
      <LinearGradient
        colors={['#FFFFFF', '#F8FBFF']}
        style={styles.widgetGradient}
      >
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Droplet color={COLORS.blue} size={20} />
            <Text style={styles.widgetTitle}>Hydratation</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={() => onAddWater(250)}>
            <Plus color={COLORS.blue} size={16} />
          </TouchableOpacity>
        </View>

        {/* Current progress display */}
        <View style={styles.progressDisplay}>
          <Text style={styles.currentAmount}>{current}</Text>
          <Text style={styles.unit}>ml</Text>
          <Text style={styles.targetText}>sur {target}ml</Text>
        </View>

        {/* Wave progress bar */}
        <View style={styles.progressSection}>
          <WaveAnimation percentage={percentage} />
          <View style={styles.progressLabels}>
            <Text style={styles.progressLabel}>0ml</Text>
            <Text style={styles.progressPercentage}>{Math.round(percentage)}%</Text>
            <Text style={styles.progressLabel}>{target}ml</Text>
          </View>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{Math.round(percentage)}%</Text>
            <Text style={styles.statLabel}>Complété</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{remaining}ml</Text>
            <Text style={styles.statLabel}>Restant</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{Math.ceil(remaining / 250)}</Text>
            <Text style={styles.statLabel}>Verres</Text>
          </View>
        </View>

        {/* Quick add buttons */}
        <View style={styles.quickAddRow}>
          <TouchableOpacity 
            style={styles.quickAddButton} 
            onPress={() => onAddWater(150)}
          >
            <Text style={styles.quickAddText}>+150ml</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickAddButton} 
            onPress={() => onAddWater(250)}
          >
            <Text style={styles.quickAddText}>+250ml</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickAddButton} 
            onPress={() => onAddWater(500)}
          >
            <Text style={styles.quickAddText}>+500ml</Text>
          </TouchableOpacity>
        </View>
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
  progressDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 20,
  },
  currentAmount: {
    fontSize: 48,
    fontWeight: '800',
    color: COLORS.blue,
    letterSpacing: -2,
  },
  unit: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginLeft: 4,
    marginBottom: 8,
  },
  targetText: {
    fontSize: 16,
    color: COLORS.textLight,
    marginLeft: 12,
    marginBottom: 12,
  },
  progressSection: {
    marginBottom: 20,
  },
  progressBarContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
    backgroundColor: '#F1F5F9',
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    fontWeight: '500',
  },
  progressPercentage: {
    fontSize: 14,
    color: COLORS.blue,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.border,
    marginHorizontal: 12,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  quickAddRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickAddButton: {
    flex: 1,
    backgroundColor: COLORS.blue + '15',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.blue + '20',
  },
  quickAddText: {
    fontSize: 13,
    color: COLORS.blue,
    fontWeight: '600',
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
  },
  collapsedText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginTop: 4,
  },
  collapsedPercentage: {
    fontSize: 12,
    color: COLORS.blue,
    fontWeight: '700',
    minWidth: 35,
    textAlign: 'right',
  },
});