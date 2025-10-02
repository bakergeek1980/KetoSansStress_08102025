import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  FlatList,
  Image,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Filter, Calendar, Star, Clock } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
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

export default function MealsScreen() {
  const { user } = useAuth();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('tous');

  const FILTER_OPTIONS = [
    { key: 'tous', label: 'Tous' },
    { key: 'petit_dejeuner', label: 'Matin' },
    { key: 'dejeuner', label: 'Midi' },
    { key: 'diner', label: 'Soir' },
    { key: 'collation', label: 'Collation' },
  ];

  useEffect(() => {
    loadMeals();
  }, [user]);

  const loadMeals = async () => {
    if (!user?.email) return;
    
    try {
      const response = await getUserMeals(user.email);
      setMeals(response.meals || []);
    } catch (error) {
      console.error('Erreur lors du chargement des repas:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMeals();
    setRefreshing(false);
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
      case 'petit_dejeuner': return 'Petit-déjeuner';
      case 'dejeuner': return 'Déjeuner';
      case 'diner': return 'Dîner';
      case 'collation': return 'Collation';
      default: return 'Repas';
    }
  };

  const getKetoScoreColor = (score: number) => {
    if (score >= 8) return COLORS.success;
    if (score >= 6) return COLORS.warning;
    return COLORS.error;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredMeals = meals.filter((meal) => {
    const matchesSearch = meal.nutritional_info.foods_detected.some(food =>
      food.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const matchesFilter = selectedFilter === 'tous' || meal.meal_type === selectedFilter;
    
    return matchesSearch && matchesFilter;
  });

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
          <View style={styles.mealTypeContainer}>
            <Text style={styles.mealTypeEmoji}>{getMealTypeIcon(item.meal_type)}</Text>
            <Text style={styles.mealType}>{getMealTypeName(item.meal_type)}</Text>
          </View>
          <Text style={styles.mealTime}>{formatTime(item.created_at)}</Text>
        </View>
        
        <Text style={styles.foodsDetected} numberOfLines={2}>
          {item.nutritional_info.foods_detected.join(', ')}
        </Text>
        
        <View style={styles.nutritionRow}>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{Math.round(item.nutritional_info.calories)}</Text>
            <Text style={styles.nutritionLabel}>cal</Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{Math.round(item.nutritional_info.net_carbs)}</Text>
            <Text style={styles.nutritionLabel}>glucides</Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{Math.round(item.nutritional_info.proteins)}</Text>
            <Text style={styles.nutritionLabel}>protéines</Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{Math.round(item.nutritional_info.fats)}</Text>
            <Text style={styles.nutritionLabel}>lipides</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mes Repas</Text>
        <Text style={styles.headerSubtitle}>{meals.length} repas enregistrés</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search color={COLORS.textLight} size={20} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher..."
            placeholderTextColor={COLORS.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Filters */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        {FILTER_OPTIONS.map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterChip,
              selectedFilter === filter.key && styles.selectedFilterChip,
            ]}
            onPress={() => setSelectedFilter(filter.key)}
          >
            <Text style={[
              styles.filterText,
              selectedFilter === filter.key && styles.selectedFilterText,
            ]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Meals List */}
      {filteredMeals.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>
            {searchQuery || selectedFilter !== 'tous' 
              ? 'Aucun résultat trouvé' 
              : 'Aucun repas enregistré'
            }
          </Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery || selectedFilter !== 'tous'
              ? 'Essayez de modifier vos critères de recherche'
              : 'Commencez par ajouter votre premier repas'
            }
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredMeals}
          renderItem={renderMeal}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.mealsList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.text,
  },
  header: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.surface,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    marginLeft: 12,
  },
  filtersContainer: {
    backgroundColor: COLORS.surface,
    paddingBottom: 16,
  },
  filtersContent: {
    paddingHorizontal: 20,
  },
  filterChip: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: COLORS.background,
  },
  selectedFilterChip: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  selectedFilterText: {
    color: COLORS.surface,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  mealsList: {
    padding: 20,
    gap: 16,
  },
  mealCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
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
    height: 160,
  },
  scoreContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  scoreBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreText: {
    color: COLORS.surface,
    fontSize: 14,
    fontWeight: 'bold',
  },
  mealContent: {
    padding: 16,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  mealTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealTypeEmoji: {
    fontSize: 16,
    marginRight: 8,
  },
  mealType: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  mealTime: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  foodsDetected: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  nutritionLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});