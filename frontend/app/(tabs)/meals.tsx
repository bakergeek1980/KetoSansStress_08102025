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

const COLORS = {
  primary: '#27AE60',
  purple: '#8E44AD',
  white: '#FFFFFF',
  gray: '#F8F9FA',
  dark: '#2C3E50',
  lightGray: '#BDC3C7'
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
    { key: 'petit_dejeuner', label: 'Petit-déj' },
    { key: 'dejeuner', label: 'Déjeuner' },
    { key: 'diner', label: 'Dîner' },
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
      case 'petit_dejeuner': return '🌅';
      case 'dejeuner': return '🌞';
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
    if (score >= 8) return COLORS.primary;
    if (score >= 6) return '#F39C12';
    return '#E74C3C';
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
        <View style={styles.ketoScoreBadge}>
          <Star 
            color={getKetoScoreColor(item.nutritional_info.keto_score)} 
            size={14} 
            fill={getKetoScoreColor(item.nutritional_info.keto_score)}
          />
          <Text style={[styles.ketoScoreText, { color: getKetoScoreColor(item.nutritional_info.keto_score) }]}>
            {item.nutritional_info.keto_score}
          </Text>
        </View>
      </View>
      
      <View style={styles.mealContent}>
        <View style={styles.mealHeader}>
          <View style={styles.mealTypeContainer}>
            <Text style={styles.mealTypeEmoji}>{getMealTypeIcon(item.meal_type)}</Text>
            <Text style={styles.mealType}>{getMealTypeName(item.meal_type)}</Text>
          </View>
          <View style={styles.dateTimeContainer}>
            <Text style={styles.mealDate}>{formatDate(item.created_at)}</Text>
            <View style={styles.timeContainer}>
              <Clock color={COLORS.lightGray} size={12} />
              <Text style={styles.mealTime}>{formatTime(item.created_at)}</Text>
            </View>
          </View>
        </View>
        
        <Text style={styles.foodsDetected} numberOfLines={2}>
          {item.nutritional_info.foods_detected.join(', ')}
        </Text>
        
        <View style={styles.nutritionSummary}>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{Math.round(item.nutritional_info.calories)}</Text>
            <Text style={styles.nutritionLabel}>cal</Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{Math.round(item.nutritional_info.net_carbs)}</Text>
            <Text style={styles.nutritionLabel}>glucides nets</Text>
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
          <Text style={styles.loadingText}>Chargement de vos repas...</Text>
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

      {/* Barre de recherche */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search color={COLORS.lightGray} size={20} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un aliment..."
            placeholderTextColor={COLORS.lightGray}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Filtres */}
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
              styles.filterButton,
              selectedFilter === filter.key && styles.selectedFilterButton,
            ]}
            onPress={() => setSelectedFilter(filter.key)}
          >
            <Text style={[
              styles.filterButtonText,
              selectedFilter === filter.key && styles.selectedFilterButtonText,
            ]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Liste des repas */}
      {filteredMeals.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {searchQuery || selectedFilter !== 'tous' 
              ? 'Aucun repas ne correspond à votre recherche' 
              : 'Vous n\'avez pas encore enregistré de repas'
            }
          </Text>
          <Text style={styles.emptySubtext}>
            {searchQuery || selectedFilter !== 'tous'
              ? 'Essayez de modifier vos critères de recherche'
              : 'Scannez votre premier repas pour commencer !'
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
    backgroundColor: COLORS.gray,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.dark,
  },
  header: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.lightGray,
    marginTop: 4,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.dark,
    marginLeft: 12,
  },
  filtersContainer: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filtersContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  filterButton: {
    backgroundColor: COLORS.gray,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
  },
  selectedFilterButton: {
    backgroundColor: COLORS.primary,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
  },
  selectedFilterButtonText: {
    color: COLORS.white,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.dark,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.lightGray,
    textAlign: 'center',
  },
  mealsList: {
    padding: 20,
  },
  mealCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginBottom: 16,
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
    height: 150,
  },
  ketoScoreBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  ketoScoreText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
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
    fontSize: 18,
    marginRight: 8,
  },
  mealType: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
  },
  dateTimeContainer: {
    alignItems: 'flex-end',
  },
  mealDate: {
    fontSize: 12,
    color: COLORS.lightGray,
    marginBottom: 2,
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
    fontSize: 14,
    color: COLORS.lightGray,
    lineHeight: 20,
    marginBottom: 16,
  },
  nutritionSummary: {
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
    marginBottom: 2,
  },
  nutritionLabel: {
    fontSize: 10,
    color: COLORS.lightGray,
    textAlign: 'center',
  },
});