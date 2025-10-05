#!/usr/bin/env python3
"""
KetoSansStress Backend API Testing Suite
CRITICAL VALIDATION: Testing after GLOBAL RESET SQL script execution
Expected: 100% success rate (was 73.3% before)
Focus: Verify "brand" column and all schema issues are COMPLETELY RESOLVED
"""

import requests
import json
import base64
import os
import time
from datetime import datetime, date
from typing import Dict, Any, Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get backend URL from frontend .env file
def get_backend_url():
    frontend_env_path = "/app/frontend/.env"
    try:
        with open(frontend_env_path, 'r') as f:
            for line in f:
                if line.startswith('EXPO_PUBLIC_BACKEND_URL='):
                    return line.split('=', 1)[1].strip()
    except Exception as e:
        print(f"❌ Could not read frontend .env file: {e}")
    return "https://ketotrack.preview.emergentagent.com"

BACKEND_URL = f"{get_backend_url()}/api"

# Test credentials - using fresh user for clean testing
TEST_USER_EMAIL = "test.global.reset@ketosansstress.com"
TEST_USER_PASSWORD = "GlobalReset2025!"
DEMO_USER_EMAIL = "demo@keto.fr"

class KetoBackendTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.session = requests.Session()
        self.auth_token = None
        self.test_results = []
        
    def log_test(self, test_name: str, success: bool, details: str, response_data: Any = None):
        """Log test results."""
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
        
    def test_health_check(self):
        """Test the health check endpoint."""
        try:
            response = self.session.get(f"{self.base_url}/health", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "healthy" and data.get("supabase") == "healthy":
                    self.log_test("Health Check", True, 
                                f"Service healthy, Supabase healthy. Service: {data.get('service')}")
                else:
                    self.log_test("Health Check", False, 
                                f"Health check returned unhealthy status: {data}")
            else:
                self.log_test("Health Check", False, 
                            f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Health Check", False, f"Request failed: {str(e)}")
    
    def test_keto_friendly_foods(self):
        """Test the FIXED OpenFoodFacts keto-friendly foods endpoint."""
        try:
            response = self.session.get(f"{self.base_url}/foods/keto-friendly", timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                keto_foods = data.get("keto_foods", [])
                count = data.get("count", 0)
                
                if count > 0 and len(keto_foods) > 0:
                    # Check if foods have proper keto scores
                    valid_foods = [f for f in keto_foods if f.get('keto_score', 0) >= 7]
                    self.log_test("OpenFoodFacts Keto-Friendly Foods", True,
                                f"Retrieved {count} keto-friendly foods, {len(valid_foods)} with score ≥7. NoneType bug appears fixed.")
                else:
                    self.log_test("OpenFoodFacts Keto-Friendly Foods", False,
                                f"No keto foods returned. Count: {count}")
            else:
                self.log_test("OpenFoodFacts Keto-Friendly Foods", False,
                            f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("OpenFoodFacts Keto-Friendly Foods", False, f"Request failed: {str(e)}")
    
    def test_user_registration(self, email: str, password: str):
        """Test user registration."""
        try:
            registration_data = {
                "email": email,
                "password": password,
                "full_name": "Test User Demo",
                "age": 30,
                "gender": "female",
                "height": 170.0,
                "weight": 70.0,
                "activity_level": "moderately_active",
                "goal": "weight_loss",
                "timezone": "Europe/Paris"
            }
            
            response = self.session.post(
                f"{self.base_url}/auth/register",
                json=registration_data,
                timeout=10
            )
            
            if response.status_code == 201:
                data = response.json()
                user_id = data.get("user_id")
                self.log_test("User Registration", True,
                            f"User registered successfully. ID: {user_id}, Email: {email}")
                return True
            elif response.status_code == 409:
                self.log_test("User Registration", True,
                            f"User already exists (expected): {email}")
                return True
            else:
                self.log_test("User Registration", False,
                            f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("User Registration", False, f"Request failed: {str(e)}")
            return False
    
    def test_create_fresh_user(self):
        """Create a fresh test user for testing."""
        import time
        fresh_email = f"test{int(time.time())}@ketosansstress.com"
        fresh_password = "testpass123"
        
        try:
            registration_data = {
                "email": fresh_email,
                "password": fresh_password,
                "full_name": "Fresh Test User",
                "age": 25,
                "gender": "male",
                "height": 175.0,
                "weight": 75.0,
                "activity_level": "moderately_active",
                "goal": "weight_loss",
                "timezone": "Europe/Paris"
            }
            
            response = self.session.post(
                f"{self.base_url}/auth/register",
                json=registration_data,
                timeout=10
            )
            
            if response.status_code == 201:
                data = response.json()
                user_id = data.get("user_id")
                self.log_test("Fresh User Registration", True,
                            f"Fresh user registered. ID: {user_id}, Email: {fresh_email}")
                
                # Now try to login with the fresh user
                login_success = self.test_user_login(fresh_email, fresh_password)
                return login_success
            else:
                self.log_test("Fresh User Registration", False,
                            f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Fresh User Registration", False, f"Request failed: {str(e)}")
            return False
    
    def test_user_login(self, email: str, password: str):
        """Test user login and store auth token."""
        try:
            login_data = {
                "email": email,
                "password": password
            }
            
            response = self.session.post(
                f"{self.base_url}/auth/login",
                json=login_data,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                access_token = data.get("access_token")
                user_info = data.get("user", {})
                
                if access_token:
                    self.auth_token = access_token
                    self.session.headers.update({"Authorization": f"Bearer {access_token}"})
                    self.log_test("User Login", True,
                                f"Login successful for {email}. User ID: {user_info.get('id')}")
                    return True
                else:
                    self.log_test("User Login", False, "No access token in response")
                    return False
            else:
                self.log_test("User Login", False,
                            f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("User Login", False, f"Request failed: {str(e)}")
            return False
    
    def test_auth_me(self):
        """Test JWT token validation with /auth/me endpoint."""
        if not self.auth_token:
            self.log_test("JWT Token Validation", False, "No auth token available")
            return False
            
        try:
            response = self.session.get(f"{self.base_url}/auth/me", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                user_id = data.get("id")
                email = data.get("email")
                self.log_test("JWT Token Validation", True,
                            f"Token validation successful. User: {email} (ID: {user_id})")
                return True
            else:
                self.log_test("JWT Token Validation", False,
                            f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("JWT Token Validation", False, f"Request failed: {str(e)}")
            return False
    
    def test_new_meals_api_create(self):
        """Test new Supabase meals API - Create meal."""
        if not self.auth_token:
            self.log_test("New Meals API - Create", False, "No auth token available")
            return False
            
        try:
            meal_data = {
                "food_name": "Avocat grillé",
                "meal_type": "breakfast",
                "quantity": 1.0,
                "unit": "piece",
                "calories": 160,
                "protein": 2.0,
                "carbohydrates": 9.0,
                "total_fat": 15.0,
                "fiber": 7.0,
                "consumed_at": datetime.now().isoformat()
            }
            
            response = self.session.post(
                f"{self.base_url}/meals/",
                json=meal_data,
                timeout=10
            )
            
            if response.status_code == 201:
                data = response.json()
                meal_id = data.get("id")
                self.log_test("New Meals API - Create", True,
                            f"Meal created successfully. ID: {meal_id}")
                return True
            else:
                self.log_test("New Meals API - Create", False,
                            f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("New Meals API - Create", False, f"Request failed: {str(e)}")
            return False
    
    def test_new_meals_api_get(self):
        """Test new Supabase meals API - Get meals."""
        if not self.auth_token:
            self.log_test("New Meals API - Get", False, "No auth token available")
            return False
            
        try:
            response = self.session.get(f"{self.base_url}/meals/", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                meal_count = len(data) if isinstance(data, list) else 0
                self.log_test("New Meals API - Get", True,
                            f"Retrieved {meal_count} meals successfully")
                return True
            else:
                self.log_test("New Meals API - Get", False,
                            f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("New Meals API - Get", False, f"Request failed: {str(e)}")
            return False
    
    def test_new_meals_api_today(self):
        """Test new Supabase meals API - Get today's meals."""
        if not self.auth_token:
            self.log_test("New Meals API - Today", False, "No auth token available")
            return False
            
        try:
            response = self.session.get(f"{self.base_url}/meals/today", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                meal_count = len(data) if isinstance(data, list) else 0
                self.log_test("New Meals API - Today", True,
                            f"Retrieved {meal_count} today's meals successfully")
                return True
            else:
                self.log_test("New Meals API - Today", False,
                            f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("New Meals API - Today", False, f"Request failed: {str(e)}")
            return False
    
    def test_legacy_endpoints(self):
        """Test legacy endpoints to ensure no regressions."""
        
        # Test meal analysis
        try:
            # Create a minimal base64 image for testing
            test_image = base64.b64encode(b"fake_image_data").decode()
            analysis_data = {
                "image_base64": test_image,
                "meal_type": "breakfast"
            }
            
            response = self.session.post(
                f"{self.base_url}/meals/analyze",
                json=analysis_data,
                timeout=15
            )
            
            if response.status_code == 200:
                data = response.json()
                nutritional_info = data.get("nutritional_info", {})
                self.log_test("Legacy Meal Analysis", True,
                            f"Analysis successful. Calories: {nutritional_info.get('calories')}")
            else:
                self.log_test("Legacy Meal Analysis", False,
                            f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Legacy Meal Analysis", False, f"Request failed: {str(e)}")
        
        # Test food search
        try:
            response = self.session.get(f"{self.base_url}/foods/search/avocat", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                results = data.get("results", [])
                self.log_test("Legacy Food Search", True,
                            f"Found {len(results)} results for 'avocat'")
            else:
                self.log_test("Legacy Food Search", False,
                            f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Legacy Food Search", False, f"Request failed: {str(e)}")
        
        # Test daily summary
        try:
            response = self.session.get(f"{self.base_url}/meals/daily-summary/demo@keto.fr", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                totals = data.get("totals", {})
                self.log_test("Legacy Daily Summary", True,
                            f"Daily summary retrieved. Calories: {totals.get('calories')}")
            else:
                self.log_test("Legacy Daily Summary", False,
                            f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Legacy Daily Summary", False, f"Request failed: {str(e)}")
    
    def test_user_profile_completeness(self):
        """Test that demo user has complete profile data after schema update."""
        if not self.auth_token:
            self.log_test("User Profile Completeness", False, "No auth token available")
            return False
            
        try:
            response = self.session.get(f"{self.base_url}/auth/me", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ['age', 'gender', 'height', 'weight', 'activity_level', 'goal']
                missing_fields = []
                
                for field in required_fields:
                    if not data.get(field):
                        missing_fields.append(field)
                
                if not missing_fields:
                    profile_summary = f"Age: {data.get('age')}, Gender: {data.get('gender')}, Height: {data.get('height')}cm, Weight: {data.get('weight')}kg, Activity: {data.get('activity_level')}, Goal: {data.get('goal')}"
                    self.log_test("User Profile Completeness", True, profile_summary)
                    return True
                else:
                    self.log_test("User Profile Completeness", False, 
                                f"Missing required fields: {', '.join(missing_fields)}")
                    return False
            else:
                self.log_test("User Profile Completeness", False,
                            f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("User Profile Completeness", False, f"Request failed: {str(e)}")
            return False

    def test_new_meals_api_with_brand(self):
        """Test new Supabase meals API - Create meal with brand column."""
        if not self.auth_token:
            self.log_test("New Meals API - Create with Brand", False, "No auth token available")
            return False
            
        try:
            meal_data = {
                "food_name": "Avocat bio français",
                "brand": "Carrefour Bio",  # This was the missing column
                "meal_type": "breakfast",
                "serving_size": "1 medium avocado",
                "quantity": 1.0,
                "unit": "piece",
                "calories": 234,
                "protein": 2.9,
                "carbohydrates": 12.0,
                "total_fat": 21.4,
                "saturated_fat": 3.1,
                "fiber": 10.0,
                "sugar": 1.0,
                "sodium": 7.0,
                "potassium": 485.0,
                "notes": "Test meal after schema completion",
                "preparation_method": "raw",
                "consumed_at": datetime.now().isoformat()
            }
            
            response = self.session.post(
                f"{self.base_url}/meals/",
                json=meal_data,
                timeout=10
            )
            
            if response.status_code == 201:
                data = response.json()
                meal_id = data.get("id")
                brand = data.get("brand")
                self.log_test("New Meals API - Create with Brand", True,
                            f"Meal created successfully. ID: {meal_id}, Brand: {brand}")
                return True
            else:
                self.log_test("New Meals API - Create with Brand", False,
                            f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("New Meals API - Create with Brand", False, f"Request failed: {str(e)}")
            return False
    
    def test_new_meals_api_without_brand(self):
        """Test new Supabase meals API - Create meal without brand column (fallback test)."""
        if not self.auth_token:
            self.log_test("New Meals API - Create without Brand", False, "No auth token available")
            return False
            
        try:
            meal_data = {
                "food_name": "Avocat simple",
                "meal_type": "breakfast",
                "serving_size": "1 medium avocado",
                "quantity": 1.0,
                "unit": "piece",
                "calories": 234,
                "protein": 2.9,
                "carbohydrates": 12.0,
                "total_fat": 21.4,
                "saturated_fat": 3.1,
                "fiber": 10.0,
                "sugar": 1.0,
                "sodium": 7.0,
                "potassium": 485.0,
                "notes": "Test meal without brand column",
                "preparation_method": "raw",
                "consumed_at": datetime.now().isoformat()
            }
            
            response = self.session.post(
                f"{self.base_url}/meals/",
                json=meal_data,
                timeout=10
            )
            
            if response.status_code == 201:
                data = response.json()
                meal_id = data.get("id")
                self.log_test("New Meals API - Create without Brand", True,
                            f"Meal created successfully without brand. ID: {meal_id}")
                return True
            else:
                self.log_test("New Meals API - Create without Brand", False,
                            f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("New Meals API - Create without Brand", False, f"Request failed: {str(e)}")
            return False

    def run_comprehensive_test(self):
        """Run all backend tests focusing on post-schema completion validation."""
        print("🧪 KETOSANSSTRESS BACKEND TESTING SUITE")
        print("🎯 FINAL VALIDATION AFTER SUPABASE SCHEMA COMPLETION")
        print("Expected: 100% success rate (was 81.8% before)")
        print("=" * 70)
        
        # Priority 1: System Health
        print("\n📋 PRIORITY 1: System Health Check")
        self.test_health_check()
        
        # Priority 2: Authentication System
        print("\n📋 PRIORITY 2: Authentication System")
        # Try with the expected demo user first
        self.test_user_registration(TEST_USER_EMAIL, TEST_USER_PASSWORD)
        login_success = self.test_user_login(TEST_USER_EMAIL, TEST_USER_PASSWORD)
        
        # If demo user login fails, try creating a fresh user
        if not login_success:
            print("Demo user login failed, trying fresh user...")
            login_success = self.test_create_fresh_user()
        
        if login_success:
            self.test_auth_me()
            self.test_user_profile_completeness()
        
        # Priority 3: NEW SUPABASE MEALS API (Main focus - was failing before)
        print("\n🎯 PRIORITY 3: NEW SUPABASE MEALS API (Expected to be FIXED)")
        print("Previously failing due to missing 'brand' column")
        self.test_new_meals_api_with_brand()
        self.test_new_meals_api_without_brand()  # Fallback test
        self.test_new_meals_api_get()
        self.test_new_meals_api_today()
        
        # Priority 4: Legacy Endpoints (regression testing)
        print("\n📋 PRIORITY 4: Legacy Endpoints (Regression Testing)")
        self.test_legacy_endpoints()
        
        # Priority 5: Fixed OpenFoodFacts API
        print("\n📋 PRIORITY 5: Fixed OpenFoodFacts Keto-Friendly Foods")
        self.test_keto_friendly_foods()
        
        # Summary
        print("\n" + "=" * 70)
        print("🏁 FINAL TEST SUMMARY")
        print("=" * 70)
        
        passed = sum(1 for result in self.test_results if result["success"])
        total = len(self.test_results)
        success_rate = (passed/total*100) if total > 0 else 0
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed} ✅")
        print(f"Failed: {total - passed} ❌")
        print(f"Success Rate: {success_rate:.1f}%")
        
        if success_rate == 100.0:
            print("\n🎉 PERFECT! All tests passed - Supabase schema completion successful!")
        elif success_rate >= 90.0:
            print(f"\n✅ EXCELLENT! {success_rate:.1f}% success rate - Major improvement from 81.8%")
        elif success_rate > 81.8:
            print(f"\n📈 IMPROVED! {success_rate:.1f}% success rate - Better than previous 81.8%")
        else:
            print(f"\n⚠️  NEEDS WORK: {success_rate:.1f}% success rate - Still below previous 81.8%")
        
        # Show failed tests with details
        failed_tests = [result for result in self.test_results if not result["success"]]
        if failed_tests:
            print(f"\n❌ FAILED TESTS ({len(failed_tests)}):")
            for test in failed_tests:
                print(f"  • {test['test']}: {test['details']}")
        
        # Show successful tests
        successful_tests = [result for result in self.test_results if result["success"]]
        if successful_tests:
            print(f"\n✅ SUCCESSFUL TESTS ({len(successful_tests)}):")
            for test in successful_tests:
                print(f"  • {test['test']}")
        
        return self.test_results

if __name__ == "__main__":
    tester = KetoBackendTester()
    results = tester.run_comprehensive_test()