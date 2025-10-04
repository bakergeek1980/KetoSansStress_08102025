"""
OpenFoodFacts API Integration
Intégration pour rechercher et enrichir les données alimentaires
"""

import requests
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import json

logger = logging.getLogger(__name__)

class OpenFoodFactsAPI:
    """Client pour l'API OpenFoodFacts"""
    
    BASE_URL = "https://world.openfoodfacts.org"
    SEARCH_URL = f"{BASE_URL}/cgi/search.pl"
    PRODUCT_URL = f"{BASE_URL}/api/v0/product"
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'KetoSansStress/1.0 (https://ketosansstress.fr; support@ketosansstress.fr)'
        })
    
    def search_products(self, 
                       query: str, 
                       country: str = "france",
                       language: str = "fr",
                       limit: int = 20) -> List[Dict[str, Any]]:
        """
        Rechercher des produits par nom
        
        Args:
            query: Terme de recherche
            country: Pays de recherche (france par défaut)
            language: Langue des résultats (fr par défaut)
            limit: Nombre maximum de résultats
        
        Returns:
            Liste des produits trouvés
        """
        try:
            params = {
                'search_terms': query,
                'search_simple': 1,
                'action': 'process',
                'json': 1,
                'page_size': limit,
                'countries': country,
                'fields': 'code,product_name,brands,categories,nutriments,ingredients_text,image_url,keto_score'
            }
            
            response = self.session.get(self.SEARCH_URL, params=params, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            products = data.get('products', [])
            
            # Filtrer et enrichir les produits
            enriched_products = []
            for product in products:
                enriched = self._enrich_product_data(product)
                if enriched:
                    enriched_products.append(enriched)
            
            logger.info(f"Trouvé {len(enriched_products)} produits pour '{query}'")
            return enriched_products
            
        except Exception as e:
            logger.error(f"Erreur lors de la recherche OpenFoodFacts: {e}")
            return []
    
    def get_product_by_barcode(self, barcode: str) -> Optional[Dict[str, Any]]:
        """
        Récupérer un produit par son code-barres
        
        Args:
            barcode: Code-barres du produit
        
        Returns:
            Données du produit ou None si non trouvé
        """
        try:
            url = f"{self.PRODUCT_URL}/{barcode}.json"
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            
            if data.get('status') == 1 and 'product' in data:
                enriched = self._enrich_product_data(data['product'])
                logger.info(f"Produit trouvé pour le code-barres {barcode}")
                return enriched
            else:
                logger.warning(f"Aucun produit trouvé pour le code-barres {barcode}")
                return None
                
        except Exception as e:
            logger.error(f"Erreur lors de la récupération du produit {barcode}: {e}")
            return None
    
    def _enrich_product_data(self, product: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Enrichir les données d'un produit avec calculs spécifiques au keto
        
        Args:
            product: Données brutes du produit OpenFoodFacts
        
        Returns:
            Données enrichies du produit ou None si données insuffisantes
        """
        try:
            # Vérifier les données nutritionnelles minimales
            nutriments = product.get('nutriments', {})
            
            # Extraire les informations nutritionnelles pour 100g
            calories_100g = self._safe_float(nutriments.get('energy-kcal_100g'))
            protein_100g = self._safe_float(nutriments.get('proteins_100g'))
            carbs_100g = self._safe_float(nutriments.get('carbohydrates_100g'))
            fat_100g = self._safe_float(nutriments.get('fat_100g'))
            fiber_100g = self._safe_float(nutriments.get('fiber_100g', 0))
            sugar_100g = self._safe_float(nutriments.get('sugars_100g', 0))
            sodium_100g = self._safe_float(nutriments.get('sodium_100g', 0))
            
            # Calculer les glucides nets
            net_carbs_100g = max(0, carbs_100g - fiber_100g) if carbs_100g is not None else None
            
            # Calculer le score keto
            keto_score = self._calculate_keto_score(calories_100g, carbs_100g, fat_100g, fiber_100g)
            
            # Déterminer la compatibilité keto
            is_keto_friendly = keto_score >= 7 if keto_score else False
            
            # Score de qualité des données
            data_quality = self._calculate_data_quality(product, nutriments)
            
            enriched_product = {
                'openfoodfacts_id': product.get('code', ''),
                'barcode': product.get('code', ''),
                'product_name': product.get('product_name', '').strip(),
                'brand': product.get('brands', '').split(',')[0].strip() if product.get('brands') else None,
                
                # Nutritionnel pour 100g
                'calories_per_100g': calories_100g,
                'protein_per_100g': protein_100g,
                'carbohydrates_per_100g': carbs_100g,
                'fat_per_100g': fat_100g,
                'fiber_per_100g': fiber_100g,
                'sugar_per_100g': sugar_100g,
                'sodium_per_100g': sodium_100g,
                'net_carbs_per_100g': net_carbs_100g,
                
                # Métadonnées du produit
                'categories': self._parse_categories(product.get('categories', '')),
                'labels': self._parse_labels(product.get('labels', '')),
                'allergens': self._parse_allergens(product.get('allergens', '')),
                'ingredients_text': product.get('ingredients_text', ''),
                'image_url': product.get('image_url', ''),
                
                # Compatibilité keto
                'keto_score': keto_score,
                'is_keto_friendly': is_keto_friendly,
                
                # Qualité des données
                'data_source': 'openfoodfacts',
                'data_quality_score': data_quality,
                'last_updated': datetime.utcnow().isoformat(),
            }
            
            return enriched_product
            
        except Exception as e:
            logger.error(f"Erreur lors de l'enrichissement du produit: {e}")
            return None
    
    def _safe_float(self, value: Any) -> Optional[float]:
        """Conversion sécurisée en float"""
        if value is None or value == '':
            return None
        try:
            return float(value)
        except (ValueError, TypeError):
            return None
    
    def _calculate_keto_score(self, 
                            calories: Optional[float],
                            carbs: Optional[float], 
                            fat: Optional[float],
                            fiber: Optional[float]) -> Optional[int]:
        """
        Calculer le score de compatibilité keto (1-10)
        
        Args:
            calories: Calories pour 100g
            carbs: Glucides pour 100g
            fat: Lipides pour 100g
            fiber: Fibres pour 100g
        
        Returns:
            Score keto de 1 à 10 ou None si calcul impossible
        """
        try:
            if calories is None or calories <= 0:
                return None
            
            # Calculer les glucides nets
            net_carbs = carbs - (fiber or 0) if carbs is not None else None
            
            if net_carbs is None:
                return None
            
            # Pourcentages des macronutriments
            carbs_percentage = (net_carbs * 4 / calories) * 100 if net_carbs >= 0 else 0
            fat_percentage = (fat * 9 / calories) * 100 if fat else 0
            
            # Score basé sur les ratios keto optimaux
            if carbs_percentage <= 2 and fat_percentage >= 80:
                return 10
            elif carbs_percentage <= 5 and fat_percentage >= 70:
                return 9
            elif carbs_percentage <= 8 and fat_percentage >= 60:
                return 8
            elif carbs_percentage <= 12 and fat_percentage >= 50:
                return 7
            elif carbs_percentage <= 15 and fat_percentage >= 40:
                return 6
            elif carbs_percentage <= 20 and fat_percentage >= 30:
                return 5
            elif carbs_percentage <= 30:
                return 4
            elif carbs_percentage <= 40:
                return 3
            elif carbs_percentage <= 50:
                return 2
            else:
                return 1
                
        except Exception as e:
            logger.error(f"Erreur lors du calcul du score keto: {e}")
            return None
    
    def _calculate_data_quality(self, product: Dict, nutriments: Dict) -> float:
        """
        Calculer un score de qualité des données (0-1)
        
        Args:
            product: Données du produit
            nutriments: Données nutritionnelles
        
        Returns:
            Score de qualité de 0 à 1
        """
        try:
            score = 0.0
            max_score = 10.0
            
            # Nom du produit (obligatoire)
            if product.get('product_name'):
                score += 2.0
            
            # Marque
            if product.get('brands'):
                score += 1.0
            
            # Calories
            if nutriments.get('energy-kcal_100g'):
                score += 2.0
            
            # Macronutriments principaux
            if nutriments.get('proteins_100g'):
                score += 1.0
            if nutriments.get('carbohydrates_100g'):
                score += 1.0
            if nutriments.get('fat_100g'):
                score += 1.0
            
            # Fibres
            if nutriments.get('fiber_100g'):
                score += 1.0
            
            # Image
            if product.get('image_url'):
                score += 1.0
            
            return min(1.0, score / max_score)
            
        except Exception as e:
            logger.error(f"Erreur lors du calcul de qualité: {e}")
            return 0.5
    
    def _parse_categories(self, categories_str: str) -> List[str]:
        """Parser les catégories"""
        if not categories_str:
            return []
        return [cat.strip() for cat in categories_str.split(',') if cat.strip()][:10]  # Limiter à 10
    
    def _parse_labels(self, labels_str: str) -> List[str]:
        """Parser les labels"""
        if not labels_str:
            return []
        return [label.strip() for label in labels_str.split(',') if label.strip()][:15]  # Limiter à 15
    
    def _parse_allergens(self, allergens_str: str) -> List[str]:
        """Parser les allergènes"""
        if not allergens_str:
            return []
        return [allergen.strip() for allergen in allergens_str.split(',') if allergen.strip()][:10]  # Limiter à 10


# Service de recherche avancée
class FoodSearchService:
    """Service de recherche d'aliments avec cache et intelligence"""
    
    def __init__(self):
        self.openfoodfacts = OpenFoodFactsAPI()
        
    def search_foods(self, query: str, limit: int = 20) -> List[Dict[str, Any]]:
        """
        Rechercher des aliments avec plusieurs sources
        
        Args:
            query: Terme de recherche
            limit: Nombre maximum de résultats
        
        Returns:
            Liste des aliments trouvés, triés par pertinence et score keto
        """
        try:
            # Recherche OpenFoodFacts
            off_results = self.openfoodfacts.search_products(query, limit=limit)
            
            # TODO: Ajouter d'autres sources (base locale, etc.)
            
            # Trier par score keto et qualité des données
            sorted_results = sorted(
                off_results,
                key=lambda x: (
                    x.get('keto_score') or 0,
                    x.get('data_quality_score') or 0,
                    1 if x.get('product_name', '').lower().find(query.lower()) != -1 else 0
                ),
                reverse=True
            )
            
            return sorted_results[:limit]
            
        except Exception as e:
            logger.error(f"Erreur lors de la recherche d'aliments: {e}")
            return []
    
    def get_food_by_barcode(self, barcode: str) -> Optional[Dict[str, Any]]:
        """Récupérer un aliment par code-barres"""
        try:
            return self.openfoodfacts.get_product_by_barcode(barcode)
        except Exception as e:
            logger.error(f"Erreur lors de la récupération par code-barres: {e}")
            return None


# Instance globale du service
food_search_service = FoodSearchService()