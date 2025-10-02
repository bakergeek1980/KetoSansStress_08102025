import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Utensils, Plus, Copy, Clock } from 'lucide-react-native';

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
  blue: '#3B82F6',
  purple: '#8B5CF6',
};

interface Meal {
  id: string;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  name: string;
  time?: string;
  calories?: number;
  hasItems: boolean;
}

interface MealsWidgetProps {
  userEmail: string;
}

const mealTypeIcons = {
  breakfast: '🌅',
  lunch: '🌞',
  dinner: '🌙',
  snack: '🍎',
};

const mealTypeLabels = {
  breakfast: 'Petit-déjeuner',
  lunch: 'Déjeuner',
  dinner: 'Dîner',
  snack: 'Collation',
};

const mealTypeColors = {
  breakfast: COLORS.warning,
  lunch: COLORS.success,
  dinner: COLORS.purple,
  snack: COLORS.blue,
};

const MealItem = ({ meal, onAddFood, onCopyPreviousDay }: { 
  meal: Meal; 
  onAddFood: (mealType: string) => void;
  onCopyPreviousDay: (mealType: string) => void;
}) => {
  return (
    <View style={styles.mealItem}>
      <LinearGradient
        colors={[meal.hasItems ? COLORS.surface : '#F8FAFC', COLORS.surface]}
        style={styles.mealGradient}
      >
        <View style={styles.mealHeader}>
          <View style={styles.mealInfo}>
            <View style={[styles.mealIcon, { backgroundColor: mealTypeColors[meal.type] + '15' }]}>
              <Text style={styles.mealEmoji}>{mealTypeIcons[meal.type]}</Text>
            </View>
            <View style={styles.mealDetails}>
              <Text style={styles.mealName}>{mealTypeLabels[meal.type]}</Text>
              {meal.time && (
                <View style={styles.timeContainer}>
                  <Clock color={COLORS.textLight} size={12} />
                  <Text style={styles.mealTime}>{meal.time}</Text>
                </View>
              )}
              {meal.calories && (
                <Text style={styles.mealCalories}>{meal.calories} kcal</Text>
              )}
            </View>
          </View>
          
          <View style={styles.mealActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.copyButton]}
              onPress={() => onCopyPreviousDay(meal.type)}
            >
              <Copy color={COLORS.textSecondary} size={14} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.addButton]}
              onPress={() => onAddFood(meal.type)}
            >
              <Plus color={COLORS.surface} size={16} />
            </TouchableOpacity>
          </View>
        </View>
        
        {meal.hasItems && (
          <View style={styles.mealContent}>
            <Text style={styles.mealItemsText}>• Œufs brouillés aux épinards</Text>
            <Text style={styles.mealItemsText}>• Avocat grillé</Text>
          </View>
        )}
        
        {!meal.hasItems && (
          <View style={styles.emptyMeal}>
            <Text style={styles.emptyMealText}>Aucun aliment ajouté</Text>
          </View>
        )}
      </LinearGradient>
    </View>
  );
};

export default function MealsWidget({ userEmail }: MealsWidgetProps) {
  const [meals, setMeals] = useState<Meal[]>([
    {
      id: '1',
      type: 'breakfast',
      name: 'Petit-déjeuner',
      time: '8:30',
      calories: 420,
      hasItems: true,
    },
    {
      id: '2',
      type: 'lunch',
      name: 'Déjeuner',
      hasItems: false,
    },
    {
      id: '3',
      type: 'dinner',
      name: 'Dîner',
      hasItems: false,
    },
    {
      id: '4',
      type: 'snack',
      name: 'Collation',
      hasItems: false,
    },
  ]);

  const handleAddFood = (mealType: string) => {
    console.log('Adding food to:', mealType);
    // Navigate to food scanner or search
  };

  const handleCopyPreviousDay = (mealType: string) => {
    console.log('Copying previous day meal:', mealType);
    // Copy meal from previous day
  };

  const getTotalCalories = () => {
    return meals.reduce((total, meal) => total + (meal.calories || 0), 0);
  };

  const getMealsCount = () => {
    return meals.filter(meal => meal.hasItems).length;
  };

  return (
    <View style={styles.widget}>
      <LinearGradient
        colors={['#FFFFFF', '#FEFEFE']}
        style={styles.widgetGradient}
      >
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Utensils color={COLORS.success} size={20} />
            <Text style={styles.widgetTitle}>Mes Repas</Text>
          </View>
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryText}>{getMealsCount()}/4 repas</Text>
            <Text style={styles.caloriesText}>{getTotalCalories()} kcal</Text>
          </View>
        </View>

        <FlatList
          data={meals}
          renderItem={({ item }) => (
            <MealItem
              meal={item}
              onAddFood={handleAddFood}
              onCopyPreviousDay={handleCopyPreviousDay}
            />
          )}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
        />
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
    marginBottom: 16,
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
  summaryContainer: {
    alignItems: 'flex-end',
  },
  summaryText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  caloriesText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '700',
  },
  mealItem: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  mealGradient: {
    borderWidth: 1,
    borderColor: COLORS.border + '50',
    borderRadius: 16,
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  mealInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  mealIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  mealEmoji: {
    fontSize: 16,
  },
  mealDetails: {
    flex: 1,
  },
  mealName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  mealTime: {
    fontSize: 11,
    color: COLORS.textLight,
    marginLeft: 4,
    fontWeight: '500',
  },
  mealCalories: {
    fontSize: 12,
    color: COLORS.success,
    fontWeight: '600',
  },
  mealActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  copyButton: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  mealContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  mealItemsText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 4,
    lineHeight: 18,
  },
  emptyMeal: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  emptyMealText: {
    fontSize: 12,
    color: COLORS.textLight,
    fontStyle: 'italic',
  },
});