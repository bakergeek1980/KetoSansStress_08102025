import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
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
  border: '#E2E8F0',
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
  isCollapsed?: boolean;
}

const MacroRing = ({ label, current, target, color, gradientColors, size, strokeWidth, isCollapsed = false }: MacroRingProps) => {
  const percentage = Math.min((current / target) * 100, 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  
  // For collapsed state, show 3/4 circle (270 degrees)
  const maxStroke = isCollapsed ? circumference * 0.75 : circumference;
  const strokeDasharray = isCollapsed ? `${maxStroke} ${circumference}` : circumference;
  const strokeDashoffset = maxStroke - (percentage / 100) * maxStroke;

  return (
    <View style={[styles.ringContainer, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.svg}>
        <Defs>
          <RadialGradient id={`gradient_${label}_${isCollapsed}`} cx="50%" cy="30%" r="70%">
            <Stop offset="0%" stopColor={gradientColors[0]} stopOpacity="0.8" />
            <Stop offset="100%" stopColor={gradientColors[1]} stopOpacity="1" />
          </RadialGradient>
        </Defs>
        
        {/* Background circle/arc */}
        <Circle
          stroke="#E2E8F0"
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          strokeLinecap="round"
          opacity={0.3}
          transform={isCollapsed ? `rotate(-135 ${size / 2} ${size / 2})` : `rotate(-90 ${size / 2} ${size / 2})`}
        />
        
        {/* Progress circle/arc */}
        <Circle
          stroke={`url(#gradient_${label}_${isCollapsed})`}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={isCollapsed ? `rotate(-135 ${size / 2} ${size / 2})` : `rotate(-90 ${size / 2} ${size / 2})`}
          style={{
            filter: `drop-shadow(0px 2px 6px ${color}40)`,
          }}
        />
      </Svg>
      
      <View style={styles.ringCenter}>
        <Text style={[styles.ringPercentage, { color, fontSize: isCollapsed ? 14 : 18 }]}>
          {Math.round(percentage)}%
        </Text>
        {!isCollapsed && (
          <Text style={styles.ringLabel}>{label}</Text>
        )}
        {isCollapsed && (
          <Text style={styles.ringTarget}>{target}</Text>
        )}
      </View>
    </View>
  );
};

// Macro box component for expanded view
const MacroBox = ({ label, current, target, color, gradientColors }: MacroRingProps) => {
  const remaining = Math.max(target - current, 0);
  
  // Get the correct unit based on the macro type
  const getUnit = (macroLabel: string) => {
    return macroLabel === 'Calories' ? 'cal' : 'g';
  };
  
  const unit = getUnit(label);
  
  return (
    <View style={styles.macroBox}>
      <LinearGradient
        colors={[color + '10', color + '05']}
        style={styles.macroBoxGradient}
      >
        <MacroRing
          label={label}
          current={current}
          target={target}
          color={color}
          gradientColors={gradientColors}
          size={80}
          strokeWidth={6}
        />
        
        <View style={styles.macroStats}>
          <Text style={styles.macroLabel}>{label}</Text>
          <View style={styles.macroValues}>
            <Text style={styles.macroConsumed}>{Math.round(current)}{unit}</Text>
            <View style={styles.separator} />
            <Text style={styles.macroRemaining}>reste {Math.round(remaining)}{unit}</Text>
          </View>
        </View>
      </LinearGradient>
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

  // Collapsed view - horizontal layout with mini rings
  if (isCollapsed) {
    return (
      <View style={styles.collapsedWidget}>
        <LinearGradient
          colors={['#FFFFFF', '#FEFEFE']}
          style={styles.collapsedContainer}
        >
          {macros.map((macro, index) => (
            <View key={macro.label} style={styles.collapsedMacro}>
              <MacroRing
                {...macro}
                size={50}
                strokeWidth={4}
                isCollapsed={true}
              />
              <Text style={styles.collapsedLabel}>{macro.label}</Text>
            </View>
          ))}
        </LinearGradient>
      </View>
    );
  }

  // Expanded view - 2x2 grid layout with detailed boxes
  return (
    <View style={styles.widget}>
      <LinearGradient
        colors={['#FFFFFF', '#F8FAFC']}
        style={styles.widgetGradient}
      >
        <Text style={styles.widgetTitle}>Nutrition Aujourd'hui</Text>
        
        {/* Row 1: Calories, Glucides */}
        <View style={styles.macroRow}>
          <MacroBox {...macros[0]} />
          <MacroBox {...macros[1]} />
        </View>
        
        {/* Row 2: Protéines, Lipides */}
        <View style={styles.macroRow}>
          <MacroBox {...macros[2]} />
          <MacroBox {...macros[3]} />
        </View>

        {/* Status indicator */}
        <View style={styles.statusContainer}>
          <View style={[
            styles.statusDot, 
            { backgroundColor: dailySummary?.keto_status === 'excellent' ? COLORS.success : COLORS.warning }
          ]} />
          <Text style={styles.statusText}>
            {dailySummary?.keto_status === 'excellent' 
              ? 'Objectifs atteints' 
              : 'En cours de progression'}
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
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  macroRow: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 12,
  },
  macroBox: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  macroBoxGradient: {
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border + '50',
    borderRadius: 16,
  },
  macroStats: {
    marginTop: 8,
    alignItems: 'center',
    width: '100%',
  },
  macroLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  macroValues: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  macroConsumed: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  separator: {
    width: 1,
    height: 12,
    backgroundColor: COLORS.border,
    marginHorizontal: 8,
  },
  macroRemaining: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  
  // Ring styles
  ringContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  svg: {
    position: 'absolute',
  },
  ringCenter: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringPercentage: {
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  ringLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  ringTarget: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginTop: 1,
  },
  
  // Collapsed styles
  collapsedWidget: {
    backgroundColor: COLORS.surface,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  collapsedContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  collapsedMacro: {
    alignItems: 'center',
    flex: 1,
  },
  collapsedLabel: {
    fontSize: 9,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  
  // Status styles
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border + '50',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  
  // Info container styles
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.blue + '08',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.blue,
  },
  infoIcon: {
    marginRight: 8,
    marginTop: 1,
  },
  infoIconText: {
    fontSize: 14,
  },
  infoText: {
    flex: 1,
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 16,
    fontWeight: '500',
  },
});