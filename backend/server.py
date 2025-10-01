from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
import os
from pymongo import MongoClient
from datetime import datetime
import base64
import asyncio
from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
from dotenv import load_dotenv
import json

# Charger les variables d'environnement
load_dotenv()

app = FastAPI(title="KetoScan API", version="1.0.0")

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration MongoDB
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
client = MongoClient(MONGO_URL)
db = client.keto_scan_db

# Configuration Emergent LLM
EMERGENT_LLM_KEY = os.getenv("EMERGENT_LLM_KEY")

# Modèles Pydantic
class UserProfile(BaseModel):
    name: str
    email: str
    age: int
    gender: str
    weight: float
    height: float
    activity_level: str
    goal: str  # perte_poids, maintenance, prise_masse
    daily_calories: Optional[float] = None
    daily_carbs: Optional[float] = None
    daily_proteins: Optional[float] = None
    daily_fats: Optional[float] = None

class MealAnalysis(BaseModel):
    image_base64: str
    meal_type: str  # petit_dejeuner, dejeuner, diner, collation

class NutritionalInfo(BaseModel):
    calories: float
    proteins: float
    carbs: float
    net_carbs: float
    fats: float
    fiber: float
    keto_score: int  # 1-10
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

# Base de données nutritionnelle française (échantillon)
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

async def analyze_meal_with_ai(image_base64: str) -> NutritionalInfo:
    """Analyse un repas avec l'IA et calcule les informations nutritionnelles"""
    try:
        # Initialiser le chat LLM avec Emergent
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"meal_analysis_{datetime.now().timestamp()}",
            system_message="Tu es un expert en nutrition française spécialisé dans le régime cétogène. Analyse les images de repas et fournis des informations nutritionnelles précises en français. Concentre-toi sur les aliments français et les portions typiques."
        ).with_model("openai", "gpt-4o")

        # Créer le message avec l'image
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

        # Envoyer le message et obtenir la réponse
        response = await chat.send_message(user_message)
        
        # Parser la réponse JSON
        try:
            # Extraire le JSON de la réponse
            json_start = response.find('{')
            json_end = response.rfind('}') + 1
            if json_start != -1 and json_end != -1:
                json_str = response[json_start:json_end]
                nutrition_data = json.loads(json_str)
            else:
                raise ValueError("No JSON found in response")
        except (json.JSONDecodeError, ValueError):
            # Fallback avec valeurs par défaut si le parsing échoue
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
        print(f"Erreur lors de l'analyse IA: {str(e)}")
        # Retourner des valeurs par défaut en cas d'erreur
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

def calculate_daily_macros(profile: UserProfile) -> dict:
    """Calcule les macros quotidiennes basées sur le profil utilisateur"""
    # Formule Katch-McArdle pour le métabolisme de base
    activity_multipliers = {
        "sedentaire": 1.2,
        "leger": 1.375,
        "modere": 1.55,
        "intense": 1.725,
        "extreme": 1.9
    }
    
    # Estimation du pourcentage de graisse corporelle
    if profile.gender == "homme":
        bf_percentage = max(10, min(25, 20 - (profile.height - 175) * 0.1))
    else:
        bf_percentage = max(16, min(35, 25 - (profile.height - 165) * 0.1))
    
    lean_mass = profile.weight * (1 - bf_percentage / 100)
    bmr = 370 + (21.6 * lean_mass)
    
    activity_multiplier = activity_multipliers.get(profile.activity_level, 1.375)
    tdee = bmr * activity_multiplier
    
    # Ajustement selon l'objectif
    if profile.goal == "perte_poids":
        daily_calories = tdee - 500  # Déficit de 500 calories
    elif profile.goal == "prise_masse":
        daily_calories = tdee + 300  # Surplus de 300 calories
    else:
        daily_calories = tdee  # Maintenance
    
    # Macros keto typiques (5% glucides, 20% protéines, 75% lipides)
    daily_carbs = (daily_calories * 0.05) / 4  # 5% en glucides
    daily_proteins = (daily_calories * 0.20) / 4  # 20% en protéines
    daily_fats = (daily_calories * 0.75) / 9  # 75% en lipides
    
    return {
        "calories": round(daily_calories),
        "carbs": round(daily_carbs),
        "proteins": round(daily_proteins),
        "fats": round(daily_fats)
    }

# Endpoints API

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "KetoScan API"}

@app.post("/api/users/profile")
async def create_or_update_profile(profile: UserProfile):
    """Créer ou mettre à jour le profil utilisateur"""
    try:
        # Calculer les macros quotidiennes
        daily_macros = calculate_daily_macros(profile)
        
        profile_dict = profile.dict()
        profile_dict.update(daily_macros)
        profile_dict["updated_at"] = datetime.now().isoformat()
        
        # Utiliser email comme identifiant unique
        result = db.user_profiles.update_one(
            {"email": profile.email},
            {"$set": profile_dict},
            upsert=True
        )
        
        return {
            "message": "Profil sauvegardé avec succès",
            "profile_id": str(result.upserted_id) if result.upserted_id else "updated",
            "daily_macros": daily_macros
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la sauvegarde: {str(e)}")

@app.get("/api/users/profile/{email}")
async def get_profile(email: str):
    """Récupérer le profil utilisateur"""
    profile = db.user_profiles.find_one({"email": email})
    if not profile:
        raise HTTPException(status_code=404, detail="Profil non trouvé")
    
    profile["_id"] = str(profile["_id"])
    return profile

@app.post("/api/meals/analyze")
async def analyze_meal(analysis_request: MealAnalysis):
    """Analyser un repas avec l'IA"""
    try:
        # Analyser l'image avec l'IA
        nutritional_info = await analyze_meal_with_ai(analysis_request.image_base64)
        
        return {
            "success": True,
            "nutritional_info": nutritional_info.dict(),
            "meal_type": analysis_request.meal_type,
            "analyzed_at": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de l'analyse: {str(e)}")

@app.post("/api/meals/save")
async def save_meal(meal: MealEntry):
    """Sauvegarder un repas analysé"""
    try:
        meal_dict = meal.dict()
        meal_dict["created_at"] = datetime.now().isoformat()
        meal_dict["date"] = meal.date or datetime.now().strftime("%Y-%m-%d")
        
        result = db.meals.insert_one(meal_dict)
        
        return {
            "message": "Repas sauvegardé avec succès",
            "meal_id": str(result.inserted_id)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la sauvegarde: {str(e)}")

@app.get("/api/meals/user/{user_id}")
async def get_user_meals(user_id: str, date: Optional[str] = None):
    """Récupérer les repas d'un utilisateur"""
    try:
        query = {"user_id": user_id}
        if date:
            query["date"] = date
        
        meals = list(db.meals.find(query).sort("created_at", -1).limit(50))
        
        # Convertir ObjectId en string
        for meal in meals:
            meal["_id"] = str(meal["_id"])
        
        return {"meals": meals}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération: {str(e)}")

@app.get("/api/meals/daily-summary/{user_id}")
async def get_daily_summary(user_id: str, date: Optional[str] = None):
    """Récupérer le résumé nutritionnel quotidien"""
    try:
        target_date = date or datetime.now().strftime("%Y-%m-%d")
        
        meals = list(db.meals.find({"user_id": user_id, "date": target_date}))
        
        total_calories = sum(meal["nutritional_info"]["calories"] for meal in meals)
        total_proteins = sum(meal["nutritional_info"]["proteins"] for meal in meals)
        total_carbs = sum(meal["nutritional_info"]["carbs"] for meal in meals)
        total_net_carbs = sum(meal["nutritional_info"]["net_carbs"] for meal in meals)
        total_fats = sum(meal["nutritional_info"]["fats"] for meal in meals)
        total_fiber = sum(meal["nutritional_info"]["fiber"] for meal in meals)
        
        # Récupérer les objectifs de l'utilisateur
        profile = db.user_profiles.find_one({"email": user_id})  # Assuming user_id is email
        daily_targets = {
            "calories": profile.get("calories", 2000) if profile else 2000,
            "carbs": profile.get("carbs", 25) if profile else 25,
            "proteins": profile.get("proteins", 100) if profile else 100,
            "fats": profile.get("fats", 150) if profile else 150
        }
        
        return {
            "date": target_date,
            "totals": {
                "calories": round(total_calories, 1),
                "proteins": round(total_proteins, 1),
                "carbs": round(total_carbs, 1),
                "net_carbs": round(total_net_carbs, 1),
                "fats": round(total_fats, 1),
                "fiber": round(total_fiber, 1)
            },
            "targets": daily_targets,
            "progress": {
                "calories": round((total_calories / daily_targets["calories"]) * 100, 1),
                "carbs": round((total_net_carbs / daily_targets["carbs"]) * 100, 1),
                "proteins": round((total_proteins / daily_targets["proteins"]) * 100, 1),
                "fats": round((total_fats / daily_targets["fats"]) * 100, 1)
            },
            "meals_count": len(meals),
            "keto_status": "excellent" if total_net_carbs <= daily_targets["carbs"] else "attention" if total_net_carbs <= daily_targets["carbs"] * 1.5 else "dépassé"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors du calcul du résumé: {str(e)}")

@app.post("/api/weight/save")
async def save_weight(weight_entry: WeightEntry):
    """Sauvegarder une mesure de poids"""
    try:
        weight_dict = weight_entry.dict()
        weight_dict["created_at"] = datetime.now().isoformat()
        
        result = db.weight_entries.insert_one(weight_dict)
        
        return {
            "message": "Poids sauvegardé avec succès",
            "entry_id": str(result.inserted_id)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la sauvegarde: {str(e)}")

@app.get("/api/weight/history/{user_id}")
async def get_weight_history(user_id: str, days: int = 30):
    """Récupérer l'historique de poids"""
    try:
        weights = list(db.weight_entries.find({"user_id": user_id})
                      .sort("date", -1)
                      .limit(days))
        
        for weight in weights:
            weight["_id"] = str(weight["_id"])
        
        return {"weights": weights}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération: {str(e)}")

@app.get("/api/foods/search/{query}")
async def search_foods(query: str):
    """Rechercher des aliments dans la base de données française"""
    try:
        # Recherche simple dans la base de données d'aliments français
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
        raise HTTPException(status_code=500, detail=f"Erreur lors de la recherche: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)