import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { BarChart3, Settings, Plus } from 'lucide-react-native';

// KetoDiet inspired colors
const COLORS = {
  primary: '#4CAF50',
  secondary: '#81C784',
  accent: '#FF7043',
  background: '#FAFAFA',
  surface: '#FFFFFF',
  text: '#000000', // Noir pour les icônes comme dans le design
  textSecondary: '#757575',
  border: '#E0E0E0',
  iconBg: '#E8E8E8', // Gris clair pour le fond du bouton central
};

interface BottomNavigationBarProps {
  onReportsPress: () => void;
  onSettingsPress: () => void;
  onAddMealPress?: () => void; // Optionnel pour le moment
}

export default function BottomNavigationBar({ 
  onReportsPress, 
  onSettingsPress, 
  onAddMealPress 
}: BottomNavigationBarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.navigationPill}>
        {/* Bouton Rapports (Graphique) */}
        <TouchableOpacity 
          style={styles.sideButton} 
          onPress={onReportsPress}
          activeOpacity={0.7}
        >
          <BarChart3 size={22} color={COLORS.text} strokeWidth={1.5} />
        </TouchableOpacity>

        {/* Bouton Central (Plus) avec effet relief */}
        <TouchableOpacity 
          style={styles.centerButton} 
          onPress={onAddMealPress}
          activeOpacity={0.8}
        >
          <View style={styles.centerButtonInner}>
            <Plus size={20} color={COLORS.text} strokeWidth={2} />
          </View>
        </TouchableOpacity>

        {/* Bouton Paramètres */}
        <TouchableOpacity 
          style={styles.sideButton} 
          onPress={onSettingsPress}
          activeOpacity={0.7}
        >
          <Settings size={22} color={COLORS.text} strokeWidth={1.5} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    position: 'absolute',
    bottom: 30, // Position flottante au-dessus du bas
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 1000,
  },
  navigationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 28, // Très arrondi pour effet pill
    paddingHorizontal: 20,
    paddingVertical: 8,
    minHeight: 56, // Hauteur minimale mais compacte
    // Ombre subtile pour l'élévation
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sideButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  centerButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  centerButtonInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.iconBg,
    alignItems: 'center',
    justifyContent: 'center',
    // Effet de relief subtil
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
});