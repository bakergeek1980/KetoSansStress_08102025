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
    },
    "test_user": {
        "email": "test@ketosansstress.com",
        "password": "password123"
    }
}

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
                "full_name": "Test User",
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
    
    def run_comprehensive_test(self):
        """Run all backend tests in priority order."""
        print("🧪 Starting KetoSansStress Backend Testing Suite")
        print("Testing Phase 1 and Phase 2 improvements")
        print("=" * 60)
        
        # Priority 1: Health Check
        print("\n📋 PRIORITY 1: Health Check")
        self.test_health_check()
        
        # Priority 2: Fixed OpenFoodFacts Keto-Friendly API
        print("\n📋 PRIORITY 2: Fixed OpenFoodFacts Keto-Friendly Foods")
        self.test_keto_friendly_foods()
        
        # Priority 3: Supabase Authentication System
        print("\n📋 PRIORITY 3: Supabase Authentication System")
        
        # Test with demo user (known to work)
        demo_email = TEST_CREDENTIALS["demo_user"]["email"]
        demo_password = TEST_CREDENTIALS["demo_user"]["password"]
        
        self.test_user_registration(demo_email, demo_password)
        login_success = self.test_user_login(demo_email, demo_password)
        
        if login_success:
            self.test_auth_me()
        
        # Priority 4: New Supabase Meals API (may fail due to missing schema)
        print("\n📋 PRIORITY 4: New Supabase Meals API")
        self.test_new_meals_api_create()
        self.test_new_meals_api_get()
        self.test_new_meals_api_today()
        
        # Priority 5: Legacy Endpoints (regression testing)
        print("\n📋 PRIORITY 5: Legacy Endpoints (Regression Testing)")
        self.test_legacy_endpoints()
        
        # Summary
        print("\n" + "=" * 60)
        print("🏁 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if result["success"])
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total*100):.1f}%")
        
        # Show failed tests
        failed_tests = [result for result in self.test_results if not result["success"]]
        if failed_tests:
            print(f"\n❌ FAILED TESTS ({len(failed_tests)}):")
            for test in failed_tests:
                print(f"  • {test['test']}: {test['details']}")
        
        return self.test_results

if __name__ == "__main__":
    tester = KetoBackendTester()
    results = tester.run_comprehensive_test()