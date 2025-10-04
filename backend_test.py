#!/usr/bin/env python3
"""
KetoSansStress Backend API Testing Suite
Testing Phase 1 and Phase 2 improvements with priority focus
"""

import requests
import json
import base64
import os
from datetime import datetime, date
from typing import Dict, Any, Optional

# Configuration
BACKEND_URL = "https://ketotrack.preview.emergentagent.com/api"

# Test credentials from review request
TEST_CREDENTIALS = {
    "contact_user": {
        "email": "contact@ketosansstress.com",
        "password": "password123"
    },
    "demo_user": {
        "email": "demo@ketosansstress.com", 
        "password": "password123"
    }
}

class KetoJWTTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.access_token = None
        self.user_id = None
        self.test_results = []
        
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
        print(f"{status} {test_name}: {details}")
        
    def test_health_check(self) -> bool:
        """Test GET /api/health endpoint"""
        try:
            response = requests.get(f"{self.base_url}/health", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "healthy" and "KetoSansStress" in data.get("service", ""):
                    supabase_status = data.get("supabase", "unknown")
                    self.log_test(
                        "Health Check", 
                        True, 
                        f"Service healthy, Supabase: {supabase_status}",
                        data
                    )
                    return True
                else:
                    self.log_test("Health Check", False, f"Unexpected response format: {data}")
                    return False
            else:
                self.log_test("Health Check", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Health Check", False, f"Request failed: {str(e)}")
            return False
    
    def test_user_login(self) -> bool:
        """Test POST /api/auth/login with demo credentials"""
        try:
            login_data = {
                "email": DEMO_EMAIL,
                "password": DEMO_PASSWORD
            }
            
            response = requests.post(
                f"{self.base_url}/auth/login",
                json=login_data,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if "access_token" in data and "user" in data:
                    self.access_token = data["access_token"]
                    self.user_id = data["user"]["id"]
                    self.log_test(
                        "User Login", 
                        True, 
                        f"Login successful, token received, user_id: {self.user_id}",
                        {"has_token": bool(self.access_token), "user_email": data["user"].get("email")}
                    )
                    return True
                else:
                    self.log_test("User Login", False, f"Missing required fields in response: {data}")
                    return False
            else:
                self.log_test("User Login", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("User Login", False, f"Request failed: {str(e)}")
            return False
    
    def test_auth_me_endpoint(self) -> bool:
        """Test GET /api/auth/me with JWT token"""
        if not self.access_token:
            self.log_test("Auth Me Endpoint", False, "No access token available")
            return False
            
        try:
            headers = {
                "Authorization": f"Bearer {self.access_token}",
                "Content-Type": "application/json"
            }
            
            response = requests.get(
                f"{self.base_url}/auth/me",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if "id" in data and "email" in data:
                    self.log_test(
                        "Auth Me Endpoint", 
                        True, 
                        f"JWT validation successful, user: {data.get('email')}",
                        {"user_id": data.get("id"), "email": data.get("email")}
                    )
                    return True
                else:
                    self.log_test("Auth Me Endpoint", False, f"Invalid user data format: {data}")
                    return False
            else:
                self.log_test("Auth Me Endpoint", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Auth Me Endpoint", False, f"Request failed: {str(e)}")
            return False
    
    def test_create_meal(self) -> bool:
        """Test POST /api/meals/ (create new meal)"""
        if not self.access_token:
            self.log_test("Create Meal", False, "No access token available")
            return False
            
        try:
            headers = {
                "Authorization": f"Bearer {self.access_token}",
                "Content-Type": "application/json"
            }
            
            meal_data = {
                "food_name": "Salade d'avocat au saumon",
                "meal_type": "lunch",
                "calories": 420,
                "protein": 25.0,
                "carbohydrates": 8.0,
                "total_fat": 32.0,
                "fiber": 6.0,
                "quantity": 1.0,
                "unit": "portion",
                "consumed_at": datetime.now().isoformat()
            }
            
            response = requests.post(
                f"{self.base_url}/meals/",
                json=meal_data,
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 201:
                data = response.json()
                if "id" in data and data.get("food_name") == meal_data["food_name"]:
                    self.log_test(
                        "Create Meal", 
                        True, 
                        f"Meal created successfully, ID: {data.get('id')}",
                        {"meal_id": data.get("id"), "food_name": data.get("food_name")}
                    )
                    return True
                else:
                    self.log_test("Create Meal", False, f"Invalid meal data format: {data}")
                    return False
            else:
                self.log_test("Create Meal", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Create Meal", False, f"Request failed: {str(e)}")
            return False
    
    def test_get_user_meals(self) -> bool:
        """Test GET /api/meals/ (get user meals)"""
        if not self.access_token:
            self.log_test("Get User Meals", False, "No access token available")
            return False
            
        try:
            headers = {
                "Authorization": f"Bearer {self.access_token}",
                "Content-Type": "application/json"
            }
            
            response = requests.get(
                f"{self.base_url}/meals/",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test(
                        "Get User Meals", 
                        True, 
                        f"Retrieved {len(data)} meals successfully",
                        {"meals_count": len(data)}
                    )
                    return True
                else:
                    self.log_test("Get User Meals", False, f"Expected list, got: {type(data)}")
                    return False
            else:
                self.log_test("Get User Meals", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Get User Meals", False, f"Request failed: {str(e)}")
            return False
    
    def test_get_todays_meals(self) -> bool:
        """Test GET /api/meals/today (get today's meals)"""
        if not self.access_token:
            self.log_test("Get Today's Meals", False, "No access token available")
            return False
            
        try:
            headers = {
                "Authorization": f"Bearer {self.access_token}",
                "Content-Type": "application/json"
            }
            
            response = requests.get(
                f"{self.base_url}/meals/today",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test(
                        "Get Today's Meals", 
                        True, 
                        f"Retrieved {len(data)} today's meals successfully",
                        {"todays_meals_count": len(data)}
                    )
                    return True
                else:
                    self.log_test("Get Today's Meals", False, f"Expected list, got: {type(data)}")
                    return False
            else:
                self.log_test("Get Today's Meals", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Get Today's Meals", False, f"Request failed: {str(e)}")
            return False
    
    def test_meal_analysis(self) -> bool:
        """Test POST /api/meals/analyze (legacy meal analysis)"""
        try:
            # Create a minimal test image (1x1 pixel PNG)
            test_image_b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77zgAAAABJRU5ErkJggg=="
            
            analysis_data = {
                "image_base64": test_image_b64,
                "meal_type": "lunch"
            }
            
            response = requests.post(
                f"{self.base_url}/meals/analyze",
                json=analysis_data,
                headers={"Content-Type": "application/json"},
                timeout=15
            )
            
            if response.status_code == 200:
                data = response.json()
                if "nutritional_info" in data and data.get("success"):
                    nutrition = data["nutritional_info"]
                    if all(key in nutrition for key in ["calories", "proteins", "carbs", "fats"]):
                        self.log_test(
                            "Meal Analysis", 
                            True, 
                            f"Analysis successful, calories: {nutrition.get('calories')}",
                            {"calories": nutrition.get("calories"), "keto_score": nutrition.get("keto_score")}
                        )
                        return True
                    else:
                        self.log_test("Meal Analysis", False, f"Missing nutrition fields: {nutrition}")
                        return False
                else:
                    self.log_test("Meal Analysis", False, f"Invalid response format: {data}")
                    return False
            else:
                self.log_test("Meal Analysis", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Meal Analysis", False, f"Request failed: {str(e)}")
            return False
    
    def test_food_search(self) -> bool:
        """Test GET /api/foods/search/avocat (French food search)"""
        try:
            response = requests.get(
                f"{self.base_url}/foods/search/avocat",
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if "results" in data and len(data["results"]) > 0:
                    result = data["results"][0]
                    if "name" in result and "nutrition" in result:
                        nutrition = result["nutrition"]
                        self.log_test(
                            "Food Search", 
                            True, 
                            f"Found {result['name']}, calories: {nutrition.get('calories')}",
                            {"food_name": result["name"], "calories": nutrition.get("calories")}
                        )
                        return True
                    else:
                        self.log_test("Food Search", False, f"Invalid result format: {result}")
                        return False
                else:
                    self.log_test("Food Search", False, f"No results found: {data}")
                    return False
            else:
                self.log_test("Food Search", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Food Search", False, f"Request failed: {str(e)}")
            return False
    
    def test_supabase_user_registration(self) -> bool:
        """Test POST /api/auth/register with test email"""
        try:
            user_data = {
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD,
                "full_name": "Contact KetoSansStress",
                "age": 35,
                "gender": "female",
                "height": 165.0,
                "weight": 65.0,
                "activity_level": "moderately_active",
                "goal": "weight_loss",
                "timezone": "Europe/Paris"
            }
            
            response = requests.post(
                f"{self.base_url}/auth/register",
                json=user_data,
                headers={"Content-Type": "application/json"},
                timeout=15
            )
            
            if response.status_code in [201, 409]:  # 201 = created, 409 = already exists
                data = response.json()
                if response.status_code == 201:
                    self.log_test(
                        "Supabase User Registration", 
                        True, 
                        f"User registered successfully: {data.get('user_id', 'Unknown')}",
                        {"user_id": data.get("user_id"), "email": data.get("email")}
                    )
                else:
                    self.log_test(
                        "Supabase User Registration", 
                        True, 
                        f"User already exists (expected): {data.get('detail', 'User exists')}",
                        {"status": "already_exists"}
                    )
                return True
            else:
                self.log_test("Supabase User Registration", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Supabase User Registration", False, f"Request failed: {str(e)}")
            return False
    
    def test_supabase_user_login_test_email(self) -> bool:
        """Test POST /api/auth/login with test email credentials"""
        try:
            login_data = {
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD
            }
            
            response = requests.post(
                f"{self.base_url}/auth/login",
                json=login_data,
                headers={"Content-Type": "application/json"},
                timeout=15
            )
            
            if response.status_code == 200:
                data = response.json()
                if "access_token" in data and "user" in data:
                    # Store test user token for protected endpoint tests
                    self.test_access_token = data["access_token"]
                    self.test_user_id = data["user"]["id"]
                    self.log_test(
                        "Supabase Test User Login", 
                        True, 
                        f"Test user login successful: {data['user'].get('email')}",
                        {"has_token": bool(self.test_access_token), "user_email": data["user"].get("email")}
                    )
                    return True
                else:
                    self.log_test("Supabase Test User Login", False, f"Missing required fields: {data}")
                    return False
            else:
                self.log_test("Supabase Test User Login", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Supabase Test User Login", False, f"Request failed: {str(e)}")
            return False
    
    def test_supabase_meals_save_new(self) -> bool:
        """Test POST /api/meals/save (legacy endpoint)"""
        try:
            meal_data = {
                "user_id": TEST_EMAIL,
                "date": date.today().isoformat(),
                "meal_type": "breakfast",
                "image_base64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A==",
                "nutritional_info": {
                    "calories": 420.0,
                    "proteins": 18.0,
                    "carbs": 8.0,
                    "net_carbs": 5.0,
                    "fats": 35.0,
                    "fiber": 3.0,
                    "keto_score": 9,
                    "foods_detected": ["œufs brouillés", "avocat", "beurre"],
                    "portions": ["2 œufs", "1/2 avocat", "10g beurre"],
                    "confidence": 0.85
                },
                "notes": "Petit-déjeuner keto test pour contact@ketosansstress.com"
            }
            
            response = requests.post(
                f"{self.base_url}/meals/save",
                json=meal_data,
                headers={"Content-Type": "application/json"},
                timeout=15
            )
            
            if response.status_code == 200:
                data = response.json()
                self.log_test(
                    "Supabase Meals Save", 
                    True, 
                    f"Meal saved successfully: {data.get('meal_id', 'Unknown')}",
                    {"meal_id": data.get("meal_id"), "message": data.get("message")}
                )
                return True
            else:
                self.log_test("Supabase Meals Save", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Supabase Meals Save", False, f"Request failed: {str(e)}")
            return False
    
    def test_supabase_meals_get_user_test_email(self) -> bool:
        """Test GET /api/meals/user/{test_email}"""
        try:
            response = requests.get(
                f"{self.base_url}/meals/user/{TEST_EMAIL}",
                params={"date": date.today().isoformat()},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                meals_count = len(data.get("meals", []))
                self.log_test(
                    "Supabase User Meals (Test Email)", 
                    True, 
                    f"Retrieved {meals_count} meals for {TEST_EMAIL}",
                    {"meals_count": meals_count, "user_email": TEST_EMAIL}
                )
                return True
            else:
                self.log_test("Supabase User Meals (Test Email)", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Supabase User Meals (Test Email)", False, f"Request failed: {str(e)}")
            return False
    
    def test_supabase_daily_summary_test_email(self) -> bool:
        """Test GET /api/meals/daily-summary/{test_email}"""
        try:
            response = requests.get(
                f"{self.base_url}/meals/daily-summary/{TEST_EMAIL}",
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                self.log_test(
                    "Supabase Daily Summary (Test Email)", 
                    True, 
                    f"Daily summary retrieved for {TEST_EMAIL} on {data.get('date', 'Unknown')}",
                    {
                        "date": data.get("date"),
                        "total_calories": data.get("totals", {}).get("calories"),
                        "meals_count": data.get("meals_count"),
                        "keto_status": data.get("keto_status")
                    }
                )
                return True
            else:
                self.log_test("Supabase Daily Summary (Test Email)", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Supabase Daily Summary (Test Email)", False, f"Request failed: {str(e)}")
            return False
    
    def test_openfoodfacts_keto_friendly(self) -> bool:
        """Test GET /api/foods/keto-friendly"""
        try:
            response = requests.get(
                f"{self.base_url}/foods/keto-friendly",
                params={"limit": 20},
                timeout=15
            )
            
            if response.status_code == 200:
                data = response.json()
                foods_count = len(data.get("keto_foods", []))
                self.log_test(
                    "OpenFoodFacts Keto Foods", 
                    True, 
                    f"Retrieved {foods_count} keto-friendly foods",
                    {
                        "foods_count": foods_count,
                        "total_count": data.get("count", 0)
                    }
                )
                
                if foods_count > 0:
                    top_food = data["keto_foods"][0]
                    print(f"   Top keto food: {top_food.get('product_name', 'Unknown')} (score: {top_food.get('keto_score', 'N/A')})")
                
                return True
            else:
                self.log_test("OpenFoodFacts Keto Foods", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("OpenFoodFacts Keto Foods", False, f"Request failed: {str(e)}")
            return False
    
    def test_enhanced_meal_analysis(self) -> bool:
        """Test POST /api/meals/analyze-enhanced"""
        try:
            # Create a minimal test image
            test_image = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A=="
            
            analysis_data = {
                "image_base64": test_image,
                "meal_type": "dinner"
            }
            
            response = requests.post(
                f"{self.base_url}/meals/analyze-enhanced",
                json=analysis_data,
                headers={"Content-Type": "application/json"},
                timeout=20
            )
            
            if response.status_code == 200:
                data = response.json()
                ai_analysis = data.get("ai_analysis", {})
                off_suggestions = data.get("openfoodfacts_suggestions", [])
                
                self.log_test(
                    "Enhanced Meal Analysis", 
                    True, 
                    f"Analysis successful with {len(off_suggestions)} OpenFoodFacts suggestions",
                    {
                        "ai_calories": ai_analysis.get("calories"),
                        "ai_keto_score": ai_analysis.get("keto_score"),
                        "ai_foods": ai_analysis.get("foods_detected", []),
                        "off_suggestions_count": len(off_suggestions)
                    }
                )
                return True
            else:
                self.log_test("Enhanced Meal Analysis", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Enhanced Meal Analysis", False, f"Request failed: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all tests in sequence"""
        print(f"\n🧪 Starting KetoSansStress Comprehensive Backend Tests")
        print(f"🔗 Backend URL: {self.base_url}")
        print(f"👤 Demo User: {DEMO_EMAIL}")
        print(f"📧 Test Email: {TEST_EMAIL}")
        print(f"🔑 JWT Secret: 63f08a4d-5168-4ea6-95c2-3e468a03b98c")
        print("=" * 80)
        
        # Initialize test access token storage
        self.test_access_token = None
        self.test_user_id = None
        
        # Priority 1: Health Check
        print("\n📋 PRIORITY 1: System Health")
        health_ok = self.test_health_check()
        
        # Priority 2: Supabase Authentication System
        print("\n🔐 PRIORITY 2: Supabase Authentication System")
        register_ok = self.test_supabase_user_registration()
        test_login_ok = self.test_supabase_user_login_test_email()
        
        # Demo user authentication (existing)
        demo_login_ok = self.test_user_login()
        auth_me_ok = self.test_auth_me_endpoint() if demo_login_ok else False
        
        # Priority 3: New Supabase Meals API
        print("\n🍽️ PRIORITY 3: New Supabase Meals API")
        meals_save_ok = self.test_supabase_meals_save_new()
        user_meals_ok = self.test_supabase_meals_get_user_test_email()
        daily_summary_ok = self.test_supabase_daily_summary_test_email()
        
        # Priority 4: Protected Endpoints (only if auth works)
        print("\n🛡️ PRIORITY 4: Protected Endpoints (New API)")
        if demo_login_ok and auth_me_ok:
            create_meal_ok = self.test_create_meal()
            get_meals_ok = self.test_get_user_meals()
            get_today_ok = self.test_get_todays_meals()
        else:
            print("⚠️ Skipping protected endpoints due to authentication failures")
            create_meal_ok = get_meals_ok = get_today_ok = False
        
        # Priority 5: OpenFoodFacts Integration
        print("\n🥑 PRIORITY 5: OpenFoodFacts Integration")
        food_search_ok = self.test_food_search()
        keto_foods_ok = self.test_openfoodfacts_keto_friendly()
        enhanced_analysis_ok = self.test_enhanced_meal_analysis()
        
        # Priority 6: Legacy Endpoints
        print("\n🔄 PRIORITY 6: Legacy Endpoints")
        meal_analysis_ok = self.test_meal_analysis()
        
        # Summary
        print("\n" + "=" * 80)
        print("📊 COMPREHENSIVE TEST SUMMARY")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests*100):.1f}%")
        
        # Critical Issues Analysis
        critical_failures = []
        if not health_ok:
            critical_failures.append("System Health Check Failed")
        if not register_ok and not test_login_ok:
            critical_failures.append("Supabase Authentication System Failed")
        if not demo_login_ok:
            critical_failures.append("Demo User Login Failed")
        if not auth_me_ok and demo_login_ok:
            critical_failures.append("JWT Token Validation Failed")
        if not meals_save_ok:
            critical_failures.append("Supabase Meals Save Failed")
        if not daily_summary_ok:
            critical_failures.append("Supabase Daily Summary Failed")
        if not food_search_ok:
            critical_failures.append("OpenFoodFacts Integration Failed")
        
        # Test Categories Summary
        print(f"\n📋 TEST CATEGORIES SUMMARY:")
        categories = {
            "System Health": [health_ok],
            "Supabase Auth": [register_ok, test_login_ok, demo_login_ok, auth_me_ok],
            "Supabase Meals": [meals_save_ok, user_meals_ok, daily_summary_ok],
            "Protected Endpoints": [create_meal_ok, get_meals_ok, get_today_ok],
            "OpenFoodFacts": [food_search_ok, keto_foods_ok, enhanced_analysis_ok],
            "Legacy Endpoints": [meal_analysis_ok]
        }
        
        for category, results in categories.items():
            passed = sum(1 for r in results if r)
            total = len(results)
            status = "✅" if passed == total else "⚠️" if passed > 0 else "❌"
            print(f"   {status} {category}: {passed}/{total} passed")
        
        if critical_failures:
            print(f"\n🚨 CRITICAL ISSUES REQUIRING ATTENTION:")
            for issue in critical_failures:
                print(f"   • {issue}")
        
        # Detailed Results
        print(f"\n📋 DETAILED TEST RESULTS:")
        for result in self.test_results:
            status = "✅" if result["success"] else "❌"
            print(f"   {status} {result['test']}: {result['details']}")
        
        return {
            "total": total_tests,
            "passed": passed_tests,
            "failed": failed_tests,
            "success_rate": passed_tests/total_tests*100,
            "critical_failures": critical_failures,
            "categories": categories,
            "results": self.test_results
        }

if __name__ == "__main__":
    tester = KetoJWTTester()
    results = tester.run_all_tests()
    
    # Exit with error code if critical tests failed
    if results["critical_failures"]:
        exit(1)
    else:
        exit(0)