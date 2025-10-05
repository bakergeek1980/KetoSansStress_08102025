import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import { usePreferences } from './PreferencesContext';

// Types des couleurs
interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  card: string;
  text: string;
  textSecondary: string;
  textLight: string;
  border: string;
  error: string;
  warning: string;
  success: string;
  info: string;
  
  // Couleurs spécifiques keto
  keto: string;
  carbs: string;
  protein: string;
  fat: string;
  fiber: string;
}

// Thème clair
const lightTheme: ColorPalette = {
  primary: '#4CAF50',
  secondary: '#81C784',
  accent: '#FF7043',
  background: '#FAFAFA',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  text: '#212121',
  textSecondary: '#757575',
  textLight: '#9E9E9E',
  border: '#E0E0E0',
  error: '#F44336',
  warning: '#FF9800',
  success: '#4CAF50',
  info: '#2196F3',
  
  // Couleurs keto
  keto: '#2E7D32',
  carbs: '#FFA726',
  protein: '#42A5F5',
  fat: '#AB47BC',
  fiber: '#66BB6A',
};

// Thème sombre
const darkTheme: ColorPalette = {
  primary: '#66BB6A',
  secondary: '#A5D6A7',
  accent: '#FF8A65',
  background: '#121212',
  surface: '#1E1E1E',
  card: '#2C2C2C',
  text: '#FFFFFF',
  textSecondary: '#CCCCCC',
  textLight: '#999999',
  border: '#404040',
  error: '#EF5350',
  warning: '#FFA726',
  success: '#66BB6A',
  info: '#42A5F5',
  
  // Couleurs keto
  keto: '#4CAF50',
  carbs: '#FFB74D',
  protein: '#64B5F6',
  fat: '#BA68C8',
  fiber: '#81C784',
};

interface ThemeContextType {
  colors: ColorPalette;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const { preferences, updatePreference } = usePreferences();
  const [isDark, setIsDark] = useState(false);
  const [systemColorScheme, setSystemColorScheme] = useState<ColorSchemeName>(
    Appearance.getColorScheme()
  );

  // Écouter les changements du thème système
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemColorScheme(colorScheme);
    });

    return () => subscription?.remove();
  }, []);

  // Calculer le thème effectif
  useEffect(() => {
    let effectiveTheme: boolean;
    
    switch (preferences.theme_preference) {
      case 'light':
        effectiveTheme = false;
        break;
      case 'dark':
        effectiveTheme = true;
        break;
      case 'system':
      default:
        effectiveTheme = systemColorScheme === 'dark';
        break;
    }
    
    setIsDark(effectiveTheme);
    
    // Mettre à jour dark_mode dans les préférences si nécessaire
    if (preferences.dark_mode !== effectiveTheme) {
      updatePreference('dark_mode', effectiveTheme);
    }
  }, [preferences.theme_preference, systemColorScheme, preferences.dark_mode, updatePreference]);

  const toggleTheme = () => {
    const newTheme = isDark ? 'light' : 'dark';
    updatePreference('theme_preference', newTheme);
  };

  const setTheme = (theme: 'light' | 'dark' | 'system') => {
    updatePreference('theme_preference', theme);
  };

  const colors = isDark ? darkTheme : lightTheme;

  const contextValue: ThemeContextType = {
    colors,
    isDark,
    toggleTheme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Hook utilitaire pour créer des styles avec le thème
export const useThemedStyles = <T extends Record<string, any>>(
  styleFactory: (colors: ColorPalette) => T
): T => {
  const { colors } = useTheme();
  return styleFactory(colors);
};

export default useTheme;