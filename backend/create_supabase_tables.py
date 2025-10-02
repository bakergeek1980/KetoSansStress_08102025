#!/usr/bin/env python3
"""
Création des tables et données Supabase via l'API Python
"""

import os
import sys
from dotenv import load_dotenv
from supabase import create_client, Client
import logging
from datetime import datetime

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_admin_client():
    """Obtenir le client Supabase avec les droits administrateur"""
    supabase_url = os.getenv("SUPABASE_URL")
    service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not supabase_url or not service_role_key:
        raise ValueError("Clés Supabase manquantes")
    
    return create_client(supabase_url, service_role_key)

def create_demo_user_if_not_exists(client: Client):
    """Créer l'utilisateur de démonstration s'il n'existe pas"""
    try:
        # Vérifier si l'utilisateur existe déjà
        response = client.table('users').select('*').eq('email', 'contact@ketosansstress.com').execute()
        
        if response.data:
            logger.info("✅ Utilisateur contact@ketosansstress.com existe déjà")
            user_id = response.data[0]['id']
        else:
            # Créer un nouvel utilisateur avec un UUID fixe
            user_id = "11111111-1111-1111-1111-111111111111"
            
            user_data = {
                "id": user_id,
                "email": "contact@ketosansstress.com",
                "full_name": "Contact Keto Sans Stress",
                "target_calories": 1843,
                "target_protein": 92,
                "target_carbs": 23,
                "target_fat": 154,
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            }
            
            response = client.table('users').insert(user_data).execute()
            logger.info("✅ Utilisateur contact@ketosansstress.com créé")
        
        return user_id
        
    except Exception as e:
        logger.error(f"Erreur lors de la création de l'utilisateur: {str(e)}")
        # Si l'insertion échoue, essayer de récupérer l'ID existant
        try:
            response = client.table('users').select('id').eq('email', 'contact@ketosansstress.com').execute()
            if response.data:
                return response.data[0]['id']
        except:
            pass
        return "11111111-1111-1111-1111-111111111111"

def add_demo_meals(client: Client, user_id: str):
    """Ajouter des repas de démonstration"""
    try:
        # Supprimer les anciens repas
        client.table('meals').delete().eq('user_id', user_id).execute()
        
        demo_meals = [
            {
                "user_id": user_id,
                "meal_type": "breakfast",
                "food_name": "Œufs brouillés avec avocat",
                "quantity": 1.0,
                "unit": "portion",
                "calories": 420,
                "protein": 18.0,
                "carbohydrates": 6.0,
                "total_fat": 38.0,
                "fiber": 5.0,
                "keto_score": 9,
                "consumed_at": datetime.now().replace(hour=8, minute=0).isoformat(),
                "created_at": datetime.now().isoformat()
            },
            {
                "user_id": user_id,
                "meal_type": "lunch", 
                "food_name": "Saumon grillé avec épinards",
                "quantity": 1.0,
                "unit": "portion",
                "calories": 580,
                "protein": 35.0,
                "carbohydrates": 4.0,
                "total_fat": 47.0,
                "fiber": 3.0,
                "keto_score": 10,
                "consumed_at": datetime.now().replace(hour=12, minute=0).isoformat(),
                "created_at": datetime.now().isoformat()
            },
            {
                "user_id": user_id,
                "meal_type": "dinner",
                "food_name": "Poulet rôti avec brocolis et fromage",
                "quantity": 1.0,
                "unit": "portion", 
                "calories": 520,
                "protein": 42.0,
                "carbohydrates": 8.0,
                "total_fat": 36.0,
                "fiber": 4.0,
                "keto_score": 8,
                "consumed_at": datetime.now().replace(hour=19, minute=0).isoformat(),
                "created_at": datetime.now().isoformat()
            }
        ]
        
        for meal in demo_meals:
            response = client.table('meals').insert(meal).execute()
            logger.info(f"✅ Repas ajouté: {meal['food_name']}")
        
        return True
        
    except Exception as e:
        logger.error(f"Erreur lors de l'ajout des repas: {str(e)}")
        return False

def verify_setup(client: Client):
    """Vérifier que tout est correctement configuré"""
    try:
        # Vérifier la table meals
        meals_response = client.table('meals').select('*', count='exact').limit(1).execute()
        logger.info(f"✅ Table meals accessible - {meals_response.count} repas total")
        
        # Vérifier l'utilisateur de contact
        user_response = client.table('users').select('*').eq('email', 'contact@ketosansstress.com').execute()
        if user_response.data:
            user = user_response.data[0]
            logger.info(f"✅ Utilisateur vérifié: {user['full_name']}")
            logger.info(f"   - Objectifs: {user.get('target_calories')}cal, {user.get('target_protein')}g protéines")
            
            # Vérifier les repas de cet utilisateur
            user_meals = client.table('meals').select('*').eq('user_id', user['id']).execute()
            logger.info(f"✅ {len(user_meals.data)} repas trouvés pour cet utilisateur")
        
        return True
        
    except Exception as e:
        logger.error(f"Erreur lors de la vérification: {str(e)}")
        return False

def main():
    """Fonction principale"""
    try:
        logger.info("🚀 Configuration Supabase avec contact@ketosansstress.com")
        
        # Créer le client administrateur
        client = get_admin_client()
        logger.info("✅ Client Supabase administrateur connecté")
        
        # Créer/vérifier l'utilisateur
        user_id = create_demo_user_if_not_exists(client)
        
        # Ajouter des repas de démonstration
        if add_demo_meals(client, user_id):
            logger.info("✅ Repas de démonstration ajoutés")
        
        # Vérifier la configuration
        if verify_setup(client):
            logger.info("🎉 Configuration Supabase terminée avec succès!")
            logger.info("📱 Le widget des repas peut maintenant fonctionner")
            return True
        else:
            logger.error("❌ Erreur lors de la vérification")
            return False
            
    except Exception as e:
        logger.error(f"❌ Erreur fatale: {str(e)}")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)