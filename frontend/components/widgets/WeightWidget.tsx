import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Weight, TrendingUp, TrendingDown, Minus, Plus } from 'lucide-react-native';
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
        
        {/* Area under curve */}
        <Path d={areaData} fill="url(#weightGradient)" />
        
        {/* Line */}
        <Path 
          d={pathData} 
          stroke={COLORS.blue} 
          strokeWidth="2" 
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Points */}
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
          <TouchableOpacity style={styles.addButton}>
            <Plus color={COLORS.blue} size={16} />
          </TouchableOpacity>
        </View>

        {/* Current weight display */}
        <View style={styles.currentWeightContainer}>
          <Text style={styles.currentWeight}>{weightData.current.toFixed(1)}</Text>
          <Text style={styles.weightUnit}>kg</Text>
          {TrendIcon && (
            <View style={styles.trendContainer}>
              <TrendIcon color={getTrendColor()} size={16} />
            </View>
          )}
        </View>

        {/* Progress stats */}
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

        {/* Progress bar */}
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

        {/* Weight chart */}
        <Text style={styles.chartTitle}>Évolution (6 semaines)</Text>
        <WeightChart data={weightData.history} />
        
        {/* Last update */}
        <View style={styles.lastUpdateContainer}>
          <Text style={styles.lastUpdateText}>
            Dernière pesée: {new Date().toLocaleDateString('fr-FR')}
          </Text>
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
});