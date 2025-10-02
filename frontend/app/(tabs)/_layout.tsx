import React from 'react';
import { Tabs } from 'expo-router';
import { Home, Camera, Utensils, BarChart3, User } from 'lucide-react-native';

// KetoDiet inspired colors
const COLORS = {
  primary: '#4CAF50',
  secondary: '#81C784',
  background: '#FAFAFA',
  surface: '#FFFFFF',
  text: '#212121',
  textSecondary: '#757575',
  textLight: '#9E9E9E',
};

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textLight,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopWidth: 1,
          borderTopColor: '#E0E0E0',
          height: 85,
          paddingBottom: 25,
          paddingTop: 10,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 3.84,
          elevation: 5,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color, size }) => (
            <Home color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="scanner"
        options={{
          title: 'Scanner',
          tabBarIcon: ({ color, size }) => (
            <Camera color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="meals"
        options={{
          title: 'Repas',
          tabBarIcon: ({ color, size }) => (
            <Utensils color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progrès',
          tabBarIcon: ({ color, size }) => (
            <BarChart3 color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => (
            <User color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}