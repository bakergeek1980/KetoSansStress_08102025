from fastapi import APIRouter, Depends, HTTPException, status
from app.database.connection import get_supabase_client
from app.api.v1.auth import get_current_user
from pydantic import BaseModel
from typing import Optional, Dict, Any, Literal
from datetime import datetime
import json

router = APIRouter()

# Types pour les préférences
class UserPreferences(BaseModel):
    user_id: Optional[str] = None
    count_net_carbs: bool = True
    region: Literal['FR', 'BE', 'CH', 'CA', 'OTHER'] = 'FR'
    unit_system: Literal['metric', 'imperial'] = 'metric'
    dark_mode: bool = False
    theme_preference: Literal['light', 'dark', 'system'] = 'system'
    health_sync_enabled: bool = False
    health_sync_permissions: Dict[str, Any] = {}
    health_last_sync: Optional[str] = None
    notifications_enabled: bool = True
    auto_sync: bool = True
    data_saver_mode: bool = False
    biometric_lock: bool = False
    language: str = 'fr'
    timezone: str = 'Europe/Paris'
    date_format: str = 'DD/MM/YYYY'
    time_format: str = '24h'
    weight_unit: Literal['kg', 'lb'] = 'kg'
    height_unit: Literal['cm', 'ft'] = 'cm'
    liquid_unit: Literal['ml', 'fl_oz'] = 'ml'
    temperature_unit: Literal['celsius', 'fahrenheit'] = 'celsius'

class PreferencesUpdate(BaseModel):
    count_net_carbs: Optional[bool] = None
    region: Optional[Literal['FR', 'BE', 'CH', 'CA', 'OTHER']] = None
    unit_system: Optional[Literal['metric', 'imperial']] = None
    dark_mode: Optional[bool] = None
    theme_preference: Optional[Literal['light', 'dark', 'system']] = None
    health_sync_enabled: Optional[bool] = None
    health_sync_permissions: Optional[Dict[str, Any]] = None
    health_last_sync: Optional[str] = None
    notifications_enabled: Optional[bool] = None
    auto_sync: Optional[bool] = None
    data_saver_mode: Optional[bool] = None
    biometric_lock: Optional[bool] = None
    language: Optional[str] = None
    timezone: Optional[str] = None
    date_format: Optional[str] = None
    time_format: Optional[str] = None
    weight_unit: Optional[Literal['kg', 'lb']] = None
    height_unit: Optional[Literal['cm', 'ft']] = None
    liquid_unit: Optional[Literal['ml', 'fl_oz']] = None
    temperature_unit: Optional[Literal['celsius', 'fahrenheit']] = None

def get_default_preferences_by_region(region: str) -> Dict[str, Any]:
    """Retourne les préférences par défaut selon la région"""
    is_imperial = region == 'CA'
    
    timezone_map = {
        'FR': 'Europe/Paris',
        'BE': 'Europe/Brussels', 
        'CH': 'Europe/Zurich',
        'CA': 'America/Montreal',
    }
    
    return {
        'count_net_carbs': True,
        'region': region,
        'unit_system': 'imperial' if is_imperial else 'metric',
        'dark_mode': False,
        'theme_preference': 'system',
        'health_sync_enabled': False,
        'health_sync_permissions': {},
        'notifications_enabled': True,
        'auto_sync': True,
        'data_saver_mode': False,
        'biometric_lock': False,
        'language': 'fr',
        'timezone': timezone_map.get(region, 'Europe/Paris'),
        'date_format': 'DD/MM/YYYY',
        'time_format': '24h',
        'weight_unit': 'lb' if is_imperial else 'kg',
        'height_unit': 'ft' if is_imperial else 'cm',
        'liquid_unit': 'fl_oz' if is_imperial else 'ml',
        'temperature_unit': 'fahrenheit' if is_imperial else 'celsius',
    }

@router.get("/user-preferences/{user_id}", response_model=UserPreferences)
async def get_user_preferences(
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Récupérer les préférences d'un utilisateur"""
    if current_user.get("id") != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès non autorisé aux préférences de cet utilisateur"
        )
    
    supabase = get_supabase_client()
    
    try:
        # Récupérer les préférences depuis la base de données
        response = supabase.table("user_preferences").select("*").eq("user_id", user_id).execute()
        
        if response.data and len(response.data) > 0:
            prefs = response.data[0]
            
            # Convertir les JSONB en dict Python
            if isinstance(prefs.get('health_sync_permissions'), str):
                prefs['health_sync_permissions'] = json.loads(prefs['health_sync_permissions'])
            
            return UserPreferences(**prefs)
        else:
            # Créer des préférences par défaut si elles n'existent pas
            default_prefs = get_default_preferences_by_region('FR')
            default_prefs['user_id'] = user_id
            
            # Insérer les préférences par défaut
            insert_response = supabase.table("user_preferences").insert(default_prefs).execute()
            
            if insert_response.data:
                return UserPreferences(**insert_response.data[0])
            else:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Impossible de créer les préférences par défaut"
                )
                
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la récupération des préférences: {str(e)}"
        )

@router.post("/user-preferences", response_model=UserPreferences)
async def create_user_preferences(
    preferences: UserPreferences,
    current_user: dict = Depends(get_current_user)
):
    """Créer les préférences pour un utilisateur"""
    if preferences.user_id != current_user.get("id"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Impossible de créer des préférences pour un autre utilisateur"
        )
    
    supabase = get_supabase_client()
    
    try:
        # Convertir le modèle Pydantic en dict
        prefs_dict = preferences.dict()
        prefs_dict['created_at'] = datetime.utcnow().isoformat()
        prefs_dict['updated_at'] = datetime.utcnow().isoformat()
        
        # Insérer dans la base de données
        response = supabase.table("user_preferences").insert(prefs_dict).execute()
        
        if response.data:
            return UserPreferences(**response.data[0])
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Impossible de créer les préférences"
            )
            
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la création des préférences: {str(e)}"
        )

@router.patch("/user-preferences/{user_id}", response_model=UserPreferences)
async def update_user_preferences(
    user_id: str,
    updates: PreferencesUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Mettre à jour les préférences d'un utilisateur"""
    if current_user.get("id") != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès non autorisé aux préférences de cet utilisateur"
        )
    
    supabase = get_supabase_client()
    
    try:
        # Convertir en dict en excluant les valeurs None
        update_dict = {k: v for k, v in updates.dict().items() if v is not None}
        
        if not update_dict:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Aucune mise à jour fournie"
            )
        
        update_dict['updated_at'] = datetime.utcnow().isoformat()
        
        # Mettre à jour dans la base de données
        response = supabase.table("user_preferences").update(update_dict).eq("user_id", user_id).execute()
        
        if response.data and len(response.data) > 0:
            prefs = response.data[0]
            
            # Convertir les JSONB en dict Python
            if isinstance(prefs.get('health_sync_permissions'), str):
                prefs['health_sync_permissions'] = json.loads(prefs['health_sync_permissions'])
            
            return UserPreferences(**prefs)
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Préférences utilisateur non trouvées"
            )
            
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la mise à jour des préférences: {str(e)}"
        )

@router.put("/user-preferences/{user_id}", response_model=UserPreferences)
async def replace_user_preferences(
    user_id: str,
    preferences: UserPreferences,
    current_user: dict = Depends(get_current_user)
):
    """Remplacer complètement les préférences d'un utilisateur"""
    if current_user.get("id") != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès non autorisé aux préférences de cet utilisateur"
        )
    
    supabase = get_supabase_client()
    
    try:
        # Convertir le modèle Pydantic en dict
        prefs_dict = preferences.dict()
        prefs_dict['user_id'] = user_id
        prefs_dict['updated_at'] = datetime.utcnow().isoformat()
        
        # Remplacer dans la base de données (upsert)
        response = supabase.table("user_preferences").upsert(prefs_dict).execute()
        
        if response.data:
            prefs = response.data[0]
            
            # Convertir les JSONB en dict Python
            if isinstance(prefs.get('health_sync_permissions'), str):
                prefs['health_sync_permissions'] = json.loads(prefs['health_sync_permissions'])
            
            return UserPreferences(**prefs)
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Impossible de remplacer les préférences"
            )
            
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors du remplacement des préférences: {str(e)}"
        )

@router.delete("/user-preferences/{user_id}")
async def delete_user_preferences(
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Supprimer les préférences d'un utilisateur"""
    if current_user.get("id") != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès non autorisé aux préférences de cet utilisateur"
        )
    
    supabase = get_supabase_client()
    
    try:
        # Supprimer de la base de données
        response = supabase.table("user_preferences").delete().eq("user_id", user_id).execute()
        
        return {"message": "Préférences supprimées avec succès"}
            
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la suppression des préférences: {str(e)}"
        )

@router.get("/preferences/regions")
async def get_available_regions():
    """Récupérer la liste des régions disponibles"""
    return {
        "regions": [
            {"code": "FR", "name": "France", "default_units": "metric"},
            {"code": "BE", "name": "Belgique", "default_units": "metric"},
            {"code": "CH", "name": "Suisse", "default_units": "metric"},
            {"code": "CA", "name": "Canada", "default_units": "imperial"},
            {"code": "OTHER", "name": "Autre", "default_units": "metric"},
        ]
    }

@router.get("/preferences/units")
async def get_available_units():
    """Récupérer la liste des unités disponibles"""
    return {
        "weight_units": [
            {"code": "kg", "name": "Kilogrammes", "system": "metric"},
            {"code": "lb", "name": "Livres", "system": "imperial"}
        ],
        "height_units": [
            {"code": "cm", "name": "Centimètres", "system": "metric"},
            {"code": "ft", "name": "Pieds", "system": "imperial"}
        ],
        "liquid_units": [
            {"code": "ml", "name": "Millilitres", "system": "metric"},
            {"code": "fl_oz", "name": "Onces liquides", "system": "imperial"}
        ],
        "temperature_units": [
            {"code": "celsius", "name": "Celsius", "system": "metric"},
            {"code": "fahrenheit", "name": "Fahrenheit", "system": "imperial"}
        ]
    }