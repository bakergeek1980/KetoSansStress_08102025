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
        
        <Text style={styles.foodsDetected} numberOfLines={1}>
          {item.nutritional_info.foods_detected.join(', ')}
        </Text>
        
        <View style={styles.nutritionSummary}>
          <Text style={styles.nutritionItem}>
            {Math.round(item.nutritional_info.calories)} cal
          </Text>
          <Text style={styles.nutritionItem}>
            {Math.round(item.nutritional_info.net_carbs)}g glucides
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Repas d'aujourd'hui</Text>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Clock color={COLORS.dark} size={20} />
        <Text style={styles.sectionTitle}>Repas d'aujourd'hui</Text>
      </View>
      
      {meals.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Aucun repas enregistré aujourd'hui</Text>
          <Text style={styles.emptySubtext}>Scannez votre premier repas pour commencer !</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginLeft: 8,
  },
  loadingContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.lightGray,
  },
  emptyContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 30,
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
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginRight: 16,
    width: 200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  mealImageContainer: {
    position: 'relative',
  },
  mealImage: {
    width: '100%',
    height: 120,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  ketoScoreBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  ketoScoreText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 2,
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
    fontSize: 16,
    marginRight: 6,
  },
  mealType: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
    flex: 1,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealTime: {
    fontSize: 12,
    color: COLORS.lightGray,
    marginLeft: 4,
  },
  foodsDetected: {
    fontSize: 12,
    color: COLORS.lightGray,
    marginBottom: 8,
  },
  nutritionSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nutritionItem: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
});