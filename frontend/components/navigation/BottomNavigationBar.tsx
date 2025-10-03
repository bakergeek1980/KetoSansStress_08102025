import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {
  BarChart3,
  Plus,
  Settings,
} from 'lucide-react-native';

const COLORS = {
  primary: '#4CAF50',
  secondary: '#81C784',
  accent: '#FF7043',
  background: '#FAFAFA',
  surface: '#FFFFFF',
  text: '#212121',
  textSecondary: '#757575',
  textLight: '#9E9E9E',
  border: '#E0E0E0',
};

interface BottomNavigationBarProps {
  onReportsPress: () => void;
  onSettingsPress: () => void;
}

export default function BottomNavigationBar({
  onReportsPress,
  onSettingsPress,
}: BottomNavigationBarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.navigationBar}>
        {/* Bouton Rapports */}
        <TouchableOpacity
          style={styles.navButton}
          onPress={onReportsPress}
          activeOpacity={0.7}
        >
          <View style={styles.iconContainer}>
            <BarChart3 color={COLORS.primary} size={24} />
          </View>
          <Text style={styles.navLabel}>Rapports</Text>
        </TouchableOpacity>

        {/* Bouton Paramètres */}
        <TouchableOpacity
          style={styles.navButton}
          onPress={onSettingsPress}
          activeOpacity={0.7}
        >
          <View style={styles.iconContainer}>
            <Settings color={COLORS.primary} size={24} />
          </View>
          <Text style={styles.navLabel}>Paramètres</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 20, // Safe area pour iOS
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  navigationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  navButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  iconContainer: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: COLORS.background,
  },
  navLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 4,
  },
});