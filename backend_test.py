#!/usr/bin/env python3
"""
Tests complets pour les nouvelles fonctionnalités de l'API KetoSansStress
Test des endpoints Foods API et Vision API après corrections
"""

import requests
import json
import base64
import time
import os
from datetime import datetime
from typing import Dict, Any, Optional

# Configuration de l'API
API_BASE_URL = "https://keto-onboard.preview.emergentagent.com/api"

# Données de test - utiliser un utilisateur existant confirmé
TEST_USER_EMAIL = "contact@ketosansstress.com"
TEST_USER_PASSWORD = "SecurePass123!"

# Code-barres de test (produits réels OpenFoodFacts)
TEST_BARCODES = {
    "nutella": "3017620425035",  # Nutella
    "ferrero_rocher": "8000500037454",  # Ferrero Rocher
    "camembert": "3228021170015",  # President Camembert
    "invalid": "0000000000000"  # Code-barres invalide
}

# Image de test en base64 (petite image 1x1 pixel)
TEST_IMAGE_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="

class KetoAPITester:
    def __init__(self):
        self.session = requests.Session()
        self.auth_token = None
        self.test_results = []
        
    def log_test(self, test_name: str, success: bool, details: str = "", response_data: Any = None):
        """Enregistrer le résultat d'un test"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat(),
            "response_data": response_data
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"    {details}")
        if not success and response_data:
            print(f"    Response: {response_data}")
        print()

    def authenticate(self) -> bool:
        """S'authentifier et obtenir un token JWT"""
        try:
            # Essayer de s'inscrire d'abord
            register_data = {
                "email": TEST_USER_EMAIL,
                "password": TEST_USER_PASSWORD,
                "full_name": "Testeur API",
                "age": 30,
                "gender": "male",
                "height": 175,
                "weight": 75,
                "activity_level": "moderately_active",
                "goal": "maintenance"
            }
            
            register_response = self.session.post(
                f"{API_BASE_URL}/auth/register",
                json=register_data,
                timeout=10
            )
            
            # Maintenant se connecter
            login_data = {
                "email": TEST_USER_EMAIL,
                "password": TEST_USER_PASSWORD
            }
            
            login_response = self.session.post(
                f"{API_BASE_URL}/auth/login",
                json=login_data,
                timeout=10
            )
            
            if login_response.status_code == 200:
                token_data = login_response.json()
                self.auth_token = token_data.get("access_token")
                self.session.headers.update({
                    "Authorization": f"Bearer {self.auth_token}"
                })
                self.log_test("Authentication", True, f"Token obtenu: {self.auth_token[:20]}...")
                return True
            else:
                self.log_test("Authentication", False, f"Login failed: {login_response.status_code}", login_response.text)
                return False
                
        except Exception as e:
            self.log_test("Authentication", False, f"Auth error: {str(e)}")
            return False

    def test_health_check(self):
        """Test du health check"""
        try:
            response = self.session.get(f"{API_BASE_URL}/health", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                supabase_status = data.get("supabase", "unknown")
                self.log_test(
                    "Health Check", 
                    True, 
                    f"Service: {data.get('service')}, Supabase: {supabase_status}",
                    data
                )
            else:
                self.log_test("Health Check", False, f"Status: {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Health Check", False, f"Error: {str(e)}")

    def test_swagger_docs(self):
        """Test de l'accès à la documentation Swagger"""
        try:
            response = self.session.get(f"{API_BASE_URL}/docs", timeout=10)
            
            success = response.status_code == 200
            self.log_test(
                "Swagger Documentation", 
                success, 
                f"Status: {response.status_code}"
            )
                
        except Exception as e:
            self.log_test("Swagger Documentation", False, f"Error: {str(e)}")

    def test_foods_search(self):
        """Test de l'endpoint de recherche d'aliments"""
        test_queries = ["saumon", "avocat", "fromage", "œufs", "brocoli"]
        
        for query in test_queries:
            try:
                response = self.session.get(
                    f"{API_BASE_URL}/foods/search",
                    params={"q": query, "limit": 5},
                    timeout=10
                )
                
                if response.status_code == 200:
                    data = response.json()
                    results_count = len(data) if isinstance(data, list) else 0
                    self.log_test(
                        f"Food Search - {query}", 
                        True, 
                        f"Found {results_count} results",
                        {"query": query, "results_count": results_count}
                    )
                else:
                    self.log_test(
                        f"Food Search - {query}", 
                        False, 
                        f"Status: {response.status_code}",
                        response.text
                    )
                    
            except Exception as e:
                self.log_test(f"Food Search - {query}", False, f"Error: {str(e)}")

    def test_foods_search_with_params(self):
        """Test de la recherche avec paramètres avancés"""
        try:
            # Test avec caractères spéciaux
            response = self.session.get(
                f"{API_BASE_URL}/foods/search",
                params={"q": "œuf à la coque", "limit": 3},
                timeout=10
            )
            
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                data = response.json()
                details += f", Results: {len(data) if isinstance(data, list) else 0}"
            
            self.log_test("Food Search - Special Characters", success, details)
            
            # Test recherche vide
            response = self.session.get(
                f"{API_BASE_URL}/foods/search",
                params={"q": "", "limit": 5},
                timeout=10
            )
            
            # Une recherche vide devrait retourner une erreur 422 (validation)
            expected_fail = response.status_code == 422
            self.log_test(
                "Food Search - Empty Query", 
                expected_fail, 
                f"Status: {response.status_code} (expected 422)"
            )
                
        except Exception as e:
            self.log_test("Food Search - Advanced Parameters", False, f"Error: {str(e)}")

    def test_barcode_scanning(self):
        """Test du scanner de codes-barres"""
        for product_name, barcode in TEST_BARCODES.items():
            try:
                response = self.session.post(
                    f"{API_BASE_URL}/foods/scan-barcode",
                    json={"barcode": barcode},
                    timeout=15  # Plus de temps pour OpenFoodFacts
                )
                
                if response.status_code == 200:
                    data = response.json()
                    found = data.get("found", False)
                    product_name_found = data.get("food_data", {}).get("name", "Unknown") if found else "Not found"
                    
                    # Pour les codes-barres invalides, on s'attend à found=False
                    expected_success = found if product_name != "invalid" else not found
                    
                    self.log_test(
                        f"Barcode Scan - {product_name}", 
                        expected_success, 
                        f"Barcode: {barcode}, Found: {found}, Product: {product_name_found}",
                        data
                    )
                else:
                    # Pour les codes-barres invalides, un 404 est acceptable
                    expected_fail = product_name == "invalid" and response.status_code == 404
                    self.log_test(
                        f"Barcode Scan - {product_name}", 
                        expected_fail, 
                        f"Status: {response.status_code}",
                        response.text
                    )
                    
            except Exception as e:
                self.log_test(f"Barcode Scan - {product_name}", False, f"Error: {str(e)}")

    def test_vision_analysis(self):
        """Test de l'analyse d'image avec l'API Vision"""
        meal_types = ["breakfast", "lunch", "dinner", "snack"]
        
        for meal_type in meal_types:
            try:
                # Test avec différentes tailles d'images simulées
                test_images = {
                    "small": TEST_IMAGE_BASE64,  # Petite image
                    "medium": TEST_IMAGE_BASE64 + "A" * 50000,  # Image moyenne
                    "large": TEST_IMAGE_BASE64 + "B" * 150000   # Grande image
                }
                
                for size, image_data in test_images.items():
                    response = self.session.post(
                        f"{API_BASE_URL}/vision/analyze",
                        json={
                            "image_base64": image_data,
                            "meal_type": meal_type
                        },
                        timeout=20
                    )
                    
                    if response.status_code == 200:
                        data = response.json()
                        foods_detected = len(data.get("foods_detected", []))
                        total_calories = data.get("total_nutrition", {}).get("calories", 0)
                        confidence = data.get("analysis_confidence", 0)
                        
                        self.log_test(
                            f"Vision Analysis - {meal_type} ({size})", 
                            True, 
                            f"Foods: {foods_detected}, Calories: {total_calories}, Confidence: {confidence}",
                            {
                                "meal_type": meal_type,
                                "foods_detected": foods_detected,
                                "calories": total_calories,
                                "confidence": confidence
                            }
                        )
                    else:
                        self.log_test(
                            f"Vision Analysis - {meal_type} ({size})", 
                            False, 
                            f"Status: {response.status_code}",
                            response.text
                        )
                        
            except Exception as e:
                self.log_test(f"Vision Analysis - {meal_type}", False, f"Error: {str(e)}")

    def test_foods_favorites(self):
        """Test des endpoints de favoris"""
        try:
            # Test GET favorites
            response = self.session.get(f"{API_BASE_URL}/foods/favorites", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                favorites_count = len(data) if isinstance(data, list) else 0
                self.log_test(
                    "Foods Favorites - GET", 
                    True, 
                    f"Found {favorites_count} favorites",
                    {"favorites_count": favorites_count}
                )
                
                # Test POST favorites (ajouter/retirer) - endpoint pas encore implémenté
                # On teste quand même pour voir la réponse
                test_food_id = "test-food-123"
                fav_response = self.session.post(
                    f"{API_BASE_URL}/foods/favorites/{test_food_id}",
                    timeout=10
                )
                
                # On s'attend à une erreur 404 ou 405 car l'endpoint n'est pas implémenté
                expected_error = fav_response.status_code in [404, 405, 501]
                self.log_test(
                    "Foods Favorites - POST", 
                    expected_error, 
                    f"Status: {fav_response.status_code} (endpoint not implemented yet)"
                )
                
            else:
                self.log_test(
                    "Foods Favorites - GET", 
                    False, 
                    f"Status: {response.status_code}",
                    response.text
                )
                
        except Exception as e:
            self.log_test("Foods Favorites", False, f"Error: {str(e)}")

    def test_foods_categories(self):
        """Test de l'endpoint des catégories d'aliments"""
        try:
            # Test sans authentification d'abord (peut être public)
            temp_headers = self.session.headers.copy()
            self.session.headers.pop("Authorization", None)
            
            response = self.session.get(f"{API_BASE_URL}/foods/categories", timeout=10)
            
            # Restaurer les headers
            self.session.headers = temp_headers
            
            if response.status_code == 200:
                data = response.json()
                categories_count = len(data) if isinstance(data, list) else 0
                self.log_test(
                    "Foods Categories", 
                    True, 
                    f"Found {categories_count} categories: {data[:5] if isinstance(data, list) else 'N/A'}",
                    data
                )
            else:
                self.log_test(
                    "Foods Categories", 
                    False, 
                    f"Status: {response.status_code}",
                    response.text
                )
                
        except Exception as e:
            self.log_test("Foods Categories", False, f"Error: {str(e)}")

    def test_openfoodfacts_integration(self):
        """Test spécifique de l'intégration OpenFoodFacts"""
        try:
            # Test direct du service OpenFoodFacts via l'endpoint de recherche
            response = self.session.get(
                f"{API_BASE_URL}/foods/search",
                params={"q": "nutella", "limit": 3},
                timeout=15
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Vérifier si on a des résultats OpenFoodFacts
                openfoodfacts_results = [
                    item for item in data 
                    if isinstance(item, dict) and item.get("source") == "openfoodfacts"
                ]
                
                success = len(openfoodfacts_results) > 0
                self.log_test(
                    "OpenFoodFacts Integration", 
                    success, 
                    f"Found {len(openfoodfacts_results)} OpenFoodFacts results out of {len(data)} total",
                    {"total_results": len(data), "openfoodfacts_results": len(openfoodfacts_results)}
                )
            else:
                self.log_test(
                    "OpenFoodFacts Integration", 
                    False, 
                    f"Status: {response.status_code}",
                    response.text
                )
                
        except Exception as e:
            self.log_test("OpenFoodFacts Integration", False, f"Error: {str(e)}")

    def test_authentication_requirements(self):
        """Test que les endpoints nécessitent une authentification"""
        # Sauvegarder le token actuel
        original_token = self.auth_token
        original_headers = self.session.headers.copy()
        
        # Supprimer l'authentification
        self.session.headers.pop("Authorization", None)
        
        protected_endpoints = [
            ("GET", "/foods/search?q=test"),
            ("POST", "/foods/scan-barcode"),
            ("GET", "/foods/favorites"),
            ("POST", "/vision/analyze")
        ]
        
        for method, endpoint in protected_endpoints:
            try:
                if method == "GET":
                    response = self.session.get(f"{API_BASE_URL}{endpoint}", timeout=10)
                else:
                    test_data = {"barcode": "123"} if "barcode" in endpoint else {"image_base64": TEST_IMAGE_BASE64, "meal_type": "lunch"}
                    response = self.session.post(f"{API_BASE_URL}{endpoint}", json=test_data, timeout=10)
                
                # On s'attend à un 401 Unauthorized
                expected_unauthorized = response.status_code == 401
                self.log_test(
                    f"Auth Required - {method} {endpoint}", 
                    expected_unauthorized, 
                    f"Status: {response.status_code} (expected 401)"
                )
                
            except Exception as e:
                self.log_test(f"Auth Required - {method} {endpoint}", False, f"Error: {str(e)}")
        
        # Restaurer l'authentification
        self.auth_token = original_token
        self.session.headers = original_headers

    def run_all_tests(self):
        """Exécuter tous les tests"""
        print("🧪 DÉBUT DES TESTS API KETOSANSSTRESS")
        print("=" * 60)
        print()
        
        start_time = time.time()
        
        # Tests de base
        self.test_health_check()
        self.test_swagger_docs()
        
        # Authentification
        auth_success = self.authenticate()
        if not auth_success:
            print("⚠️ ÉCHEC DE L'AUTHENTIFICATION - CONTINUATION AVEC TESTS LIMITÉS")
            print("   Certains endpoints peuvent être publics ou avoir des fallbacks")
        
        # Tests des endpoints Foods API
        print("🍎 TESTS FOODS API")
        print("-" * 30)
        self.test_foods_search()
        self.test_foods_search_with_params()
        self.test_barcode_scanning()
        self.test_foods_favorites()
        self.test_foods_categories()
        self.test_openfoodfacts_integration()
        
        # Tests des endpoints Vision API
        print("\n👁️ TESTS VISION API")
        print("-" * 30)
        self.test_vision_analysis()
        
        # Tests de sécurité
        print("\n🔒 TESTS DE SÉCURITÉ")
        print("-" * 30)
        self.test_authentication_requirements()
        
        # Résumé
        end_time = time.time()
        self.print_summary(end_time - start_time)

    def print_summary(self, duration: float):
        """Afficher le résumé des tests"""
        print("\n" + "=" * 60)
        print("📊 RÉSUMÉ DES TESTS")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        print(f"Total des tests: {total_tests}")
        print(f"✅ Réussis: {passed_tests}")
        print(f"❌ Échoués: {failed_tests}")
        print(f"📈 Taux de réussite: {success_rate:.1f}%")
        print(f"⏱️ Durée: {duration:.1f}s")
        
        if failed_tests > 0:
            print(f"\n❌ TESTS ÉCHOUÉS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  - {result['test']}: {result['details']}")
        
        print("\n🎯 ENDPOINTS TESTÉS:")
        endpoints_tested = [
            "✅ GET /api/health",
            "✅ GET /api/docs", 
            "✅ GET /api/foods/search",
            "✅ POST /api/foods/scan-barcode",
            "✅ GET /api/foods/favorites",
            "✅ GET /api/foods/categories",
            "✅ POST /api/vision/analyze",
            "✅ Intégration OpenFoodFacts",
            "✅ Tests d'authentification"
        ]
        
        for endpoint in endpoints_tested:
            print(f"  {endpoint}")
        
        print(f"\n🏁 Tests terminés à {datetime.now().strftime('%H:%M:%S')}")

if __name__ == "__main__":
    tester = KetoAPITester()
    tester.run_all_tests()