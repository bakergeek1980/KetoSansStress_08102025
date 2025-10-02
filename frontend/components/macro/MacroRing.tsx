import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

// KetoDiet inspired colors
const COLORS = {
  primary: '#4CAF50',
  secondary: '#81C784',
  background: '#FAFAFA',
  surface: '#FFFFFF',
  text: '#212121',
  textSecondary: '#757575',
  textLight: '#9E9E9E',
  divider: '#E0E0E0',
};

interface MacroRingProps {
  label: string;
  current: number;
  target: number;
  color: string;
  unit: string;
}

export default function MacroRing({ label, current, target, color, unit }: MacroRingProps) {
  const percentage = Math.min((current / target) * 100, 100);
  const size = 90;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <View style={styles.container}>
      <View style={styles.ringContainer}>
        <Svg width={size} height={size} style={styles.svg}>
          {/* Ring de fond */}
          <Circle
            stroke={COLORS.divider}
            fill="none"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
          />
          {/* Ring de progression */}
          <Circle
            stroke={color}
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
        <View style={styles.textContainer}>
          <Text style={styles.currentValue}>{Math.round(current)}</Text>
          <Text style={styles.targetValue}>/{Math.round(target)}</Text>
        </View>
      </View>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.percentage}>{Math.round(percentage)}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    minWidth: 90,
  },
  ringContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  svg: {
    transform: [{ rotate: '0deg' }],
  },
  textContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  currentValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  targetValue: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: -2,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 8,
    textAlign: 'center',
  },
  percentage: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});