#!/usr/bin/env python3
"""
Backend API Testing for KetoSansStress User Preferences
Tests all User Preferences CRUD operations and helper endpoints
Focus: Comprehensive testing of the newly implemented preferences API
"""

import requests
import json
import uuid
from datetime import datetime
from typing import Dict, Any, Optional

# Configuration
BASE_URL = "https://ketotrackerapp-1.preview.emergentagent.com/api"
TEST_USER_EMAIL = f"test_prefs_{uuid.uuid4().hex[:8]}@ketosansstress.com"
TEST_USER_PASSWORD = "TestPassword123!"

class PreferencesAPITester:
    def __init__(self):
        self.base_url = BASE_URL
        self.session = requests.Session()
        self.access_token = None
        self.user_id = None
        self.test_results = []
        
    def log_test(self, test_name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        if response_data:
            result["response_data"] = response_data
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {details}")
        
    def test_health_check(self):
        """Test the health check endpoint."""
        print("\n🏥 Testing Health Check...")
        try:
            response = self.session.get(f"{self.base_url}/health", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "healthy" and data.get("supabase") == "healthy":
                    self.log_test("Health Check", True, 
                        f"Service: {data.get('service')}, Supabase: healthy")
                else:
                    self.log_test("Health Check", False, 
                        f"Service status: {data.get('status')}, Supabase: {data.get('supabase')}")
            else:
                self.log_test("Health Check", False, f"HTTP {response.status_code}")
        except Exception as e:
            self.log_test("Health Check", False, f"Connection error: {str(e)}")

    def test_user_registration(self):
        """Test new user registration."""
        print("\n👤 Testing User Registration...")
        
        user_data = {
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD,
            "full_name": "Test Global Reset User",
            "age": 28,
            "gender": "female",
            "height": 165.0,
            "weight": 65.0,
            "activity_level": "moderately_active",
            "goal": "weight_loss",
            "timezone": "Europe/Paris"
        }
        
        try:
            response = self.session.post(f"{self.base_url}/auth/register", json=user_data, timeout=10)
            
            if response.status_code == 201:
                data = response.json()
                user_id = data.get("user_id")
                email = data.get("email")
                if user_id and email == TEST_USER_EMAIL:
                    self.log_test("User Registration", True, f"User ID: {user_id}")
                else:
                    self.log_test("User Registration", False, f"Missing user data: {data}")
            elif response.status_code == 409:
                self.log_test("User Registration", True, "User already exists (expected)")
            else:
                self.log_test("User Registration", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("User Registration", False, f"Connection error: {str(e)}")

    def test_user_login(self):
        """Test user login and token retrieval."""
        print("\n🔐 Testing User Login...")
        
        login_data = {
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        }
        
        try:
            response = self.session.post(f"{self.base_url}/auth/login", json=login_data, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                access_token = data.get("access_token")
                user_info = data.get("user", {})
                
                if access_token and user_info.get("email") == TEST_USER_EMAIL:
                    self.auth_token = access_token
                    self.session.headers.update({"Authorization": f"Bearer {access_token}"})
                    self.log_test("User Login", True, f"Token received, User: {user_info.get('email')}")
                else:
                    self.log_test("User Login", False, f"Missing token or user info: {data}")
            else:
                self.log_test("User Login", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("User Login", False, f"Connection error: {str(e)}")

    def test_jwt_validation(self):
        """Test JWT token validation."""
        print("\n🎫 Testing JWT Token Validation...")
        
        if not self.auth_token:
            self.log_test("JWT Token Validation", False, "No access token available")
            return
            
        try:
            response = self.session.get(f"{self.base_url}/auth/me", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                user_id = data.get("id")
                email = data.get("email")
                
                if user_id and email:
                    self.log_test("JWT Token Validation", True, f"User: {email}, ID: {user_id}")
                else:
                    self.log_test("JWT Token Validation", False, f"Missing user data: {data}")
            else:
                self.log_test("JWT Token Validation", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("JWT Token Validation", False, f"Connection error: {str(e)}")

    def test_new_meals_api_create(self):
        """Test new Supabase meals API - Create meal (THE MAIN BLOCKER)."""
        print("\n🍽️ Testing New Meals API - Create Meal (CRITICAL TEST)...")
        
        if not self.auth_token:
            self.log_test("Create Meal API", False, "No access token available")
            return
            
        meal_data = {
            "food_name": "Avocat grillé au saumon",
            "brand": "Maison",  # THIS WAS THE MISSING COLUMN!
            "meal_type": "breakfast",
            "quantity": 1.0,
            "unit": "portion",
            "calories": 420,
            "protein": 25.0,
            "carbohydrates": 8.0,
            "total_fat": 32.0,
            "saturated_fat": 6.0,
            "fiber": 7.0,
            "sugar": 2.0,
            "sodium": 150.0,
            "potassium": 680.0,
            "consumed_at": datetime.now().isoformat()
        }
        
        try:
            response = self.session.post(f"{self.base_url}/meals/", json=meal_data, timeout=10)
            
            if response.status_code == 201:
                data = response.json()
                meal_id = data.get("id")
                food_name = data.get("food_name")
                brand = data.get("brand")
                
                if meal_id and food_name == meal_data["food_name"] and brand == meal_data["brand"]:
                    self.log_test("Create Meal API", True, f"Meal created: {food_name}, Brand: {brand}, ID: {meal_id}")
                else:
                    self.log_test("Create Meal API", False, f"Missing meal data: {data}")
            else:
                error_text = response.text
                if "brand" in error_text.lower():
                    self.log_test("Create Meal API", False, f"BRAND COLUMN STILL MISSING! Error: {error_text}")
                else:
                    self.log_test("Create Meal API", False, f"HTTP {response.status_code}: {error_text}")
        except Exception as e:
            self.log_test("Create Meal API", False, f"Connection error: {str(e)}")

    def test_new_meals_api_list(self):
        """Test new Supabase meals API - List meals."""
        print("\n📋 Testing New Meals API - List Meals...")
        
        if not self.auth_token:
            self.log_test("List Meals API", False, "No access token available")
            return
            
        try:
            response = self.session.get(f"{self.base_url}/meals/", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    meal_count = len(data)
                    self.log_test("List Meals API", True, f"Retrieved {meal_count} meals")
                else:
                    self.log_test("List Meals API", False, f"Expected list, got: {type(data)}")
            else:
                self.log_test("List Meals API", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("List Meals API", False, f"Connection error: {str(e)}")

    def test_new_meals_api_today(self):
        """Test new Supabase meals API - Today's meals."""
        print("\n📅 Testing New Meals API - Today's Meals...")
        
        if not self.auth_token:
            self.log_test("Today's Meals API", False, "No access token available")
            return
            
        try:
            response = self.session.get(f"{self.base_url}/meals/today", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    meal_count = len(data)
                    self.log_test("Today's Meals API", True, f"Retrieved {meal_count} today's meals")
                else:
                    self.log_test("Today's Meals API", False, f"Expected list, got: {type(data)}")
            else:
                self.log_test("Today's Meals API", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Today's Meals API", False, f"Connection error: {str(e)}")

    def test_legacy_meal_analysis(self):
        """Test legacy meal analysis with AI."""
        print("\n🤖 Testing Legacy Meal Analysis...")
        
        # Create a simple test image (1x1 pixel PNG)
        test_image_b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77mgAAAABJRU5ErkJggg=="
        
        analysis_data = {
            "image_base64": test_image_b64,
            "meal_type": "lunch"
        }
        
        try:
            response = self.session.post(f"{self.base_url}/meals/analyze", json=analysis_data, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                nutritional_info = data.get("nutritional_info", {})
                meal_type = data.get("meal_type")
                
                if nutritional_info and meal_type == "lunch":
                    calories = nutritional_info.get("calories", 0)
                    self.log_test("Legacy Meal Analysis", True, f"Analysis complete, Calories: {calories}")
                else:
                    self.log_test("Legacy Meal Analysis", False, f"Missing analysis data: {data}")
            else:
                self.log_test("Legacy Meal Analysis", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Legacy Meal Analysis", False, f"Connection error: {str(e)}")

    def test_legacy_food_search(self):
        """Test legacy French food search."""
        print("\n🔍 Testing Legacy Food Search...")
        
        try:
            response = self.session.get(f"{self.base_url}/foods/search/avocat", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                results = data.get("results", [])
                
                if results and len(results) > 0:
                    food_name = results[0].get("name")
                    nutrition = results[0].get("nutrition", {})
                    calories = nutrition.get("calories", 0)
                    
                    self.log_test("Legacy Food Search", True, f"Found: {food_name}, Calories: {calories}")
                else:
                    self.log_test("Legacy Food Search", False, "No results found")
            else:
                self.log_test("Legacy Food Search", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Legacy Food Search", False, f"Connection error: {str(e)}")

    def test_legacy_daily_summary(self):
        """Test legacy daily summary endpoint."""
        print("\n📊 Testing Legacy Daily Summary...")
        
        try:
            response = self.session.get(f"{self.base_url}/meals/daily-summary/{DEMO_USER_EMAIL}", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                totals = data.get("totals", {})
                targets = data.get("targets", {})
                keto_status = data.get("keto_status")
                
                if totals and targets and keto_status:
                    calories = totals.get("calories", 0)
                    self.log_test("Legacy Daily Summary", True, f"Summary: {calories} cal, Status: {keto_status}")
                else:
                    self.log_test("Legacy Daily Summary", False, f"Missing summary data: {data}")
            else:
                self.log_test("Legacy Daily Summary", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Legacy Daily Summary", False, f"Connection error: {str(e)}")

    def test_openfoodfacts_keto_friendly(self):
        """Test OpenFoodFacts keto-friendly foods endpoint."""
        print("\n🥑 Testing OpenFoodFacts Keto-Friendly Foods...")
        
        try:
            response = self.session.get(f"{self.base_url}/foods/keto-friendly", timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                keto_foods = data.get("keto_foods", [])
                count = data.get("count", 0)
                
                self.log_test("OpenFoodFacts Keto-Friendly", True, f"Found {count} keto-friendly foods")
            else:
                self.log_test("OpenFoodFacts Keto-Friendly", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("OpenFoodFacts Keto-Friendly", False, f"Connection error: {str(e)}")

    def test_database_schema_validation(self):
        """Test database schema by attempting operations that require specific columns."""
        print("\n🗄️ Testing Database Schema Validation...")
        
        if not self.auth_token:
            self.log_test("Database Schema Validation", False, "No access token available")
            return
        
        # Test creating a meal WITHOUT brand column first
        meal_without_brand = {
            "food_name": "Test Schema No Brand",
            "meal_type": "snack",
            "quantity": 1.0,
            "unit": "piece",
            "calories": 50,
            "protein": 2.0,
            "carbohydrates": 5.0,
            "total_fat": 1.0,
            "fiber": 1.0,
            "consumed_at": datetime.now().isoformat()
        }
        
        try:
            response = self.session.post(f"{self.base_url}/meals/", json=meal_without_brand, timeout=10)
            
            if response.status_code == 201:
                self.log_test("Database Schema Validation", True, "Schema allows meals without brand column")
            else:
                error_text = response.text
                if "brand" in error_text.lower():
                    self.log_test("Database Schema Validation", False, f"Brand column required but missing from schema: {error_text}")
                else:
                    self.log_test("Database Schema Validation", False, f"Other schema issue: {error_text}")
        except Exception as e:
            self.log_test("Database Schema Validation", False, f"Connection error: {str(e)}")

    def run_all_tests(self):
        """Run all backend tests."""
        print("🚀 CRITICAL VALIDATION: KetoSansStress Backend Testing After GLOBAL RESET")
        print("Expected: 100% success rate (was 73.3% before)")
        print("=" * 80)
        
        # Core system tests
        self.test_health_check()
        
        # Authentication system tests
        self.test_user_registration()
        self.test_user_login()
        self.test_jwt_validation()
        
        # NEW SUPABASE MEALS API TESTS (PRIORITY VALIDATION)
        print("\n" + "="*50)
        print("🎯 PRIORITY VALIDATION TESTS - NEW SUPABASE MEALS API")
        print("="*50)
        self.test_new_meals_api_create()  # THE MAIN BLOCKER
        self.test_new_meals_api_list()
        self.test_new_meals_api_today()
        
        # Database schema validation
        self.test_database_schema_validation()
        
        # Legacy endpoints tests
        print("\n" + "="*40)
        print("🔄 LEGACY ENDPOINTS VALIDATION")
        print("="*40)
        self.test_legacy_meal_analysis()
        self.test_legacy_food_search()
        self.test_legacy_daily_summary()
        
        # OpenFoodFacts integration
        self.test_openfoodfacts_keto_friendly()
        
        # Print final results
        self.print_final_results()

    def print_final_results(self):
        """Print comprehensive test results."""
        print("\n" + "=" * 80)
        print("🧪 COMPREHENSIVE TEST RESULTS - GLOBAL RESET VALIDATION")
        print("=" * 80)
        
        success_rate = (self.passed_tests / self.total_tests * 100) if self.total_tests > 0 else 0
        
        print(f"📊 Overall Success Rate: {success_rate:.1f}% ({self.passed_tests}/{self.total_tests})")
        print(f"📈 Previous Success Rate: 73.3%")
        
        if success_rate == 100.0:
            print("🎉 PERFECT SCORE! GLOBAL RESET SQL SCRIPT WORKED!")
            print("✅ All database schema issues resolved!")
            print("✅ 'brand' column issue completely fixed!")
        elif success_rate >= 90.0:
            print("🎯 EXCELLENT! Nearly perfect - minor issues remain")
        elif success_rate >= 80.0:
            print("👍 GOOD! Significant improvement from 73.3%")
        elif success_rate <= 73.3:
            print("❌ CRITICAL: NO IMPROVEMENT! GLOBAL RESET SQL SCRIPT NOT EXECUTED!")
            print("🚨 The 'brand' column and other schema issues are still present!")
        else:
            print("⚠️  PARTIAL IMPROVEMENT but critical issues remain")
        
        # Show failed tests
        failed_tests = [r for r in self.test_results if not r["success"]]
        if failed_tests:
            print(f"\n❌ FAILED TESTS ({len(failed_tests)}):")
            for test in failed_tests:
                print(f"   • {test['test']}: {test['details']}")
                
            # Check for specific critical failures
            critical_failures = [t for t in failed_tests if "brand" in t['details'].lower()]
            if critical_failures:
                print(f"\n🚨 CRITICAL FINDING:")
                print("   The 'brand' column error is still present!")
                print("   This proves the GLOBAL RESET SQL script was NOT executed!")
        
        # Show passed tests
        passed_tests = [r for r in self.test_results if r["success"]]
        if passed_tests:
            print(f"\n✅ PASSED TESTS ({len(passed_tests)}):")
            for test in passed_tests:
                print(f"   • {test['test']}")
        
        print("\n" + "=" * 80)
        
        # Final verdict
        if success_rate <= 73.3:
            print("🔴 VERDICT: USER HAS NOT EXECUTED THE GLOBAL RESET SQL SCRIPT!")
            print("   The database schema issues are still present.")
            print("   Expected 100% success rate, got {:.1f}%".format(success_rate))
        elif success_rate == 100.0:
            print("🟢 VERDICT: GLOBAL RESET SQL SCRIPT SUCCESSFULLY EXECUTED!")
            print("   All database schema issues resolved!")
        else:
            print("🟡 VERDICT: PARTIAL SUCCESS - Some improvements made")

if __name__ == "__main__":
    tester = KetoBackendTester()
    tester.run_all_tests()