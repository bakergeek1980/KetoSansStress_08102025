from fastapi import APIRouter, Depends, HTTPException, File, UploadFile
from typing import List, Optional, Dict, Any
from app.auth.dependencies import get_current_user
from pydantic import BaseModel
import logging
import base64
import json
import os
from datetime import datetime

router = APIRouter(prefix="/vision", tags=["Vision"])

# Configuration des logs
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Modèles Pydantic
class FoodDetection(BaseModel):
    name: str
    confidence: float
    portion_estimate: str
    calories_estimate: Optional[int] = None
    
class NutritionalAnalysis(BaseModel):
    calories: int
    protein: float
    carbohydrates: float
    total_fat: float
    fiber: float
    sugar: Optional[float] = 0
    sodium: Optional[float] = 0
    keto_score: int
    confidence: float

class ImageAnalysisRequest(BaseModel):
    image_base64: str
    meal_type: str = "lunch"

class ImageAnalysisResponse(BaseModel):
    foods_detected: List[FoodDetection]
    total_nutrition: NutritionalAnalysis
    analysis_confidence: float
    processing_time_ms: int
    suggestions: List[str]

# Base de données des aliments pour la démo
FOOD_DATABASE = {
    "avocat": {"calories": 160, "protein": 2, "carbs": 9, "fat": 15, "fiber": 7, "keto_score": 9},
    "saumon": {"calories": 208, "protein": 25, "carbs": 0, "fat": 12, "fiber": 0, "keto_score": 10},
    "œuf": {"calories": 155, "protein": 13, "carbs": 1, "fat": 11, "fiber": 0, "keto_score": 10},
    "épinards": {"calories": 23, "protein": 3, "carbs": 4, "fat": 0, "fiber": 2, "keto_score": 8},
    "brocoli": {"calories": 34, "protein": 3, "carbs": 7, "fat": 0, "fiber": 3, "keto_score": 8},
    "fromage": {"calories": 380, "protein": 25, "carbs": 1, "fat": 30, "fiber": 0, "keto_score": 10},
    "poulet": {"calories": 165, "protein": 31, "carbs": 0, "fat": 4, "fiber": 0, "keto_score": 9},
    "amandes": {"calories": 579, "protein": 21, "carbs": 22, "fat": 50, "fiber": 12, "keto_score": 7},
}

@router.post("/analyze", response_model=ImageAnalysisResponse)
async def analyze_food_image(
    request: ImageAnalysisRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Analyser une image d'aliment et retourner les informations nutritionnelles
    """
    try:
        start_time = datetime.now()
        
        # ✅ Simulation d'analyse d'image intelligente
        # En production, ici on utiliserait OpenAI Vision API, Google Vision, etc.
        detected_foods = simulate_food_detection(request.image_base64)
        
        # Calculer les informations nutritionnelles totales
        total_nutrition = calculate_total_nutrition(detected_foods)
        
        # Générer des suggestions basées sur le profil keto
        suggestions = generate_keto_suggestions(detected_foods, total_nutrition)
        
        processing_time = (datetime.now() - start_time).total_seconds() * 1000
        
        return ImageAnalysisResponse(
            foods_detected=detected_foods,
            total_nutrition=total_nutrition,
            analysis_confidence=0.85,  # Confiance simulée
            processing_time_ms=int(processing_time),
            suggestions=suggestions
        )
        
    except Exception as e:
        logger.error(f"Image analysis error: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de l'analyse de l'image")

@router.post("/analyze-upload")
async def analyze_uploaded_image(
    file: UploadFile = File(...),
    meal_type: str = "lunch",
    current_user: dict = Depends(get_current_user)
):
    """
    Analyser une image uploadée
    """
    try:
        # Vérifier le type de fichier
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="Le fichier doit être une image")
        
        # Lire et encoder l'image
        image_data = await file.read()
        image_base64 = base64.b64encode(image_data).decode('utf-8')
        
        # Analyser via l'endpoint principal
        request = ImageAnalysisRequest(
            image_base64=image_base64,
            meal_type=meal_type
        )
        
        return await analyze_food_image(request, current_user)
        
    except Exception as e:
        logger.error(f"Image upload analysis error: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de l'analyse de l'image uploadée")

# Fonctions utilitaires

def simulate_food_detection(image_base64: str) -> List[FoodDetection]:
    """
    Simuler la détection d'aliments dans une image
    En production, ici on ferait appel à une vraie IA
    """
    try:
        # Analyser la taille de l'image pour simuler différents résultats
        image_size = len(image_base64)
        
        # Simulation intelligente basée sur des patterns
        if image_size < 50000:  # Petite image
            return [
                FoodDetection(
                    name="Œuf brouillé",
                    confidence=0.92,
                    portion_estimate="2 œufs (100g)",
                    calories_estimate=155
                )
            ]
        elif image_size < 100000:  # Image moyenne
            return [
                FoodDetection(
                    name="Saumon grillé",
                    confidence=0.88,
                    portion_estimate="1 filet (150g)",
                    calories_estimate=312
                ),
                FoodDetection(
                    name="Épinards",
                    confidence=0.75,
                    portion_estimate="1 poignée (50g)",
                    calories_estimate=12
                )
            ]
        else:  # Grande image - repas complet
            return [
                FoodDetection(
                    name="Avocat",
                    confidence=0.95,
                    portion_estimate="1/2 avocat (100g)",
                    calories_estimate=160
                ),
                FoodDetection(
                    name="Saumon",
                    confidence=0.90,
                    portion_estimate="1 filet (120g)",
                    calories_estimate=250
                ),
                FoodDetection(
                    name="Brocoli",
                    confidence=0.82,
                    portion_estimate="1 tasse (80g)",
                    calories_estimate=27
                )
            ]
            
    except Exception as e:
        logger.warning(f"Food detection simulation error: {e}")
        # Retour par défaut
        return [
            FoodDetection(
                name="Aliment détecté",
                confidence=0.70,
                portion_estimate="Portion moyenne",
                calories_estimate=200
            )
        ]

def calculate_total_nutrition(foods: List[FoodDetection]) -> NutritionalAnalysis:
    """
    Calculer les informations nutritionnelles totales
    """
    try:
        total_calories = 0
        total_protein = 0.0
        total_carbs = 0.0
        total_fat = 0.0
        total_fiber = 0.0
        confidences = []
        
        for food in foods:
            # Extraire les informations de base
            food_name_lower = food.name.lower()
            
            # Chercher dans notre base de données d'aliments
            nutrition_data = None
            for db_food_name, db_nutrition in FOOD_DATABASE.items():
                if db_food_name in food_name_lower or food_name_lower in db_food_name:
                    nutrition_data = db_nutrition
                    break
            
            if not nutrition_data:
                # Valeurs par défaut si aliment non trouvé
                nutrition_data = {"calories": 100, "protein": 5, "carbs": 10, "fat": 5, "fiber": 2, "keto_score": 5}
            
            # Estimer la quantité basée sur la portion
            quantity_multiplier = estimate_quantity_from_portion(food.portion_estimate)
            
            total_calories += nutrition_data["calories"] * quantity_multiplier
            total_protein += nutrition_data["protein"] * quantity_multiplier
            total_carbs += nutrition_data["carbs"] * quantity_multiplier
            total_fat += nutrition_data["fat"] * quantity_multiplier
            total_fiber += nutrition_data["fiber"] * quantity_multiplier
            
            confidences.append(food.confidence)
        
        # Calculer le score keto global
        keto_score = calculate_meal_keto_score(total_calories, total_carbs, total_fat, total_fiber)
        
        # Confiance moyenne
        avg_confidence = sum(confidences) / len(confidences) if confidences else 0.7
        
        return NutritionalAnalysis(
            calories=int(total_calories),
            protein=round(total_protein, 1),
            carbohydrates=round(total_carbs, 1),
            total_fat=round(total_fat, 1),
            fiber=round(total_fiber, 1),
            sugar=round(total_carbs * 0.3, 1),  # Estimation
            sodium=200.0,  # Estimation par défaut
            keto_score=keto_score,
            confidence=round(avg_confidence, 2)
        )
        
    except Exception as e:
        logger.error(f"Nutrition calculation error: {e}")
        # Retour par défaut sécurisé
        return NutritionalAnalysis(
            calories=200,
            protein=15.0,
            carbohydrates=8.0,
            total_fat=12.0,
            fiber=3.0,
            keto_score=7,
            confidence=0.60
        )

def estimate_quantity_from_portion(portion_text: str) -> float:
    """
    Estimer la quantité à partir de la description de portion
    """
    portion_lower = portion_text.lower()
    
    if "petite" in portion_lower or "small" in portion_lower:
        return 0.7
    elif "grande" in portion_lower or "large" in portion_lower:
        return 1.5
    elif "2" in portion_lower:
        return 2.0
    elif "1/2" in portion_lower:
        return 0.5
    else:
        return 1.0  # Portion normale

def calculate_meal_keto_score(calories: float, carbs: float, fat: float, fiber: float) -> int:
    """
    Calculer le score keto d'un repas complet
    """
    try:
        if calories <= 0:
            return 5
        
        net_carbs = max(0, carbs - fiber)
        carbs_percentage = (net_carbs * 4 / calories) * 100
        fat_percentage = (fat * 9 / calories) * 100
        
        if carbs_percentage <= 5 and fat_percentage >= 70:
            return 10
        elif carbs_percentage <= 8 and fat_percentage >= 60:
            return 9
        elif carbs_percentage <= 12 and fat_percentage >= 50:
            return 8
        elif carbs_percentage <= 15:
            return 7
        elif carbs_percentage <= 20:
            return 6
        else:
            return max(1, 5 - int(carbs_percentage / 10))
            
    except Exception:
        return 5

def generate_keto_suggestions(foods: List[FoodDetection], nutrition: NutritionalAnalysis) -> List[str]:
    """
    Générer des suggestions basées sur l'analyse keto
    """
    suggestions = []
    
    try:
        # Suggestions basées sur le score keto
        if nutrition.keto_score >= 8:
            suggestions.append("🎉 Excellent choix keto ! Ce repas respecte parfaitement les ratios.")
        elif nutrition.keto_score >= 6:
            suggestions.append("✅ Bon repas keto. Vous pourriez ajouter un peu plus de lipides.")
        else:
            suggestions.append("⚠️ Ce repas contient beaucoup de glucides pour un régime keto.")
        
        # Suggestions spécifiques sur les macros
        carbs_percentage = (nutrition.carbohydrates * 4 / nutrition.calories) * 100 if nutrition.calories > 0 else 0
        
        if carbs_percentage > 10:
            suggestions.append(f"💡 Les glucides représentent {carbs_percentage:.1f}% des calories. Visez moins de 5% en keto.")
        
        if nutrition.total_fat < 10:
            suggestions.append("💡 Ajoutez plus de lipides sains : avocat, huile d'olive, ou noix.")
        
        # Suggestions d'amélioration
        detected_food_names = [food.name.lower() for food in foods]
        
        if any("légume" in name or "salade" in name for name in detected_food_names):
            suggestions.append("🥗 Les légumes verts sont parfaits ! Ajoutez de l'huile d'olive pour plus de lipides.")
        
        if nutrition.fiber > 5:
            suggestions.append("🌱 Excellente source de fibres pour la digestion !")
        
        # Suggestion de portions
        if nutrition.calories < 300:
            suggestions.append("🍽️ Ce repas semble léger. Pensez à ajouter des protéines ou lipides.")
        elif nutrition.calories > 800:
            suggestions.append("⚖️ Repas copieux ! Parfait si c'est votre repas principal.")
            
    except Exception as e:
        logger.warning(f"Suggestion generation error: {e}")
        suggestions = ["📊 Analyse nutritionnelle terminée avec succès !"]
    
    return suggestions[:4]  # Limiter à 4 suggestions