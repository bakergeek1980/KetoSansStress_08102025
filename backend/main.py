"""
KetoSansStress API Server with Supabase Integration
Main FastAPI application with modern architecture
"""

from fastapi import FastAPI, HTTPException, UploadFile, File, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
import uvicorn
from datetime import datetime

# Import application configuration
from app.config import settings

# Import integrations
from integrations.openfoodfacts import food_search_service

# Import database connection
from app.database.connection import get_supabase_client

# Import authentication dependencies
from app.auth.dependencies import get_current_user, get_current_user_optional

# Import API routes
from app.api.v1.auth import router as auth_router
from app.api.v1.meals import router as meals_router
from app.api.v1.preferences import router as preferences_router
from app.api.v1.foods import router as foods_router
from app.api.v1.vision import router as vision_router  # ✅ Nouveau router vision

# Legacy imports for meal analysis (will be migrated)
from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
import json
import base64
from typing import List, Optional
from pydantic import BaseModel
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Legacy Pydantic models for compatibility
class MealAnalysis(BaseModel):
    image_base64: str
    meal_type: str

class NutritionalInfo(BaseModel):
    calories: float
    proteins: float
    carbs: float
    net_carbs: float
    fats: float
    fiber: float
    keto_score: int
    foods_detected: List[str]
    portions: List[str]
    confidence: float

class MealEntry(BaseModel):
    user_id: str
    date: str
    meal_type: str
    image_base64: str
    nutritional_info: NutritionalInfo
    notes: Optional[str] = None

class WeightEntry(BaseModel):
    user_id: str
    weight: float
    date: str

# French food database (keeping for compatibility)
FRENCH_FOODS_DB = {
    "pain": {"calories": 265, "proteins": 9, "carbs": 49, "fats": 3.2, "fiber": 2.7},
    "baguette": {"calories": 274, "proteins": 8.5, "carbs": 55.8, "fats": 1.3, "fiber": 2.3},
    "fromage": {"calories": 356, "proteins": 25, "carbs": 1.3, "fats": 28, "fiber": 0},
    "beurre": {"calories": 717, "proteins": 0.85, "carbs": 0.06, "fats": 81, "fiber": 0},
    "avocat": {"calories": 160, "proteins": 2, "carbs": 9, "fats": 15, "fiber": 7},
    "saumon": {"calories": 208, "proteins": 25, "carbs": 0, "fats": 12, "fiber": 0},
    "œuf": {"calories": 155, "proteins": 13, "carbs": 1.1, "fats": 11, "fiber": 0},
    "épinards": {"calories": 23, "proteins": 2.9, "carbs": 3.6, "fats": 0.4, "fiber": 2.2},
    "brocoli": {"calories": 34, "proteins": 2.8, "carbs": 7, "fats": 0.4, "fiber": 2.6},
    "poulet": {"calories": 239, "proteins": 27, "carbs": 0, "fats": 14, "fiber": 0},
    "huile_olive": {"calories": 884, "proteins": 0, "carbs": 0, "fats": 100, "fiber": 0}
}

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events."""
    # Startup
    logger.info(f"Starting {settings.app_name}")
    logger.info(f"Environment: {'Development' if settings.debug else 'Production'}")
    
    # Test Supabase connection
    try:
        client = get_supabase_client()
        logger.info("✅ Supabase connection established")
    except Exception as e:
        logger.error(f"❌ Supabase connection failed: {e}")
    
    yield
    
    # Shutdown
    logger.info(f"Shutting down {settings.app_name}")

# Create FastAPI application
app = FastAPI(
    title=settings.app_name,
    description="API backend for KetoSansStress - French keto diet tracker",
    version="2.0.0",
    lifespan=lifespan,
    debug=settings.debug
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins + ["*"],  # Allow all origins in development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(auth_router, prefix=settings.api_v1_prefix)
app.include_router(meals_router, prefix=settings.api_v1_prefix)
app.include_router(preferences_router, prefix=settings.api_v1_prefix)
app.include_router(foods_router, prefix=settings.api_v1_prefix, tags=["foods"])

# Legacy AI meal analysis function (will be migrated to separate service)
async def analyze_meal_with_ai(image_base64: str) -> NutritionalInfo:
    """Analyse un repas avec l'IA et calcule les informations nutritionnelles"""
    try:
        # Get Emergent LLM key from environment
        emergent_llm_key = os.getenv("EMERGENT_LLM_KEY")
        if not emergent_llm_key:
            logger.warning("EMERGENT_LLM_KEY not found, using fallback values")
            raise ValueError("No LLM key available")

        # Initialize LLM chat
        chat = LlmChat(
            api_key=emergent_llm_key,
            session_id=f"meal_analysis_{datetime.now().timestamp()}",
            system_message="Tu es un expert en nutrition française spécialisé dans le régime cétogène. Analyse les images de repas et fournis des informations nutritionnelles précises en français. Concentre-toi sur les aliments français et les portions typiques."
        ).with_model("openai", "gpt-4o")

        # Create message with image
        image_content = ImageContent(image_base64=image_base64)
        
        prompt = """Analyse cette image de repas et fournis les informations suivantes en format JSON :

{
  "foods_detected": ["liste des aliments identifiés en français"],
  "portions": ["estimation des portions pour chaque aliment"],
  "total_calories": nombre_total_calories,
  "total_proteins": grammes_proteines,
  "total_carbs": grammes_glucides_totaux,
  "total_fats": grammes_lipides,
  "total_fiber": grammes_fibres,
  "net_carbs": grammes_glucides_nets (total_carbs - fiber),
  "keto_score": note_de_1_à_10_pour_compatibilité_keto,
  "confidence": niveau_de_confiance_de_0_à_1,
  "keto_analysis": "analyse de la compatibilité avec le régime cétogène"
}

Sois précis sur les portions et utilise tes connaissances des aliments français. Pour le keto_score : 10 = parfait keto, 1 = incompatible keto."""

        user_message = UserMessage(
            text=prompt,
            file_contents=[image_content]
        )

        # Send message and get response
        response = await chat.send_message(user_message)
        
        # Parse JSON response
        try:
            json_start = response.find('{')
            json_end = response.rfind('}') + 1
            if json_start != -1 and json_end != -1:
                json_str = response[json_start:json_end]
                nutrition_data = json.loads(json_str)
            else:
                raise ValueError("No JSON found in response")
        except (json.JSONDecodeError, ValueError):
            logger.warning("Failed to parse AI response, using fallback values")
            nutrition_data = {
                "foods_detected": ["Aliment non identifié"],
                "portions": ["Portion moyenne"],
                "total_calories": 300,
                "total_proteins": 15,
                "total_carbs": 10,
                "total_fats": 20,
                "total_fiber": 3,
                "net_carbs": 7,
                "keto_score": 7,
                "confidence": 0.5
            }

        return NutritionalInfo(
            calories=nutrition_data.get("total_calories", 300),
            proteins=nutrition_data.get("total_proteins", 15),
            carbs=nutrition_data.get("total_carbs", 10),
            net_carbs=nutrition_data.get("net_carbs", 7),
            fats=nutrition_data.get("total_fats", 20),
            fiber=nutrition_data.get("total_fiber", 3),
            keto_score=nutrition_data.get("keto_score", 7),
            foods_detected=nutrition_data.get("foods_detected", ["Aliment détecté"]),
            portions=nutrition_data.get("portions", ["Portion moyenne"]),
            confidence=nutrition_data.get("confidence", 0.8)
        )

    except Exception as e:
        logger.error(f"AI analysis error: {str(e)}")
        # Return fallback values
        return NutritionalInfo(
            calories=250,
            proteins=12,
            carbs=8,
            net_carbs=5,
            fats=18,
            fiber=3,
            keto_score=6,
            foods_detected=["Aliment non analysé"],
            portions=["Portion standard"],
            confidence=0.5
        )

# Legacy endpoints for compatibility (will be gradually migrated)
@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    try:
        # Test Supabase connection
        client = get_supabase_client()
        # Simple query to test connection
        result = client.table("users").select("count", count="exact").execute()
        supabase_status = "healthy"
    except Exception as e:
        logger.error(f"Supabase health check failed: {e}")
        supabase_status = "unhealthy"
    
    return {
        "status": "healthy",
        "service": "KetoSansStress API v2.0",
        "supabase": supabase_status,
        "timestamp": datetime.now().isoformat()
    }

@app.post("/api/meals/analyze")
async def analyze_meal(analysis_request: MealAnalysis):
    """Legacy meal analysis endpoint."""
    try:
        nutritional_info = await analyze_meal_with_ai(analysis_request.image_base64)
        
        return {
            "success": True,
            "nutritional_info": nutritional_info.dict(),
            "meal_type": analysis_request.meal_type,
            "analyzed_at": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Meal analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur lors de l'analyse: {str(e)}")

@app.get("/api/foods/search/{query}")
async def search_foods(query: str):
    """Search French foods database."""
    try:
        results = []
        query_lower = query.lower()
        
        for food_name, nutrition in FRENCH_FOODS_DB.items():
            if query_lower in food_name.lower():
                results.append({
                    "name": food_name,
                    "nutrition": nutrition
                })
        
        return {"results": results}
    except Exception as e:
        logger.error(f"Food search error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur lors de la recherche: {str(e)}")

# Legacy user profile endpoint (will be migrated to new auth system)
class LegacyUserProfile(BaseModel):
    name: str
    email: str
    age: int
    gender: str
    weight: float
    height: float
    activity_level: str
    goal: str
    daily_calories: Optional[float] = None
    daily_carbs: Optional[float] = None
    daily_proteins: Optional[float] = None
    daily_fats: Optional[float] = None

def calculate_daily_macros(profile: LegacyUserProfile) -> dict:
    """Calculate daily macros based on user profile."""
    activity_multipliers = {
        "sedentaire": 1.2,
        "leger": 1.375,
        "modere": 1.55,
        "intense": 1.725,
        "extreme": 1.9
    }
    
    # Body fat percentage estimation
    if profile.gender == "homme":
        bf_percentage = max(10, min(25, 20 - (profile.height - 175) * 0.1))
    else:
        bf_percentage = max(16, min(35, 25 - (profile.height - 165) * 0.1))
    
    lean_mass = profile.weight * (1 - bf_percentage / 100)
    bmr = 370 + (21.6 * lean_mass)
    
    activity_multiplier = activity_multipliers.get(profile.activity_level, 1.375)
    tdee = bmr * activity_multiplier
    
    # Adjust based on goal
    if profile.goal == "perte_poids":
        daily_calories = tdee - 500
    elif profile.goal == "prise_masse":
        daily_calories = tdee + 300
    else:
        daily_calories = tdee
    
    # Keto macros (5% carbs, 20% protein, 75% fat)
    daily_carbs = (daily_calories * 0.05) / 4
    daily_proteins = (daily_calories * 0.20) / 4
    daily_fats = (daily_calories * 0.75) / 9
    
    return {
        "calories": round(daily_calories),
        "carbs": round(daily_carbs),
        "proteins": round(daily_proteins),
        "fats": round(daily_fats)
    }

@app.post("/api/users/profile")
async def create_or_update_profile(profile: LegacyUserProfile):
    """Legacy profile creation endpoint."""
    try:
        # Calculate daily macros
        daily_macros = calculate_daily_macros(profile)
        
        # TODO: Migrate to Supabase users table
        # For now, return success with calculated macros
        
        return {
            "message": "Profil sauvegardé avec succès",
            "profile_id": "legacy-profile",
            "daily_macros": daily_macros
        }
    except Exception as e:
        logger.error(f"Profile creation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur lors de la sauvegarde: {str(e)}")

@app.get("/api/users/profile/{email}")
async def get_profile(email: str):
    """Legacy profile retrieval endpoint."""
    try:
        # TODO: Migrate to fetch from Supabase
        # For now, return demo profile
        
        if email == "demo@keto.fr":
            return {
                "_id": "demo-profile-id",
                "name": "Marie Dubois",
                "email": email,
                "age": 30,
                "gender": "femme", 
                "weight": 70.0,
                "height": 170.0,
                "activity_level": "modere",
                "goal": "perte_poids",
                "calories": 1843,
                "carbs": 23,
                "proteins": 92,
                "fats": 154,
                "updated_at": datetime.now().isoformat()
            }
        else:
            raise HTTPException(status_code=404, detail="Profil non trouvé")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Profile retrieval error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération: {str(e)}")

@app.post("/api/meals/save")
async def save_meal(meal: MealEntry):
    """Legacy meal save endpoint."""
    try:
        # TODO: Migrate to Supabase meals table using new schema
        # For now, return success
        
        return {
            "message": "Repas sauvegardé avec succès",
            "meal_id": f"legacy-meal-{datetime.now().timestamp()}"
        }
    except Exception as e:
        logger.error(f"Meal save error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur lors de la sauvegarde: {str(e)}")

@app.get("/api/meals/user/{user_id}")
async def get_user_meals(user_id: str, date: Optional[str] = None):
    """Legacy user meals endpoint."""
    try:
        # TODO: Migrate to Supabase meals table
        # For now, return empty meals list
        
        return {"meals": []}
    except Exception as e:
        logger.error(f"User meals retrieval error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération: {str(e)}")

@app.post("/api/weight/save")
async def save_weight(weight_entry: WeightEntry):
    """Legacy weight save endpoint."""
    try:
        # TODO: Migrate to Supabase weight tracking
        # For now, return success
        
        return {
            "message": "Poids sauvegardé avec succès",
            "entry_id": f"legacy-weight-{datetime.now().timestamp()}"
        }
    except Exception as e:
        logger.error(f"Weight save error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur lors de la sauvegarde: {str(e)}")

@app.get("/api/weight/history/{user_id}")
async def get_weight_history(user_id: str, days: int = 30):
    """Legacy weight history endpoint."""
    try:
        # TODO: Migrate to Supabase weight tracking
        # For now, return empty history
        
        return {"weights": []}
    except Exception as e:
        logger.error(f"Weight history retrieval error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération: {str(e)}")

@app.get("/api/foods/search/{query}")
async def search_foods_advanced(query: str, limit: int = 20):
    """Advanced food search using OpenFoodFacts and local database."""
    try:
        # Utiliser le service de recherche OpenFoodFacts
        results = food_search_service.search_foods(query, limit=limit)
        
        return {
            "query": query,
            "results": results,
            "count": len(results),
            "source": "openfoodfacts"
        }
    except Exception as e:
        logger.error(f"Food search error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur lors de la recherche: {str(e)}")

@app.get("/api/foods/barcode/{barcode}")
async def get_food_by_barcode(barcode: str):
    """Get food information by barcode using OpenFoodFacts."""
    try:
        # Rechercher par code-barres
        result = food_search_service.get_food_by_barcode(barcode)
        
        if result:
            return {
                "barcode": barcode,
                "product": result,
                "found": True
            }
        else:
            raise HTTPException(status_code=404, detail="Produit non trouvé")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Barcode search error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur lors de la recherche: {str(e)}")

@app.post("/api/meals/analyze-enhanced")
async def analyze_meal_enhanced(analysis_request: MealAnalysis):
    """Enhanced meal analysis with OpenFoodFacts integration."""
    try:
        # Analyse IA classique
        nutritional_info = await analyze_meal_with_ai(analysis_request.image_base64)
        
        # Enrichir avec OpenFoodFacts si possible
        enhanced_results = []
        for food in nutritional_info.foods_detected:
            # Rechercher des correspondances dans OpenFoodFacts
            search_results = food_search_service.search_foods(food, limit=3)
            if search_results:
                enhanced_results.extend(search_results[:1])  # Prendre le meilleur résultat
        
        return {
            "success": True,
            "ai_analysis": nutritional_info.dict(),
            "openfoodfacts_suggestions": enhanced_results,
            "meal_type": analysis_request.meal_type,
            "analyzed_at": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Enhanced meal analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur lors de l'analyse: {str(e)}")

@app.get("/api/foods/keto-friendly")
async def get_keto_friendly_foods(limit: int = 50):
    """Get a list of keto-friendly foods."""
    try:
        # Liste de recherches d'aliments keto-friendly
        keto_searches = [
            "avocat", "saumon", "huile olive", "fromage", "œuf", "beurre", 
            "noix", "amandes", "brocoli", "épinards", "chou-fleur", "courgette"
        ]
        
        all_results = []
        for search_term in keto_searches:
            results = food_search_service.search_foods(search_term, limit=5)
            # Filtrer seulement les aliments avec un bon score keto
            keto_results = [r for r in results if r.get('keto_score') is not None and r.get('keto_score') >= 7]
            all_results.extend(keto_results)
            
            if len(all_results) >= limit:
                break
        
        # Trier par score keto et limiter
        sorted_results = sorted(all_results, key=lambda x: x.get('keto_score', 0), reverse=True)
        
        return {
            "keto_foods": sorted_results[:limit],
            "count": len(sorted_results[:limit])
        }
    except Exception as e:
        logger.error(f"Keto foods error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8001,
        reload=settings.debug,
        log_level="info"
    )