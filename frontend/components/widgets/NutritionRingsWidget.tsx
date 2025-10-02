import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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

interface NutritionRingsWidgetProps {
  dailySummary: any;
  user: any;
  isCollapsed?: boolean;
}

interface MacroRingProps {
  label: string;
  current: number;
  target: number;
  color: string;
  gradientColors: string[];
  size: number;
  strokeWidth: number;
}

const MacroRing = ({ label, current, target, color, gradientColors, size, strokeWidth }: MacroRingProps) => {
  const percentage = Math.min((current / target) * 100, 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <View style={[styles.ringContainer, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.svg}>
        <Defs>
          <RadialGradient id={`gradient_${label}`} cx="50%" cy="30%" r="70%">
            <Stop offset="0%" stopColor={gradientColors[0]} stopOpacity="0.8" />
            <Stop offset="100%" stopColor={gradientColors[1]} stopOpacity="1" />
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
          stroke={`url(#gradient_${label})`}
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
            filter: 'drop-shadow(0px 2px 8px rgba(0, 0, 0, 0.15))',
          }}
        />
      </Svg>
      
      <View style={styles.ringCenter}>
        <Text style={[styles.percentage, { color }]}>{Math.round(percentage)}%</Text>
        <Text style={styles.ringLabel}>{label}</Text>
        <Text style={styles.ringValue}>{Math.round(current)}/{Math.round(target)}</Text>
      </View>
    </View>
  );
};

export default function NutritionRingsWidget({ dailySummary, user, isCollapsed = false }: NutritionRingsWidgetProps) {
  const macros = [
    {
      label: 'Calories',
      current: dailySummary?.totals?.calories || 0,
      target: dailySummary?.targets?.calories || 2000,
      color: COLORS.accent,
      gradientColors: ['#FF8A65', '#FF7043'],
    },
    {
      label: 'Glucides',
      current: dailySummary?.totals?.net_carbs || 0,
      target: dailySummary?.targets?.carbs || 25,
      color: COLORS.error,
      gradientColors: ['#FF6B6B', '#EF4444'],
    },
    {
      label: 'Protéines',
      current: dailySummary?.totals?.proteins || 0,
      target: dailySummary?.targets?.proteins || 100,
      color: COLORS.blue,
      gradientColors: ['#60A5FA', '#3B82F6'],
    },
    {
      label: 'Lipides',
      current: dailySummary?.totals?.fats || 0,
      target: dailySummary?.targets?.fats || 150,
      color: COLORS.success,
      gradientColors: ['#34D399', '#10B981'],
    },
  ];

  return (
    <View style={styles.widget}>
      <LinearGradient
        colors={['#FFFFFF', '#F8FAFC']}
        style={styles.widgetGradient}
      >
        <Text style={styles.widgetTitle}>Nutrition Aujourd'hui</Text>
        
        <View style={styles.ringsGrid}>
          {macros.map((macro, index) => (
            <MacroRing
              key={macro.label}
              label={macro.label}
              current={macro.current}
              target={macro.target}
              color={macro.color}
              gradientColors={macro.gradientColors}
              size={75}
              strokeWidth={6}
            />
          ))}
        </View>
        
        {/* Status indicator */}
        <View style={styles.statusContainer}>
          <View style={[
            styles.statusDot, 
            { backgroundColor: dailySummary?.keto_status === 'excellent' ? COLORS.success : 
                               dailySummary?.keto_status === 'attention' ? COLORS.warning : 
                               COLORS.error }
          ]} />
          <Text style={styles.statusText}>
            {dailySummary?.keto_status === 'excellent' ? 'Excellent ! En cétose' :
             dailySummary?.keto_status === 'attention' ? 'Attention aux glucides' :
             'Limite dépassée'}
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
  widgetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  ringsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: 16,
    marginBottom: 20,
  },
  ringContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  svg: {
    position: 'absolute',
  },
  ringCenter: {
    alignItems: 'center',
  },
  percentage: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  ringLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginBottom: 1,
  },
  ringValue: {
    fontSize: 8,
    color: COLORS.textLight,
    fontWeight: '500',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
});