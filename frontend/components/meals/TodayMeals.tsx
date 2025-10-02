import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
} from 'react-native';
import { Clock, Star } from 'lucide-react-native';
import { getUserMeals } from '../../lib/api';

// KetoDiet inspired colors
const COLORS = {
  primary: '#4CAF50',
  secondary: '#81C784',
  accent: '#FF7043',
  background: '#FAFAFA',
  surface: '#FFFFFF',
  text: '#212121',
  textSecondary: '#757575',
  textLight: '#9E9E9E',
  error: '#F44336',
  warning: '#FF9800',
  success: '#4CAF50',
};

interface Meal {
  _id: string;
  meal_type: string;
  date: string;
  image_base64: string;
  nutritional_info: {
    calories: number;
    proteins: number;
    carbs: number;
    net_carbs: number;
    fats: number;
    keto_score: number;
    foods_detected: string[];
  };
  created_at: string;
}

interface TodayMealsProps {
  userEmail: string;
}

export default function TodayMeals({ userEmail }: TodayMealsProps) {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTodayMeals();
  }, [userEmail]);

  const loadTodayMeals = async () => {
    if (!userEmail) return;
    
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await getUserMeals(userEmail, today);
      setMeals(response.meals || []);
    } catch (error) {
      console.error('Erreur lors du chargement des repas:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMealTypeIcon = (mealType: string) => {
    switch (mealType) {
      case 'petit_dejeuner': return '☀️';
      case 'dejeuner': return '🌤️';
      case 'diner': return '🌙';
      case 'collation': return '🍎';
      default: return '🍽️';
    }
  };

  const getMealTypeName = (mealType: string) => {
    switch (mealType) {
      case 'petit_dejeuner': return 'Matin';
      case 'dejeuner': return 'Midi';
      case 'diner': return 'Soir';
      case 'collation': return 'Collation';
      default: return 'Repas';
    }
  };

  const getKetoScoreColor = (score: number) => {
    if (score >= 8) return COLORS.success;
    if (score >= 6) return COLORS.warning;
    return COLORS.error;
  };

  const renderMeal = ({ item }: { item: Meal }) => (
    <TouchableOpacity style={styles.mealCard}>
      <View style={styles.mealImageContainer}>
        <Image
          source={{ uri: `data:image/jpeg;base64,${item.image_base64}` }}
          style={styles.mealImage}
        />
        <View style={styles.scoreContainer}>
          <View style={[styles.scoreBadge, { backgroundColor: getKetoScoreColor(item.nutritional_info.keto_score) }]}>
            <Text style={styles.scoreText}>{item.nutritional_info.keto_score}</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.mealContent}>
        <View style={styles.mealHeader}>
          <Text style={styles.mealTypeEmoji}>{getMealTypeIcon(item.meal_type)}</Text>
          <Text style={styles.mealType}>{getMealTypeName(item.meal_type)}</Text>
          <Text style={styles.mealTime}>
            {new Date(item.created_at).toLocaleTimeString('fr-FR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </Text>
        </View>
        
        <Text style={styles.foodsDetected} numberOfLines={2}>
          {item.nutritional_info.foods_detected.join(', ')}
        </Text>
        
        <View style={styles.nutritionSummary}>
          <Text style={styles.nutritionText}>
            {Math.round(item.nutritional_info.calories)} cal • {Math.round(item.nutritional_info.net_carbs)}g glucides
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <>
      {meals.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Aucun repas aujourd'hui</Text>
          <Text style={styles.emptySubtext}>Commencez par ajouter votre premier repas</Text>
        </View>
      ) : (
        <FlatList
          data={meals}
          renderItem={renderMeal}
          keyExtractor={(item) => item._id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.mealsList}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loadingText: {
    color: COLORS.textSecondary,
  },
  emptyContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  mealsList: {
    paddingLeft: 5,
  },
  mealCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    marginRight: 16,
    width: 220,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden',
  },
  mealImageContainer: {
    position: 'relative',
  },
  mealImage: {
    width: '100%',
    height: 120,
  },
  scoreContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  scoreBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.surface,
  },
  mealContent: {
    padding: 12,
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  mealTypeEmoji: {
    fontSize: 14,
    marginRight: 6,
  },
  mealType: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  mealTime: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  foodsDetected: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 8,
    lineHeight: 16,
  },
  nutritionSummary: {
    alignItems: 'flex-start',
  },
  nutritionText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
  },
});