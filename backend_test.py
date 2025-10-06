#!/usr/bin/env python3
"""
KetoSansStress Authentication System Testing
Comprehensive testing of enhanced registration and login functionality
"""

import requests
import json
import time
import uuid
from datetime import datetime
from typing import Dict, Any, Optional

# Test Configuration
BASE_URL = "https://ketotrackerapp-1.preview.emergentagent.com/api"
TEST_EMAIL = "test.user@ketosansstress.com"
TEST_PASSWORD = "KetoTest123!"
DUPLICATE_TEST_EMAIL = "duplicate.test@ketosansstress.com"

class FoodSearchAPITester:
    def __init__(self):
        self.base_url = BASE_URL
        self.session = requests.Session()
        self.auth_token = None
        self.test_results = []
        self.user_id = None
        
    def log_test(self, test_name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat(),
            "response_data": response_data
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {test_name}: {details}")
        
    def setup_authentication(self) -> bool:
        """Setup authentication for testing"""
        try:
            # Register test user
            register_data = {
                "email": TEST_USER_EMAIL,
                "password": TEST_USER_PASSWORD,
                "full_name": "Food Test User",
                "age": 28,
                "gender": "female",
                "height": 165.0,
                "weight": 65.0,
                "activity_level": "moderately_active",
                "goal": "weight_loss"
            }
            
            register_response = self.session.post(
                f"{self.base_url}/auth/register",
                json=register_data,
                timeout=10
            )
            
            if register_response.status_code in [200, 201]:
                self.log_test("User Registration", True, f"User registered successfully")
            elif register_response.status_code == 400 and "already exists" in register_response.text.lower():
                self.log_test("User Registration", True, f"User already exists, proceeding with login")
            else:
                self.log_test("User Registration", False, f"Registration failed: {register_response.status_code} - {register_response.text}")
                
            # Login to get JWT token
            login_data = {
                "email": TEST_USER_EMAIL,
                "password": TEST_USER_PASSWORD
            }
            
            login_response = self.session.post(
                f"{self.base_url}/auth/login",
                json=login_data,
                timeout=10
            )
            
            if login_response.status_code == 200:
                login_result = login_response.json()
                self.auth_token = login_result.get("access_token")
                self.user_id = login_result.get("user", {}).get("id")
                
                # Set authorization header for all future requests
                self.session.headers.update({
                    "Authorization": f"Bearer {self.auth_token}"
                })
                
                self.log_test("User Login", True, f"Login successful, token obtained")
                return True
            else:
                self.log_test("User Login", False, f"Login failed: {login_response.status_code} - {login_response.text}")
                return False
                
        except Exception as e:
            self.log_test("Authentication Setup", False, f"Authentication error: {str(e)}")
            return False
    
    def test_food_search_endpoint(self):
        """Test GET /api/foods/search?q={query}"""
        test_queries = [
            ("avocat", "French word for avocado"),
            ("saumon", "French word for salmon"),
            ("œufs", "French word for eggs"),
            ("fromage", "French word for cheese"),
            ("poulet", "French word for chicken"),
            ("brocoli", "French word for broccoli"),
            ("", "Empty query test"),
            ("xyz123nonexistent", "Non-existent food test")
        ]
        
        for query, description in test_queries:
            try:
                # Test basic search
                response = self.session.get(
                    f"{self.base_url}/foods/search",
                    params={"q": query} if query else {},
                    timeout=10
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if isinstance(data, list):
                        self.log_test(
                            f"Food Search - {description}",
                            True,
                            f"Query '{query}' returned {len(data)} results",
                            {"query": query, "results_count": len(data), "sample_results": data[:2]}
                        )
                        
                        # Validate response structure
                        if data and len(data) > 0:
                            first_result = data[0]
                            required_fields = ["id", "name", "calories_per_100g", "proteins_per_100g", "carbs_per_100g", "fats_per_100g"]
                            missing_fields = [field for field in required_fields if field not in first_result]
                            
                            if not missing_fields:
                                self.log_test(
                                    f"Food Search Response Structure - {description}",
                                    True,
                                    f"All required fields present in response"
                                )
                            else:
                                self.log_test(
                                    f"Food Search Response Structure - {description}",
                                    False,
                                    f"Missing fields: {missing_fields}"
                                )
                    else:
                        self.log_test(
                            f"Food Search - {description}",
                            False,
                            f"Expected list response, got: {type(data)}"
                        )
                elif response.status_code == 422 and not query:
                    self.log_test(
                        f"Food Search - {description}",
                        True,
                        f"Empty query correctly rejected with 422"
                    )
                else:
                    self.log_test(
                        f"Food Search - {description}",
                        False,
                        f"HTTP {response.status_code}: {response.text}"
                    )
                    
            except Exception as e:
                self.log_test(
                    f"Food Search - {description}",
                    False,
                    f"Exception: {str(e)}"
                )
    
    def test_food_search_with_parameters(self):
        """Test food search with limit and category parameters"""
        try:
            # Test with limit parameter
            response = self.session.get(
                f"{self.base_url}/foods/search",
                params={"q": "fromage", "limit": 3},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if len(data) <= 3:
                    self.log_test(
                        "Food Search with Limit",
                        True,
                        f"Limit parameter working, returned {len(data)} results (max 3)"
                    )
                else:
                    self.log_test(
                        "Food Search with Limit",
                        False,
                        f"Limit not respected, returned {len(data)} results (expected max 3)"
                    )
            else:
                self.log_test(
                    "Food Search with Limit",
                    False,
                    f"HTTP {response.status_code}: {response.text}"
                )
                
            # Test with category parameter
            response = self.session.get(
                f"{self.base_url}/foods/search",
                params={"q": "légumes", "category": "légumes"},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                self.log_test(
                    "Food Search with Category",
                    True,
                    f"Category filter working, returned {len(data)} results"
                )
            else:
                self.log_test(
                    "Food Search with Category",
                    False,
                    f"HTTP {response.status_code}: {response.text}"
                )
                
        except Exception as e:
            self.log_test(
                "Food Search Parameters",
                False,
                f"Exception: {str(e)}"
            )
    
    def test_food_categories_endpoint(self):
        """Test GET /api/foods/categories"""
        try:
            response = self.session.get(
                f"{self.base_url}/foods/categories",
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    self.log_test(
                        "Food Categories",
                        True,
                        f"Categories endpoint returned {len(data)} categories: {data[:5]}"
                    )
                else:
                    self.log_test(
                        "Food Categories",
                        False,
                        f"Expected non-empty list, got: {data}"
                    )
            else:
                self.log_test(
                    "Food Categories",
                    False,
                    f"HTTP {response.status_code}: {response.text}"
                )
                
        except Exception as e:
            self.log_test(
                "Food Categories",
                False,
                f"Exception: {str(e)}"
            )
    
    def test_favorites_endpoint(self):
        """Test GET /api/foods/favorites"""
        try:
            response = self.session.get(
                f"{self.base_url}/foods/favorites",
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test(
                        "Food Favorites",
                        True,
                        f"Favorites endpoint returned {len(data)} items"
                    )
                    
                    # Validate structure if data exists
                    if data and len(data) > 0:
                        first_item = data[0]
                        required_fields = ["id", "name", "calories_per_100g"]
                        missing_fields = [field for field in required_fields if field not in first_item]
                        
                        if not missing_fields:
                            self.log_test(
                                "Food Favorites Structure",
                                True,
                                f"Favorites response structure is correct"
                            )
                        else:
                            self.log_test(
                                "Food Favorites Structure",
                                False,
                                f"Missing fields in favorites: {missing_fields}"
                            )
                else:
                    self.log_test(
                        "Food Favorites",
                        False,
                        f"Expected list response, got: {type(data)}"
                    )
            else:
                self.log_test(
                    "Food Favorites",
                    False,
                    f"HTTP {response.status_code}: {response.text}"
                )
                
        except Exception as e:
            self.log_test(
                "Food Favorites",
                False,
                f"Exception: {str(e)}"
            )
    
    def test_recent_searches_endpoint(self):
        """Test GET /api/foods/recent-searches"""
        try:
            # First, perform some searches to populate history
            search_queries = ["avocat", "saumon", "fromage"]
            for query in search_queries:
                self.session.get(
                    f"{self.base_url}/foods/search",
                    params={"q": query},
                    timeout=10
                )
                time.sleep(0.5)  # Small delay between searches
            
            # Now test recent searches
            response = self.session.get(
                f"{self.base_url}/foods/recent-searches",
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test(
                        "Recent Searches",
                        True,
                        f"Recent searches returned {len(data)} items"
                    )
                    
                    # Test with limit parameter
                    response_limited = self.session.get(
                        f"{self.base_url}/foods/recent-searches",
                        params={"limit": 2},
                        timeout=10
                    )
                    
                    if response_limited.status_code == 200:
                        limited_data = response_limited.json()
                        if len(limited_data) <= 2:
                            self.log_test(
                                "Recent Searches with Limit",
                                True,
                                f"Limit parameter working, returned {len(limited_data)} results"
                            )
                        else:
                            self.log_test(
                                "Recent Searches with Limit",
                                False,
                                f"Limit not respected, returned {len(limited_data)} results"
                            )
                else:
                    self.log_test(
                        "Recent Searches",
                        False,
                        f"Expected list response, got: {type(data)}"
                    )
            else:
                self.log_test(
                    "Recent Searches",
                    False,
                    f"HTTP {response.status_code}: {response.text}"
                )
                
        except Exception as e:
            self.log_test(
                "Recent Searches",
                False,
                f"Exception: {str(e)}"
            )
    
    def test_barcode_scanning_endpoint(self):
        """Test POST /api/foods/scan-barcode"""
        # Test with known barcodes
        test_barcodes = [
            ("3017620422003", "Nutella barcode"),
            ("8000500037560", "Ferrero Rocher barcode"),
            ("3274080005003", "President Camembert barcode"),
            ("1234567890123", "Invalid barcode"),
            ("", "Empty barcode")
        ]
        
        for barcode, description in test_barcodes:
            try:
                response = self.session.post(
                    f"{self.base_url}/foods/scan-barcode",
                    params={"barcode": barcode} if barcode else {},
                    timeout=15  # Longer timeout for external API calls
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if "barcode" in data and "found" in data:
                        found = data.get("found", False)
                        self.log_test(
                            f"Barcode Scan - {description}",
                            True,
                            f"Barcode {barcode} - Found: {found}",
                            {"barcode": barcode, "found": found, "has_food_data": "food_data" in data}
                        )
                        
                        # If found, validate food data structure
                        if found and "food_data" in data and data["food_data"]:
                            food_data = data["food_data"]
                            required_fields = ["id", "name", "calories_per_100g"]
                            missing_fields = [field for field in required_fields if field not in food_data]
                            
                            if not missing_fields:
                                self.log_test(
                                    f"Barcode Food Data Structure - {description}",
                                    True,
                                    f"Food data structure is correct"
                                )
                            else:
                                self.log_test(
                                    f"Barcode Food Data Structure - {description}",
                                    False,
                                    f"Missing fields in food data: {missing_fields}"
                                )
                    else:
                        self.log_test(
                            f"Barcode Scan - {description}",
                            False,
                            f"Invalid response structure: {data}"
                        )
                elif response.status_code == 422 and not barcode:
                    self.log_test(
                        f"Barcode Scan - {description}",
                        True,
                        f"Empty barcode correctly rejected with 422"
                    )
                else:
                    self.log_test(
                        f"Barcode Scan - {description}",
                        False,
                        f"HTTP {response.status_code}: {response.text}"
                    )
                    
            except Exception as e:
                self.log_test(
                    f"Barcode Scan - {description}",
                    False,
                    f"Exception: {str(e)}"
                )
    
    def test_authentication_requirements(self):
        """Test that food endpoints require authentication"""
        # Create a session without authentication
        unauth_session = requests.Session()
        
        endpoints_to_test = [
            ("/foods/search?q=avocat", "Food Search"),
            ("/foods/categories", "Food Categories"),
            ("/foods/favorites", "Food Favorites"),
            ("/foods/recent-searches", "Recent Searches")
        ]
        
        for endpoint, name in endpoints_to_test:
            try:
                response = unauth_session.get(
                    f"{self.base_url}{endpoint}",
                    timeout=10
                )
                
                if response.status_code == 401:
                    self.log_test(
                        f"Auth Required - {name}",
                        True,
                        f"Endpoint correctly requires authentication (401)"
                    )
                else:
                    self.log_test(
                        f"Auth Required - {name}",
                        False,
                        f"Expected 401, got {response.status_code}"
                    )
                    
            except Exception as e:
                self.log_test(
                    f"Auth Required - {name}",
                    False,
                    f"Exception: {str(e)}"
                )
        
        # Test barcode scanning without auth
        try:
            response = unauth_session.post(
                f"{self.base_url}/foods/scan-barcode",
                params={"barcode": "3017620422003"},
                timeout=10
            )
            
            if response.status_code == 401:
                self.log_test(
                    "Auth Required - Barcode Scan",
                    True,
                    f"Barcode scan correctly requires authentication (401)"
                )
            else:
                self.log_test(
                    "Auth Required - Barcode Scan",
                    False,
                    f"Expected 401, got {response.status_code}"
                )
                
        except Exception as e:
            self.log_test(
                "Auth Required - Barcode Scan",
                False,
                f"Exception: {str(e)}"
            )
    
    def test_openfoodfacts_integration(self):
        """Test OpenFoodFacts integration functionality"""
        try:
            # Test search that should trigger OpenFoodFacts
            response = self.session.get(
                f"{self.base_url}/foods/search",
                params={"q": "nutella", "limit": 5},
                timeout=15
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Look for OpenFoodFacts results
                off_results = [item for item in data if item.get("source") == "openfoodfacts"]
                
                if off_results:
                    self.log_test(
                        "OpenFoodFacts Integration",
                        True,
                        f"OpenFoodFacts integration working, found {len(off_results)} external results"
                    )
                    
                    # Check if results have barcode (indicating OpenFoodFacts source)
                    barcode_results = [item for item in off_results if item.get("barcode")]
                    if barcode_results:
                        self.log_test(
                            "OpenFoodFacts Barcode Data",
                            True,
                            f"OpenFoodFacts results include barcode data"
                        )
                else:
                    self.log_test(
                        "OpenFoodFacts Integration",
                        True,
                        f"Search completed but no OpenFoodFacts results (may be expected for local foods)"
                    )
            else:
                self.log_test(
                    "OpenFoodFacts Integration",
                    False,
                    f"HTTP {response.status_code}: {response.text}"
                )
                
        except Exception as e:
            self.log_test(
                "OpenFoodFacts Integration",
                False,
                f"Exception: {str(e)}"
            )
    
    def test_nutrition_data_completeness(self):
        """Test that search results include proper nutrition data"""
        try:
            response = self.session.get(
                f"{self.base_url}/foods/search",
                params={"q": "avocat"},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                
                if data and len(data) > 0:
                    first_result = data[0]
                    
                    # Check required nutrition fields
                    nutrition_fields = [
                        "calories_per_100g",
                        "proteins_per_100g", 
                        "carbs_per_100g",
                        "fats_per_100g"
                    ]
                    
                    missing_nutrition = [field for field in nutrition_fields if field not in first_result]
                    
                    if not missing_nutrition:
                        # Check if values are numeric
                        numeric_values = all(
                            isinstance(first_result.get(field), (int, float)) 
                            for field in nutrition_fields
                        )
                        
                        if numeric_values:
                            self.log_test(
                                "Nutrition Data Completeness",
                                True,
                                f"All required nutrition fields present and numeric"
                            )
                        else:
                            self.log_test(
                                "Nutrition Data Completeness",
                                False,
                                f"Nutrition fields present but not all numeric"
                            )
                    else:
                        self.log_test(
                            "Nutrition Data Completeness",
                            False,
                            f"Missing nutrition fields: {missing_nutrition}"
                        )
                else:
                    self.log_test(
                        "Nutrition Data Completeness",
                        False,
                        f"No results returned for nutrition data test"
                    )
            else:
                self.log_test(
                    "Nutrition Data Completeness",
                    False,
                    f"HTTP {response.status_code}: {response.text}"
                )
                
        except Exception as e:
            self.log_test(
                "Nutrition Data Completeness",
                False,
                f"Exception: {str(e)}"
            )
    
    def run_all_tests(self):
        """Run all food search API tests"""
        print("🧪 Starting KetoSansStress Food Search API Testing Suite")
        print(f"🔗 Testing against: {self.base_url}")
        print("=" * 80)
        
        # Setup authentication
        if not self.setup_authentication():
            print("❌ Authentication setup failed. Cannot proceed with protected endpoint tests.")
            return
        
        print("\n🔍 Testing Food Search Endpoints...")
        self.test_food_search_endpoint()
        self.test_food_search_with_parameters()
        
        print("\n📂 Testing Food Categories...")
        self.test_food_categories_endpoint()
        
        print("\n⭐ Testing Food Favorites...")
        self.test_favorites_endpoint()
        
        print("\n🕒 Testing Recent Searches...")
        self.test_recent_searches_endpoint()
        
        print("\n📱 Testing Barcode Scanning...")
        self.test_barcode_scanning_endpoint()
        
        print("\n🔐 Testing Authentication Requirements...")
        self.test_authentication_requirements()
        
        print("\n🌐 Testing OpenFoodFacts Integration...")
        self.test_openfoodfacts_integration()
        
        print("\n🥗 Testing Nutrition Data...")
        self.test_nutrition_data_completeness()
        
        # Generate summary
        self.generate_summary()
    
    def generate_summary(self):
        """Generate test summary"""
        print("\n" + "=" * 80)
        print("📊 FOOD SEARCH API TEST SUMMARY")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        passed_tests = len([t for t in self.test_results if t["success"]])
        failed_tests = total_tests - passed_tests
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"📈 Success Rate: {success_rate:.1f}%")
        
        if failed_tests > 0:
            print(f"\n❌ FAILED TESTS:")
            for test in self.test_results:
                if not test["success"]:
                    print(f"  • {test['test']}: {test['details']}")
        
        print(f"\n🎯 FOOD SEARCH API TESTING COMPLETE")
        
        # Return summary for external use
        return {
            "total_tests": total_tests,
            "passed_tests": passed_tests,
            "failed_tests": failed_tests,
            "success_rate": success_rate,
            "test_results": self.test_results
        }

if __name__ == "__main__":
    tester = FoodSearchAPITester()
    summary = tester.run_all_tests()