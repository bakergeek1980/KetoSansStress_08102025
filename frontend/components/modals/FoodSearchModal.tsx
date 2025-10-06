import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  FlatList,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  X, 
  Search, 
  Plus, 
  Minus, 
  Star, 
  Clock, 
  ChefHat, 
  Scan,
  Heart,
  Check
} from 'lucide-react-native';
import { useAuth } from '../../hooks/useAuth';
import { useApi } from '../../hooks/useApi';
import LoadingButton from '../forms/LoadingButton';
import BarcodeScannerModal from './BarcodeScannerModal';
import Constants from 'expo-constants';

const COLORS = {
  primary: '#4CAF50',
  secondary: '#81C784',
  accent: '#FF7043',
  background: '#FAFAFA',
  surface: '#FFFFFF',
  text: '#212121',
  textSecondary: '#757575',
  textLight: '#BDBDBD',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  keto: '#9C27B0',
};

interface Food {
  id: string;
  name: string;
  brand?: string;
  calories_per_100g: number;
  proteins_per_100g: number;
  carbs_per_100g: number;
  fats_per_100g: number;
  fiber_per_100g?: number;
  is_favorite?: boolean;
  category?: string;
}

interface FoodSearchModalProps {
  visible: boolean;
  onClose: () => void;
  mealType: string;
  onFoodAdded: () => void;
}

type TabType = 'search' | 'favorites' | 'recipes' | 'recent';

const mockFoods: Food[] = [
  {
    id: '1',
    name: 'Avocat',
    calories_per_100g: 160,
    proteins_per_100g: 2,
    carbs_per_100g: 9,
    fats_per_100g: 15,
    fiber_per_100g: 7,
    category: 'fruits',
  },
  {
    id: '2',
    name: 'Saumon',
    calories_per_100g: 208,
    proteins_per_100g: 25,
    carbs_per_100g: 0,
    fats_per_100g: 12,
    fiber_per_100g: 0,
    category: 'poisson',
  },
  {
    id: '3',
    name: 'Œufs',
    calories_per_100g: 155,
    proteins_per_100g: 13,
    carbs_per_100g: 1,
    fats_per_100g: 11,
    fiber_per_100g: 0,
    category: 'protéines',
  },
  {
    id: '4',
    name: 'Épinards',
    calories_per_100g: 23,
    proteins_per_100g: 3,
    carbs_per_100g: 4,
    fats_per_100g: 0,
    fiber_per_100g: 2,
    category: 'légumes',
  },
];

const mockFavorites: Food[] = [
  {
    id: '1',
    name: 'Avocat',
    calories_per_100g: 160,
    proteins_per_100g: 2,
    carbs_per_100g: 9,
    fats_per_100g: 15,
    fiber_per_100g: 7,
    is_favorite: true,
  },
  {
    id: '2',
    name: 'Saumon',
    calories_per_100g: 208,
    proteins_per_100g: 25,
    carbs_per_100g: 0,
    fats_per_100g: 12,
    fiber_per_100g: 0,
    is_favorite: true,
  },
];

const mockRecent: Food[] = [
  {
    id: '3',
    name: 'Œufs',
    calories_per_100g: 155,
    proteins_per_100g: 13,
    carbs_per_100g: 1,
    fats_per_100g: 11,
    fiber_per_100g: 0,
  },
  {
    id: '4',
    name: 'Épinards',
    calories_per_100g: 23,
    proteins_per_100g: 3,
    carbs_per_100g: 4,
    fats_per_100g: 0,
    fiber_per_100g: 2,
  },
];

export default function FoodSearchModal({ 
  visible, 
  onClose, 
  mealType, 
  onFoodAdded 
}: FoodSearchModalProps) {
  const { user } = useAuth();
  const { saveMeal, loading: apiLoading } = useApi();
  
  const [activeTab, setActiveTab] = useState<TabType>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [quantity, setQuantity] = useState(100);
  const [foods, setFoods] = useState<Food[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [scannerVisible, setScannerVisible] = useState(false);
  
  // Configuration de l'API
  const API_BASE_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL;

  // Recherche avec debounce
  const performSearch = async (query: string, tab: TabType) => {
    if (!user || !API_BASE_URL) return;

    setIsSearching(true);
    try {
      const { token } = user;
      
      switch (tab) {
        case 'search':
          if (query.length > 0) {
            const response = await fetch(`${API_BASE_URL}/api/foods/search?q=${encodeURIComponent(query)}`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });

            if (response.ok) {
              const results = await response.json();
              setFoods(results);
            } else {
              // Fallback to mock data
              const filtered = mockFoods.filter(food => 
                food.name.toLowerCase().includes(query.toLowerCase())
              );
              setFoods(filtered);
            }
          } else {
            setFoods(mockFoods);
          }
          break;
          
        case 'favorites':
          try {
            const response = await fetch(`${API_BASE_URL}/api/foods/favorites`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (response.ok) {
              const results = await response.json();
              setFoods(results);
            } else {
              setFoods(mockFavorites);
            }
          } catch (error) {
            setFoods(mockFavorites);
          }
          break;
          
        case 'recent':
          try {
            const response = await fetch(`${API_BASE_URL}/api/foods/recent-searches`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (response.ok) {
              const recentSearches = await response.json();
              // Pour chaque recherche récente, obtenir les aliments correspondants
              const recentFoods = [];
              for (const search of recentSearches.slice(0, 5)) {
                const searchResults = mockFoods.filter(food => 
                  food.name.toLowerCase().includes(search.query.toLowerCase())
                );
                recentFoods.push(...searchResults.slice(0, 2));
              }
              setFoods(recentFoods);
            } else {
              setFoods(mockRecent);
            }
          } catch (error) {
            setFoods(mockRecent);
          }
          break;
          
        case 'recipes':
          // TODO: Implémenter la recherche de recettes
          setFoods([]);
          break;
      }
    } catch (error) {
      console.error('Search error:', error);
      // Fallback to mock data
      switch (tab) {
        case 'search':
          setFoods(mockFoods);
          break;
        case 'favorites':
          setFoods(mockFavorites);
          break;
        case 'recent':
          setFoods(mockRecent);
          break;
        default:
          setFoods([]);
      }
    } finally {
      setIsSearching(false);
    }
  };

  // Effet pour la recherche avec debounce
  useEffect(() => {
    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Set new timeout for search
    const newTimeout = setTimeout(() => {
      performSearch(searchQuery, activeTab);
    }, activeTab === 'search' && searchQuery.length > 0 ? 300 : 0); // Debounce de 300ms pour la recherche
    
    setSearchTimeout(newTimeout);

    // Cleanup function
    return () => {
      if (newTimeout) {
        clearTimeout(newTimeout);
      }
    };
  }, [activeTab, searchQuery]);

  // Initial load for non-search tabs
  useEffect(() => {
    if (activeTab !== 'search') {
      performSearch('', activeTab);
    }
  }, [activeTab]);

  const calculateNutrition = (food: Food, grams: number) => {
    const factor = grams / 100;
    return {
      calories: Math.round(food.calories_per_100g * factor),
      proteins: Math.round(food.proteins_per_100g * factor * 10) / 10,
      carbs: Math.round(food.carbs_per_100g * factor * 10) / 10,
      net_carbs: Math.round((food.carbs_per_100g - (food.fiber_per_100g || 0)) * factor * 10) / 10,
      fats: Math.round(food.fats_per_100g * factor * 10) / 10,
      fiber: Math.round((food.fiber_per_100g || 0) * factor * 10) / 10,
    };
  };

  const calculateKetoScore = (nutrition: any): number => {
    const { calories, net_carbs, fats } = nutrition;
    
    if (calories === 0) return 5;
    
    const carbsPercentage = (net_carbs * 4 / calories) * 100;
    const fatPercentage = (fats * 9 / calories) * 100;
    
    if (carbsPercentage <= 5 && fatPercentage >= 70) return 10;
    if (carbsPercentage <= 10 && fatPercentage >= 60) return 8;
    if (carbsPercentage <= 15 && fatPercentage >= 50) return 6;
    if (carbsPercentage <= 20) return 4;
    return 2;
  };

  const handleAddFood = async () => {
    if (!selectedFood || !user) {
      Alert.alert('Erreur', 'Veuillez sélectionner un aliment');
      return;
    }

    try {
      const nutrition = calculateNutrition(selectedFood, quantity);
      const ketoScore = calculateKetoScore(nutrition);

      const success = await saveMeal({
        name: selectedFood.name,
        meal_type: mealType as 'breakfast' | 'lunch' | 'dinner' | 'snack',
        calories: nutrition.calories,
        proteins: nutrition.proteins,
        carbs: nutrition.carbs,
        net_carbs: nutrition.net_carbs,
        total_fat: nutrition.fats,
        fiber: nutrition.fiber,
        serving_size: `${quantity}g`,
        keto_score: ketoScore,
      });

      if (success) {
        Alert.alert('Succès', 'Aliment ajouté avec succès!');
        onFoodAdded();
        onClose();
      } else {
        Alert.alert('Erreur', 'Impossible d\'ajouter l\'aliment');
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'aliment:', error);
      Alert.alert('Erreur', 'Une erreur est survenue');
    }
  };

  const handleScannedFoodFound = (scannedFood: Food) => {
    // Auto-sélectionner l'aliment scanné
    setSelectedFood(scannedFood);
    setQuantity(100); // Quantité par défaut
    setScannerVisible(false);
  };

  const renderTabButton = (tab: TabType, icon: React.ReactNode, label: string) => (
    <TouchableOpacity
      key={tab}
      style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
      onPress={() => setActiveTab(tab)}
    >
      {icon}
      <Text style={[styles.tabLabel, activeTab === tab && styles.activeTabLabel]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderFoodItem = ({ item }: { item: Food }) => {
    const nutrition = calculateNutrition(item, 100);
    const ketoScore = calculateKetoScore(nutrition);
    
    return (
      <TouchableOpacity
        style={[
          styles.foodItem,
          selectedFood?.id === item.id && styles.selectedFoodItem
        ]}
        onPress={() => setSelectedFood(item)}
      >
        <View style={styles.foodInfo}>
          <Text style={styles.foodName}>{item.name}</Text>
          {item.brand && (
            <Text style={styles.foodBrand}>{item.brand}</Text>
          )}
          <View style={styles.nutritionRow}>
            <Text style={styles.nutritionText}>
              {item.calories_per_100g} kcal/100g
            </Text>
            <Text style={styles.nutritionText}>
              P: {item.proteins_per_100g}g
            </Text>
            <Text style={styles.nutritionText}>
              G: {item.carbs_per_100g}g
            </Text>
            <Text style={styles.nutritionText}>
              L: {item.fats_per_100g}g
            </Text>
          </View>
        </View>
        <View style={styles.foodActions}>
          <View style={[
            styles.ketoScoreBadge,
            { backgroundColor: ketoScore >= 8 ? COLORS.success : 
                              ketoScore >= 6 ? COLORS.warning : COLORS.error }
          ]}>
            <Text style={styles.ketoScoreText}>{ketoScore}/10</Text>
          </View>
          {selectedFood?.id === item.id && (
            <Check color={COLORS.primary} size={20} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderQuantitySelector = () => {
    if (!selectedFood) return null;

    const nutrition = calculateNutrition(selectedFood, quantity);

    return (
      <View style={styles.quantitySection}>
        <Text style={styles.sectionTitle}>Quantité et informations nutritionnelles</Text>
        
        <View style={styles.quantityContainer}>
          <Text style={styles.quantityLabel}>Quantité (grammes)</Text>
          <View style={styles.quantityControls}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => setQuantity(Math.max(1, quantity - 10))}
            >
              <Minus color={COLORS.text} size={20} />
            </TouchableOpacity>
            
            <TextInput
              style={styles.quantityInput}
              value={quantity.toString()}
              onChangeText={(text) => {
                const num = parseInt(text) || 0;
                setQuantity(Math.max(1, num));
              }}
              keyboardType="numeric"
            />
            
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => setQuantity(quantity + 10)}
            >
              <Plus color={COLORS.text} size={20} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.nutritionPreview}>
          <Text style={styles.nutritionTitle}>
            {selectedFood.name} - {quantity}g
          </Text>
          
          <View style={styles.nutritionGrid}>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionLabel}>Calories</Text>
              <Text style={styles.nutritionValue}>{nutrition.calories} kcal</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionLabel}>Protéines</Text>
              <Text style={styles.nutritionValue}>{nutrition.proteins} g</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionLabel}>Glucides</Text>
              <Text style={styles.nutritionValue}>{nutrition.carbs} g</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionLabel}>Lipides</Text>
              <Text style={styles.nutritionValue}>{nutrition.fats} g</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionLabel}>Glucides nets</Text>
              <Text style={styles.nutritionValue}>{nutrition.net_carbs} g</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionLabel}>Fibres</Text>
              <Text style={styles.nutritionValue}>{nutrition.fiber} g</Text>
            </View>
          </View>

          <View style={styles.ketoPreview}>
            <Text style={styles.ketoPreviewLabel}>Score Keto:</Text>
            <View style={[
              styles.ketoScoreBadge,
              { backgroundColor: calculateKetoScore(nutrition) >= 8 ? COLORS.success : 
                                calculateKetoScore(nutrition) >= 6 ? COLORS.warning : COLORS.error }
            ]}>
              <Text style={styles.ketoScoreText}>{calculateKetoScore(nutrition)}/10</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.content}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X color={COLORS.text} size={24} />
            </TouchableOpacity>
            <Text style={styles.title}>Ajouter un aliment</Text>
            <Text style={styles.subtitle}>{mealType}</Text>
          </View>

          {/* Tabs */}
          <View style={styles.tabs}>
            {renderTabButton('search', <Search color={activeTab === 'search' ? COLORS.surface : COLORS.textSecondary} size={20} />, 'Rechercher')}
            {renderTabButton('favorites', <Heart color={activeTab === 'favorites' ? COLORS.surface : COLORS.textSecondary} size={20} />, 'Favoris')}
            {renderTabButton('recipes', <ChefHat color={activeTab === 'recipes' ? COLORS.surface : COLORS.textSecondary} size={20} />, 'Recettes')}
            {renderTabButton('recent', <Clock color={activeTab === 'recent' ? COLORS.surface : COLORS.textSecondary} size={20} />, 'Récent')}
          </View>

          {/* Search Bar */}
          {activeTab === 'search' && (
            <View style={styles.searchContainer}>
              <View style={styles.searchBar}>
                <Search color={COLORS.textSecondary} size={20} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Rechercher un aliment..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
              <TouchableOpacity 
                style={styles.scanButton}
                onPress={() => setScannerVisible(true)}
              >
                <Scan color={COLORS.primary} size={20} />
                <Text style={styles.scanText}>Scanner</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Food List */}
          <FlatList
            data={foods}
            renderItem={renderFoodItem}
            keyExtractor={(item) => item.id}
            style={styles.foodList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  {activeTab === 'search' ? 'Recherchez un aliment...' : 'Aucun aliment trouvé'}
                </Text>
              </View>
            }
          />

          {/* Quantity Selector */}
          {renderQuantitySelector()}

          {/* Add Button */}
          {selectedFood && (
            <View style={styles.addButtonContainer}>
              <LoadingButton
                onPress={handleAddFood}
                loading={apiLoading}
                style={styles.addButton}
                textStyle={styles.addButtonText}
              >
                Ajouter à {mealType}
              </LoadingButton>
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
  },
  header: {
    backgroundColor: COLORS.surface,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.textLight,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    left: 20,
    top: 20,
    zIndex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textTransform: 'capitalize',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    marginHorizontal: 2,
  },
  activeTabButton: {
    backgroundColor: COLORS.primary,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  activeTabLabel: {
    color: COLORS.surface,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: COLORS.text,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  scanText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  foodList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  foodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 16,
    marginVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.textLight + '30',
  },
  selectedFoodItem: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  foodBrand: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  nutritionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  nutritionText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  foodActions: {
    alignItems: 'center',
    gap: 8,
  },
  ketoScoreBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 40,
    alignItems: 'center',
  },
  ketoScoreText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.surface,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  quantitySection: {
    backgroundColor: COLORS.surface,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.textLight,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  quantityContainer: {
    marginBottom: 20,
  },
  quantityLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.textLight,
  },
  quantityInput: {
    width: 80,
    height: 40,
    borderWidth: 1,
    borderColor: COLORS.textLight,
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  nutritionPreview: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 16,
  },
  nutritionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  nutritionItem: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: COLORS.surface,
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  nutritionLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  nutritionValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  ketoPreview: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  ketoPreviewLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  addButtonContainer: {
    padding: 20,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.textLight,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.surface,
  },
});