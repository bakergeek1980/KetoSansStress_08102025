from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from app.auth.dependencies import get_current_user
from app.database.connection import get_supabase_client
from integrations.openfoodfacts import food_search_service  # ✅ Utiliser le service existant
from pydantic import BaseModel
import requests
import logging
from datetime import datetime

router = APIRouter(prefix="/foods", tags=["Foods"])

# Configuration des logs
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Modèles Pydantic
class FoodSearchResult(BaseModel):
    id: str
    name: str
    brand: Optional[str] = None
    category: Optional[str] = None
    calories_per_100g: float
    proteins_per_100g: float
    carbs_per_100g: float
    fats_per_100g: float
    fiber_per_100g: Optional[float] = 0
    image_url: Optional[str] = None
    barcode: Optional[str] = None
    source: str = "openfoodfacts"

class SearchHistoryItem(BaseModel):
    query: str
    searched_at: datetime
    user_id: str

class BarcodeScanResult(BaseModel):
    barcode: str
    food_data: Optional[FoodSearchResult] = None
    found: bool

# Base de données alimentaire locale (pour démarrage rapide)
LOCAL_FOOD_DATABASE = [
    {
        "id": "avocado",
        "name": "Avocat",
        "category": "fruits",
        "calories_per_100g": 160,
        "proteins_per_100g": 2,
        "carbs_per_100g": 9,
        "fats_per_100g": 15,
        "fiber_per_100g": 7,
        "image_url": "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=100",
        "source": "local"
    },
    {
        "id": "salmon",
        "name": "Saumon",
        "category": "poisson",
        "calories_per_100g": 208,
        "proteins_per_100g": 25,
        "carbs_per_100g": 0,
        "fats_per_100g": 12,
        "fiber_per_100g": 0,
        "image_url": "https://images.unsplash.com/photo-1519708227418-c8e56d59a7a0?w=100",
        "source": "local"
    },
    {
        "id": "eggs",
        "name": "Œufs",
        "category": "protéines",
        "calories_per_100g": 155,
        "proteins_per_100g": 13,
        "carbs_per_100g": 1,
        "fats_per_100g": 11,
        "fiber_per_100g": 0,
        "image_url": "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=100",
        "source": "local"
    },
    {
        "id": "spinach",
        "name": "Épinards",
        "category": "légumes",
        "calories_per_100g": 23,
        "proteins_per_100g": 3,
        "carbs_per_100g": 4,
        "fats_per_100g": 0,
        "fiber_per_100g": 2,
        "image_url": "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=100",
        "source": "local"
    },
    {
        "id": "chicken",
        "name": "Poulet",
        "category": "viande",
        "calories_per_100g": 165,
        "proteins_per_100g": 31,
        "carbs_per_100g": 0,
        "fats_per_100g": 4,
        "fiber_per_100g": 0,
        "image_url": "https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=100",
        "source": "local"
    },
    {
        "id": "broccoli",
        "name": "Brocoli",
        "category": "légumes",
        "calories_per_100g": 34,
        "proteins_per_100g": 3,
        "carbs_per_100g": 7,
        "fats_per_100g": 0,
        "fiber_per_100g": 3,
        "image_url": "https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=100",
        "source": "local"
    },
    {
        "id": "cheese",
        "name": "Fromage",
        "brand": "Emmental",
        "category": "produits laitiers",
        "calories_per_100g": 380,
        "proteins_per_100g": 25,
        "carbs_per_100g": 1,
        "fats_per_100g": 30,
        "fiber_per_100g": 0,
        "image_url": "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=100",
        "source": "local"
    },
    {
        "id": "almonds",
        "name": "Amandes",
        "category": "noix",
        "calories_per_100g": 579,
        "proteins_per_100g": 21,
        "carbs_per_100g": 22,
        "fats_per_100g": 50,
        "fiber_per_100g": 12,
        "image_url": "https://images.unsplash.com/photo-1508747703725-719777637510?w=100",
        "source": "local"
    }
]

@router.get("/search", response_model=List[FoodSearchResult])
async def search_foods(
    q: str = Query(..., min_length=1, description="Terme de recherche"),
    limit: int = Query(10, ge=1, le=50, description="Nombre maximum de résultats"),
    category: Optional[str] = Query(None, description="Filtrer par catégorie"),
    current_user: dict = Depends(get_current_user)
):
    """
    Rechercher des aliments par nom, marque ou catégorie
    """
    try:
        # Recherche locale d'abord
        results = []
        query_lower = q.lower()
        
        for food in LOCAL_FOOD_DATABASE:
            # Recherche dans le nom
            if query_lower in food["name"].lower():
                results.append(food)
            # Recherche dans la catégorie
            elif category and food.get("category") and category.lower() in food["category"].lower():
                results.append(food)
            # Recherche dans la marque
            elif food.get("brand") and query_lower in food["brand"].lower():
                results.append(food)
        
        # Filtrer par catégorie si spécifiée
        if category:
            results = [food for food in results if food.get("category", "").lower() == category.lower()]
        
        # Limiter les résultats
        results = results[:limit]
        
        # ✅ Utiliser le service OpenFoodFacts amélioré si pas assez de résultats locaux
        if len(results) < limit:
            try:
                openfoodfacts_results = food_search_service.search_foods(q, limit - len(results))
                
                # Convertir le format du service vers FoodSearchResult
                for off_result in openfoodfacts_results:
                    converted = {
                        "id": off_result.get("openfoodfacts_id", f"off_{off_result.get('barcode', 'unknown')}"),
                        "name": off_result.get("product_name", "Produit inconnu"),
                        "brand": off_result.get("brand"),
                        "category": off_result.get("categories", ["autre"])[0] if off_result.get("categories") else "autre",
                        "calories_per_100g": off_result.get("calories_per_100g", 0),
                        "proteins_per_100g": off_result.get("protein_per_100g", 0),
                        "carbs_per_100g": off_result.get("carbohydrates_per_100g", 0),
                        "fats_per_100g": off_result.get("fat_per_100g", 0),
                        "fiber_per_100g": off_result.get("fiber_per_100g", 0),
                        "image_url": off_result.get("image_url"),
                        "barcode": off_result.get("barcode"),
                        "source": "openfoodfacts"
                    }
                    results.append(converted)
            except Exception as e:
                logger.warning(f"OpenFoodFacts search failed: {e}")
        
        # Sauvegarder dans l'historique
        await save_search_history(current_user.id, q)
        
        return [FoodSearchResult(**food) for food in results]
        
    except Exception as e:
        logger.error(f"Food search error: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de la recherche")

@router.get("/recent-searches")
async def get_recent_searches(
    limit: int = Query(10, ge=1, le=20),
    current_user: dict = Depends(get_current_user)
):
    """
    Récupérer l'historique des recherches récentes de l'utilisateur
    """
    try:
        supabase = get_supabase_client()
        
        # Récupérer l'historique depuis Supabase
        result = supabase.table("search_history") \
            .select("query, searched_at") \
            .eq("user_id", current_user.id) \
            .order("searched_at", desc=True) \
            .limit(limit) \
            .execute()
        
        return result.data if result.data else []
        
    except Exception as e:
        logger.error(f"Recent searches error: {e}")
        # Retourner un historique par défaut si erreur
        return [
            {"query": "avocat", "searched_at": datetime.now().isoformat()},
            {"query": "saumon", "searched_at": datetime.now().isoformat()},
            {"query": "œufs", "searched_at": datetime.now().isoformat()}
        ]

class BarcodeScanRequest(BaseModel):
    barcode: str

@router.post("/scan-barcode", response_model=BarcodeScanResult)
async def scan_barcode(
    request: BarcodeScanRequest,  # ✅ Accepter le barcode dans le body
    current_user: dict = Depends(get_current_user)
):
    """
    Scanner un code-barres et récupérer les informations produit
    """
    try:
        # ✅ Utiliser le service OpenFoodFacts amélioré
        off_result = food_search_service.get_food_by_barcode(request.barcode)
        
        # Convertir le format si trouvé
        food_data = None
        if off_result:
            food_data = FoodSearchResult(
                id=off_result.get("openfoodfacts_id", f"off_{request.barcode}"),
                name=off_result.get("product_name", "Produit scanné"),
                brand=off_result.get("brand"),
                category=off_result.get("categories", ["produit scanné"])[0] if off_result.get("categories") else "produit scanné",
                calories_per_100g=off_result.get("calories_per_100g", 0),
                proteins_per_100g=off_result.get("protein_per_100g", 0),
                carbs_per_100g=off_result.get("carbohydrates_per_100g", 0),
                fats_per_100g=off_result.get("fat_per_100g", 0),
                fiber_per_100g=off_result.get("fiber_per_100g", 0),
                image_url=off_result.get("image_url"),
                barcode=request.barcode,
                source="openfoodfacts"
            )
        
        return BarcodeScanResult(
            barcode=request.barcode,
            food_data=food_data,
            found=food_data is not None
        )
        
    except Exception as e:
        logger.error(f"Barcode scan error: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors du scan du code-barres")

@router.get("/categories")
async def get_food_categories():
    """
    Récupérer toutes les catégories d'aliments disponibles
    """
    categories = list(set([food.get("category", "autre") for food in LOCAL_FOOD_DATABASE if food.get("category")]))
    return sorted(categories)

@router.get("/favorites")
async def get_favorite_foods(
    current_user: dict = Depends(get_current_user)
):
    """
    Récupérer les aliments favoris de l'utilisateur
    """
    # TODO: Implémenter la logique des favoris avec Supabase
    # Pour l'instant, retourner les aliments les plus populaires
    favorites = LOCAL_FOOD_DATABASE[:4]  # Top 4 aliments
    return [FoodSearchResult(**food) for food in favorites]

# Fonctions utilitaires

async def search_openfoodfacts(query: str, limit: int = 5) -> List[dict]:
    """
    Rechercher dans la base de données OpenFoodFacts
    """
    try:
        url = f"https://fr.openfoodfacts.org/cgi/search.pl"
        params = {
            "search_terms": query,
            "search_simple": 1,
            "action": "process",
            "json": 1,
            "page_size": limit,
            "fields": "product_name,brands,image_url,nutriments,code"
        }
        
        response = requests.get(url, params=params, timeout=5)
        response.raise_for_status()
        data = response.json()
        
        results = []
        for product in data.get("products", [])[:limit]:
            nutriments = product.get("nutriments", {})
            
            results.append({
                "id": f"off_{product.get('code', 'unknown')}",
                "name": product.get("product_name", "Produit inconnu"),
                "brand": product.get("brands", "").split(",")[0] if product.get("brands") else None,
                "category": "openfoodfacts",
                "calories_per_100g": nutriments.get("energy-kcal_100g", 0),
                "proteins_per_100g": nutriments.get("proteins_100g", 0),
                "carbs_per_100g": nutriments.get("carbohydrates_100g", 0),
                "fats_per_100g": nutriments.get("fat_100g", 0),
                "fiber_per_100g": nutriments.get("fiber_100g", 0),
                "image_url": product.get("image_url"),
                "barcode": product.get("code"),
                "source": "openfoodfacts"
            })
        
        return results
        
    except Exception as e:
        logger.warning(f"OpenFoodFacts API error: {e}")
        return []

async def get_product_by_barcode(barcode: str) -> Optional[FoodSearchResult]:
    """
    Récupérer un produit par son code-barres via OpenFoodFacts
    """
    try:
        url = f"https://fr.openfoodfacts.org/api/v0/product/{barcode}.json"
        response = requests.get(url, timeout=5)
        response.raise_for_status()
        data = response.json()
        
        if data.get("status") != 1:
            return None
            
        product = data.get("product", {})
        nutriments = product.get("nutriments", {})
        
        return FoodSearchResult(
            id=f"off_{barcode}",
            name=product.get("product_name", "Produit scanné"),
            brand=product.get("brands", "").split(",")[0] if product.get("brands") else None,
            category="produit scanné",
            calories_per_100g=nutriments.get("energy-kcal_100g", 0),
            proteins_per_100g=nutriments.get("proteins_100g", 0),
            carbs_per_100g=nutriments.get("carbohydrates_100g", 0),
            fats_per_100g=nutriments.get("fat_100g", 0),
            fiber_per_100g=nutriments.get("fiber_100g", 0),
            image_url=product.get("image_url"),
            barcode=barcode,
            source="openfoodfacts"
        )
        
    except Exception as e:
        logger.error(f"Barcode lookup error: {e}")
        return None

async def save_search_history(user_id: str, query: str):
    """
    Sauvegarder une recherche dans l'historique
    """
    try:
        supabase = get_supabase_client()
        
        supabase.table("search_history").insert({
            "user_id": user_id,
            "query": query,
            "searched_at": datetime.now().isoformat()
        }).execute()
        
    except Exception as e:
        logger.warning(f"Failed to save search history: {e}")
        # Ne pas bloquer la recherche si l'historique échoue
        pass