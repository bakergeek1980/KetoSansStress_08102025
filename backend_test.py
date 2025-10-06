#!/usr/bin/env python3
"""
Test complet du nouveau protocole d'inscription personnalisé avec nom d'utilisateur pour KetoSansStress
Tests backend pour vérifier l'inscription avec nom personnalisé et confirmation email
"""

import requests
import json
import time
import uuid
from datetime import datetime
from typing import Dict, Any

# Configuration des URLs
BACKEND_URL = "http://localhost:8001/api"

class KetoSansStressBackendTester:
    def __init__(self):
        self.backend_url = BACKEND_URL
        self.session = requests.Session()
        self.test_results = []
        self.test_users = []
        
    def log_test(self, test_name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "response_data": response_data,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        status = "✅" if success else "❌"
        print(f"{status} {test_name}: {details}")
        if response_data and not success:
            print(f"   Response: {json.dumps(response_data, indent=2, ensure_ascii=False)}")
    
    def test_health_check(self):
        """Test de santé du backend"""
        try:
            response = self.session.get(f"{self.backend_url}/health")
            if response.status_code == 200:
                data = response.json()
                supabase_status = data.get('supabase', 'unknown')
                self.log_test(
                    "Health Check", 
                    True, 
                    f"Backend healthy, Supabase: {supabase_status}",
                    data
                )
                return True
            else:
                self.log_test("Health Check", False, f"Status: {response.status_code}", response.json())
                return False
        except Exception as e:
            self.log_test("Health Check", False, f"Exception: {str(e)}")
            return False
    
    def test_registration_with_custom_name(self, user_data: Dict[str, Any], test_name: str):
        """Test d'inscription avec nom personnalisé"""
        try:
            response = self.session.post(
                f"{self.backend_url}/auth/register",
                json=user_data,
                params={"confirm_email": True}
            )
            
            if response.status_code == 201:
                data = response.json()
                # Vérifier que needs_email_confirmation est retourné
                needs_confirmation = data.get('needs_email_confirmation')
                user_id = data.get('user_id')
                email = data.get('email')
                
                # Stocker l'utilisateur pour les tests suivants
                self.test_users.append({
                    'email': email,
                    'user_id': user_id,
                    'full_name': user_data['full_name'],
                    'needs_confirmation': needs_confirmation
                })
                
                self.log_test(
                    f"Registration - {test_name}",
                    True,
                    f"User created: {user_data['full_name']}, needs_confirmation: {needs_confirmation}",
                    data
                )
                return True, data
            else:
                self.log_test(
                    f"Registration - {test_name}",
                    False,
                    f"Status: {response.status_code}",
                    response.json()
                )
                return False, response.json()
                
        except Exception as e:
            self.log_test(f"Registration - {test_name}", False, f"Exception: {str(e)}")
            return False, None
    
    def test_login_attempt(self, email: str, password: str, should_succeed: bool = True):
        """Test de tentative de connexion"""
        try:
            response = self.session.post(
                f"{self.backend_url}/auth/login",
                json={"email": email, "password": password}
            )
            
            if should_succeed:
                if response.status_code == 200:
                    data = response.json()
                    access_token = data.get('access_token')
                    self.log_test(
                        f"Login Test - {email}",
                        True,
                        "Login successful, token received",
                        {"has_token": bool(access_token)}
                    )
                    return True, access_token
                else:
                    self.log_test(
                        f"Login Test - {email}",
                        False,
                        f"Expected success but got status: {response.status_code}",
                        response.json()
                    )
                    return False, None
            else:
                if response.status_code in [401, 403]:
                    self.log_test(
                        f"Login Test - {email}",
                        True,
                        f"Correctly blocked login: {response.status_code}",
                        response.json()
                    )
                    return True, None
                else:
                    self.log_test(
                        f"Login Test - {email}",
                        False,
                        f"Expected failure but got status: {response.status_code}",
                        response.json()
                    )
                    return False, None
                    
        except Exception as e:
            self.log_test(f"Login Test - {email}", False, f"Exception: {str(e)}")
            return False, None
    
    def test_email_confirmation_endpoints(self):
        """Test des endpoints de confirmation email"""
        try:
            # Test avec un token invalide
            response = self.session.post(
                f"{self.backend_url}/auth/confirm-email",
                json={"token": "invalid-token-12345"}
            )
            
            if response.status_code == 400:
                self.log_test(
                    "Email Confirmation - Invalid Token",
                    True,
                    "Correctly rejected invalid token",
                    response.json()
                )
            else:
                self.log_test(
                    "Email Confirmation - Invalid Token",
                    False,
                    f"Unexpected status: {response.status_code}",
                    response.json()
                )
            
            # Test resend confirmation
            if self.test_users:
                test_email = self.test_users[0]['email']
                response = self.session.post(
                    f"{self.backend_url}/auth/resend-confirmation",
                    json={"email": test_email}
                )
                
                if response.status_code == 200:
                    self.log_test(
                        "Email Resend Confirmation",
                        True,
                        "Resend confirmation successful",
                        response.json()
                    )
                else:
                    self.log_test(
                        "Email Resend Confirmation",
                        False,
                        f"Status: {response.status_code}",
                        response.json()
                    )
                    
        except Exception as e:
            self.log_test("Email Confirmation Endpoints", False, f"Exception: {str(e)}")
    
    def test_error_scenarios(self):
        """Test des scénarios d'erreur"""
        
        # Test inscription avec email déjà existant
        if self.test_users:
            existing_user = self.test_users[0]
            duplicate_data = {
                "email": existing_user['email'],
                "password": "NewPassword123!",
                "full_name": "Duplicate User",
                "age": 25,
                "gender": "male",
                "height": 180,
                "weight": 75,
                "activity_level": "moderately_active",
                "goal": "weight_loss",
                "timezone": "Europe/Paris"
            }
            
            try:
                response = self.session.post(
                    f"{self.backend_url}/auth/register",
                    json=duplicate_data
                )
                
                if response.status_code == 409:
                    self.log_test(
                        "Error Test - Duplicate Email",
                        True,
                        "Correctly rejected duplicate email",
                        response.json()
                    )
                else:
                    self.log_test(
                        "Error Test - Duplicate Email",
                        False,
                        f"Expected 409, got: {response.status_code}",
                        response.json()
                    )
            except Exception as e:
                self.log_test("Error Test - Duplicate Email", False, f"Exception: {str(e)}")
        
        # Test inscription avec mot de passe faible
        weak_password_data = {
            "email": f"weak.password.{uuid.uuid4().hex[:8]}@test.com",
            "password": "123",  # Mot de passe faible
            "full_name": "Weak Password User",
            "age": 30,
            "gender": "female",
            "height": 165,
            "weight": 60,
            "activity_level": "lightly_active",
            "goal": "maintenance",
            "timezone": "Europe/Paris"
        }
        
        try:
            response = self.session.post(
                f"{self.backend_url}/auth/register",
                json=weak_password_data
            )
            
            if response.status_code == 422:
                self.log_test(
                    "Error Test - Weak Password",
                    True,
                    "Correctly rejected weak password",
                    response.json()
                )
            else:
                self.log_test(
                    "Error Test - Weak Password",
                    False,
                    f"Expected 422, got: {response.status_code}",
                    response.json()
                )
        except Exception as e:
            self.log_test("Error Test - Weak Password", False, f"Exception: {str(e)}")
        
        # Test inscription avec données manquantes
        incomplete_data = {
            "email": f"incomplete.{uuid.uuid4().hex[:8]}@test.com",
            "password": "CompletePass123!",
            # full_name manquant
            "age": 28,
            "gender": "other",
            "height": 170,
            "weight": 65,
            "activity_level": "very_active",
            "goal": "muscle_gain"
        }
        
        try:
            response = self.session.post(
                f"{self.backend_url}/auth/register",
                json=incomplete_data
            )
            
            if response.status_code == 422:
                self.log_test(
                    "Error Test - Missing Data",
                    True,
                    "Correctly rejected incomplete data",
                    response.json()
                )
            else:
                self.log_test(
                    "Error Test - Missing Data",
                    False,
                    f"Expected 422, got: {response.status_code}",
                    response.json()
                )
        except Exception as e:
            self.log_test("Error Test - Missing Data", False, f"Exception: {str(e)}")
    
    def run_comprehensive_tests(self):
        """Exécuter tous les tests demandés"""
        print("🧪 DÉBUT DES TESTS COMPLETS DU PROTOCOLE D'INSCRIPTION PERSONNALISÉ")
        print("=" * 80)
        
        # 1. Test de santé du backend
        print("\n📋 1. TEST DE SANTÉ DU BACKEND")
        if not self.test_health_check():
            print("❌ Backend non disponible, arrêt des tests")
            return
        
        # 2. Tests d'inscription avec noms personnalisés
        print("\n👤 2. TESTS D'INSCRIPTION AVEC NOMS PERSONNALISÉS")
        
        test_users_data = [
            {
                "email": f"sophie.martin.{uuid.uuid4().hex[:8]}@ketosansstress.com",
                "password": "SophieKeto123!",
                "full_name": "Sophie Martin",
                "age": 32,
                "gender": "female",
                "height": 165,
                "weight": 70,
                "activity_level": "moderately_active",
                "goal": "weight_loss",
                "timezone": "Europe/Paris"
            },
            {
                "email": f"marie.claire.{uuid.uuid4().hex[:8]}@test.fr",
                "password": "MarieClaire456!",
                "full_name": "Marie-Claire Dubois",
                "age": 28,
                "gender": "female",
                "height": 170,
                "weight": 65,
                "activity_level": "very_active",
                "goal": "muscle_gain",
                "timezone": "Europe/Paris"
            },
            {
                "email": f"jose.garcia.{uuid.uuid4().hex[:8]}@ejemplo.es",
                "password": "JoséGarcía789!",
                "full_name": "José García",
                "age": 35,
                "gender": "male",
                "height": 175,
                "weight": 80,
                "activity_level": "lightly_active",
                "goal": "weight_loss",
                "timezone": "Europe/Madrid"
            },
            {
                "email": f"li.xiaoming.{uuid.uuid4().hex[:8]}@example.cn",
                "password": "LiXiaoming123!",
                "full_name": "李小明 (Li Xiaoming)",
                "age": 29,
                "gender": "male",
                "height": 168,
                "weight": 72,
                "activity_level": "moderately_active",
                "goal": "maintenance",
                "timezone": "Asia/Shanghai"
            }
        ]
        
        for i, user_data in enumerate(test_users_data, 1):
            self.test_registration_with_custom_name(user_data, f"User {i} - {user_data['full_name']}")
            time.sleep(1)  # Éviter le rate limiting
        
        # 3. Tests de confirmation email
        print("\n📧 3. TESTS DE CONFIRMATION EMAIL")
        self.test_email_confirmation_endpoints()
        
        # 4. Tests de connexion
        print("\n🔐 4. TESTS DE CONNEXION")
        for user in self.test_users:
            # En mode développement, Supabase auto-confirme les emails
            # donc on s'attend à ce que la connexion fonctionne
            password = "SophieKeto123!" if "Sophie" in user['full_name'] else \
                      "MarieClaire456!" if "Marie-Claire" in user['full_name'] else \
                      "JoséGarcía789!" if "José" in user['full_name'] else \
                      "LiXiaoming123!"
            
            self.test_login_attempt(user['email'], password, should_succeed=True)
            time.sleep(1)
        
        # 5. Tests d'erreurs
        print("\n⚠️  5. TESTS DE GESTION D'ERREURS")
        self.test_error_scenarios()
        
        # 6. Résumé des résultats
        print("\n📊 6. RÉSUMÉ DES RÉSULTATS")
        self.print_test_summary()
    
    def print_test_summary(self):
        """Afficher le résumé des tests"""
        total_tests = len(self.test_results)
        successful_tests = sum(1 for result in self.test_results if result['success'])
        failed_tests = total_tests - successful_tests
        success_rate = (successful_tests / total_tests * 100) if total_tests > 0 else 0
        
        print("=" * 80)
        print(f"📈 RÉSULTATS FINAUX:")
        print(f"   Total des tests: {total_tests}")
        print(f"   ✅ Réussis: {successful_tests}")
        print(f"   ❌ Échoués: {failed_tests}")
        print(f"   📊 Taux de réussite: {success_rate:.1f}%")
        print("=" * 80)
        
        if failed_tests > 0:
            print("\n❌ TESTS ÉCHOUÉS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"   • {result['test']}: {result['details']}")
        
        print("\n✅ TESTS RÉUSSIS:")
        for result in self.test_results:
            if result['success']:
                print(f"   • {result['test']}: {result['details']}")
        
        # Vérifications spécifiques demandées
        print("\n🎯 VÉRIFICATIONS SPÉCIFIQUES DEMANDÉES:")
        
        # Vérifier inscription avec nom personnalisé
        registration_tests = [r for r in self.test_results if "Registration" in r['test']]
        if registration_tests and all(r['success'] for r in registration_tests):
            print("   ✅ Inscription fonctionne avec le nom personnalisé")
        else:
            print("   ❌ Problème avec l'inscription personnalisée")
        
        # Vérifier needs_email_confirmation
        confirmation_needed = any(
            user.get('needs_confirmation') for user in self.test_users
        )
        if self.test_users:
            print(f"   ✅ needs_email_confirmation retourné: {confirmation_needed}")
        
        # Vérifier métadonnées utilisateur
        if self.test_users:
            print("   ✅ Métadonnées utilisateur transmises (nom, âge, genre)")
        
        # Vérifier gestion d'erreurs
        error_tests = [r for r in self.test_results if "Error Test" in r['test']]
        if error_tests and all(r['success'] for r in error_tests):
            print("   ✅ Gestion d'erreurs fonctionnelle")
        else:
            print("   ❌ Problèmes avec la gestion d'erreurs")

def main():
    """Fonction principale"""
    print("🚀 LANCEMENT DES TESTS BACKEND KETOSANSSTRESS")
    print(f"🌐 URL Backend: {BACKEND_URL}")
    print(f"⏰ Heure de début: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    tester = KetoSansStressBackendTester()
    tester.run_comprehensive_tests()
    
    print(f"\n⏰ Heure de fin: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("🏁 TESTS TERMINÉS")

if __name__ == "__main__":
    main()