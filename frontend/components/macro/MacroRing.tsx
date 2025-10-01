import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface MacroRingProps {
  label: string;
  current: number;
  target: number;
  color: string;
  unit: string;
}

export default function MacroRing({ label, current, target, color, unit }: MacroRingProps) {
  const percentage = Math.min((current / target) * 100, 100);
  const size = 80;
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
            stroke="#E5E7EB"
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
      <Text style={styles.unit}>{unit}</Text>
      <Text style={[styles.percentage, { color }]}>{Math.round(percentage)}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  targetValue: {
    fontSize: 10,
    color: '#95A5A6',
    marginTop: -2,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2C3E50',
    marginTop: 8,
    textAlign: 'center',
  },
  unit: {
    fontSize: 10,
    color: '#95A5A6',
    marginTop: 2,
  },
  percentage: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
});