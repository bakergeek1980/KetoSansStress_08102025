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
};

interface WaterProgressWidgetProps {
  current: number;
  target: number;
  onAddWater: (amount: number) => void;
}

const WaveAnimation = ({ percentage }: { percentage: number }) => {
  const barWidth = width - 64;
  const barHeight = 24;
  const waveHeight = 4;
  const fillWidth = (barWidth * percentage) / 100;
  
  // Simplified wave path
  const wavePath = `M 0 ${barHeight/2} Q ${fillWidth/4} ${barHeight/2 - waveHeight} ${fillWidth/2} ${barHeight/2} T ${fillWidth} ${barHeight/2} V ${barHeight} H 0 Z`;
  
  return (
    <Svg width={barWidth} height={barHeight} style={styles.waveSvg}>
      <Defs>
        <SvgLinearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor={COLORS.lightBlue} stopOpacity="0.8" />
          <Stop offset="100%" stopColor={COLORS.blue} stopOpacity="1" />
        </SvgLinearGradient>
      </Defs>
      <Path d={wavePath} fill="url(#waveGradient)" />
    </Svg>
  );
};

export default function WaterProgressWidget({ current, target, onAddWater }: WaterProgressWidgetProps) {
  const percentage = Math.min((current / target) * 100, 100);
  const remaining = Math.max(target - current, 0);
  
  const quickAmounts = [250, 500, 750];

  return (
    <View style={styles.widget}>
      <LinearGradient
        colors={['#FFFFFF', '#F0F9FF']}
        style={styles.widgetGradient}
      >
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Droplet color={COLORS.blue} size={20} />
            <Text style={styles.widgetTitle}>Hydratation</Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={styles.progressBackground} />
            <WaveAnimation percentage={percentage} />
          </View>
          
          <View style={styles.progressLabels}>
            <Text style={styles.currentText}>{current}ml</Text>
            <Text style={styles.targetText}>{target}ml</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{current}ml</Text>
            <Text style={styles.statLabel}>Consommé</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: COLORS.textLight }]}>{remaining}ml</Text>
            <Text style={styles.statLabel}>Restant</Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          {quickAmounts.map((amount) => (
            <TouchableOpacity
              key={amount}
              style={styles.quickButton}
              onPress={() => onAddWater(amount)}
            >
              <Text style={styles.quickButtonText}>+{amount}ml</Text>
            </TouchableOpacity>
          ))}
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
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 24,
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
  },
  waveSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  currentText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.blue,
  },
  targetText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: COLORS.border,
    marginHorizontal: 16,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickButton: {
    flex: 1,
    backgroundColor: COLORS.blue + '15',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.blue + '30',
  },
  quickButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.blue,
  },
});