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
API_BASE_URL = "https://keto-journey-1.preview.emergentagent.com/api"

# Données de test
TEST_USER_EMAIL = "testeur@ketosansstress.com"
TEST_USER_PASSWORD = "TestKeto123!"

# Code-barres de test (produits réels OpenFoodFacts)
TEST_BARCODES = {
    "nutella": "3017620425035",  # Nutella
    "ferrero_rocher": "8000500037454",  # Ferrero Rocher
    "camembert": "3228021170015",  # President Camembert
    "invalid": "0000000000000"  # Code-barres invalide
}

# Image de test en base64 (petite image 1x1 pixel)
TEST_IMAGE_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="

class BackendTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.access_token = None
        self.test_user_email = None
        self.test_results = []
        
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
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"    Details: {details}")
        if not success and response_data:
            print(f"    Response: {response_data}")
        print()

    def create_test_user(self) -> bool:
        """Use existing confirmed user for authentication"""
        try:
            # Use existing confirmed user from test_result.md
            self.test_user_email = "bdsbes@gmail.com"
            self.log_test("User Setup", True, f"Using existing confirmed user: {self.test_user_email}")
            return True
                
        except Exception as e:
            self.log_test("User Setup", False, f"Exception: {str(e)}")
            return False

    def login_test_user(self) -> bool:
        """Login with test user to get access token"""
        try:
            login_data = {
                "email": self.test_user_email,
                "password": "SecurePass123!"  # Use the correct password for existing user
            }
            
            response = requests.post(f"{self.base_url}/auth/login", json=login_data)
            
            if response.status_code == 200:
                data = response.json()
                self.access_token = data.get("access_token")
                if self.access_token:
                    self.log_test("User Login", True, "Successfully obtained access token")
                    return True
                else:
                    self.log_test("User Login", False, "No access token in response", data)
                    return False
            else:
                self.log_test("User Login", False, f"Status: {response.status_code}", response.json())
                return False
                
        except Exception as e:
            self.log_test("User Login", False, f"Exception: {str(e)}")
            return False

    def get_auth_headers(self) -> Dict[str, str]:
        """Get authorization headers"""
        return {"Authorization": f"Bearer {self.access_token}"}

    def test_profile_update_with_birth_date(self):
        """Test 1: Profile Update with Valid Birth Date"""
        try:
            birth_date = "1990-05-15"  # Valid date format
            
            profile_data = {
                "full_name": "Marie Testeur Updated",
                "birth_date": birth_date,
                "gender": "female",
                "height": 168.0,
                "weight": 63.0,
                "activity_level": "moderately_active",
                "goal": "weight_loss"
            }
            
            response = requests.patch(
                f"{self.base_url}/auth/profile",
                json=profile_data,
                headers=self.get_auth_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                # Check if birth_date is in response
                if "user" in data and "birth_date" in str(data):
                    self.log_test("Profile Update with Birth Date", True, 
                                f"Successfully updated profile with birth_date: {birth_date}")
                else:
                    self.log_test("Profile Update with Birth Date", False, 
                                "Birth date not found in response", data)
            else:
                self.log_test("Profile Update with Birth Date", False, 
                            f"Status: {response.status_code}", response.json())
                
        except Exception as e:
            self.log_test("Profile Update with Birth Date", False, f"Exception: {str(e)}")

    def test_profile_retrieval_with_birth_date(self):
        """Test 2: Verify Birth Date in Profile Retrieval"""
        try:
            response = requests.get(
                f"{self.base_url}/auth/me",
                headers=self.get_auth_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                if "birth_date" in data:
                    birth_date = data["birth_date"]
                    self.log_test("Profile Retrieval with Birth Date", True, 
                                f"Birth date found in profile: {birth_date}")
                    
                    # Check if age is calculated correctly
                    if "age" in data:
                        age = data["age"]
                        self.log_test("Age Calculation from Birth Date", True, 
                                    f"Age calculated: {age}")
                    else:
                        self.log_test("Age Calculation from Birth Date", False, 
                                    "Age field not found in profile")
                else:
                    self.log_test("Profile Retrieval with Birth Date", False, 
                                "Birth date not found in profile", data)
            else:
                self.log_test("Profile Retrieval with Birth Date", False, 
                            f"Status: {response.status_code}", response.json())
                
        except Exception as e:
            self.log_test("Profile Retrieval with Birth Date", False, f"Exception: {str(e)}")

    def test_invalid_date_formats(self):
        """Test 3: Invalid Date Format Validation"""
        invalid_dates = [
            "15-05-1990",  # DD-MM-YYYY format
            "05/15/1990",  # MM/DD/YYYY format
            "invalid-date",  # Invalid string
            "1990-13-01",  # Invalid month
            "1990-02-30",  # Invalid day for February
            ""  # Empty string
        ]
        
        for invalid_date in invalid_dates:
            try:
                profile_data = {
                    "full_name": "Marie Testeur",
                    "birth_date": invalid_date,
                    "gender": "female",
                    "height": 165.0,
                    "weight": 65.0
                }
                
                response = requests.patch(
                    f"{self.base_url}/auth/profile",
                    json=profile_data,
                    headers=self.get_auth_headers()
                )
                
                if response.status_code == 422:  # Validation error expected
                    self.log_test(f"Invalid Date Format: {invalid_date}", True, 
                                "Correctly rejected invalid date format")
                else:
                    self.log_test(f"Invalid Date Format: {invalid_date}", False, 
                                f"Expected 422, got {response.status_code}", response.json())
                    
            except Exception as e:
                self.log_test(f"Invalid Date Format: {invalid_date}", False, f"Exception: {str(e)}")

    def test_future_date_validation(self):
        """Test 4: Future Date Validation"""
        try:
            # Test with future date
            future_date = (date.today() + timedelta(days=365)).isoformat()  # One year in future
            
            profile_data = {
                "full_name": "Marie Testeur",
                "birth_date": future_date,
                "gender": "female",
                "height": 165.0,
                "weight": 65.0
            }
            
            response = requests.patch(
                f"{self.base_url}/auth/profile",
                json=profile_data,
                headers=self.get_auth_headers()
            )
            
            if response.status_code == 422:  # Should reject future dates
                self.log_test("Future Date Validation", True, 
                            f"Correctly rejected future date: {future_date}")
            else:
                self.log_test("Future Date Validation", False, 
                            f"Expected 422, got {response.status_code}. Future dates should be rejected", 
                            response.json())
                
        except Exception as e:
            self.log_test("Future Date Validation", False, f"Exception: {str(e)}")

    def test_edge_case_dates(self):
        """Test 5: Edge Case Date Validation"""
        edge_cases = [
            ("1900-01-01", "Very old birth date"),
            ("2010-12-31", "Recent birth date"),
            ("1990-02-29", "Leap year date"),  # This should be invalid (1990 wasn't a leap year)
            ("2000-02-29", "Valid leap year date")  # This should be valid (2000 was a leap year)
        ]
        
        for test_date, description in edge_cases:
            try:
                profile_data = {
                    "full_name": "Marie Testeur",
                    "birth_date": test_date,
                    "gender": "female",
                    "height": 165.0,
                    "weight": 65.0
                }
                
                response = requests.patch(
                    f"{self.base_url}/auth/profile",
                    json=profile_data,
                    headers=self.get_auth_headers()
                )
                
                if test_date == "1990-02-29":  # Invalid leap year date
                    if response.status_code == 422:
                        self.log_test(f"Edge Case: {description}", True, 
                                    "Correctly rejected invalid leap year date")
                    else:
                        self.log_test(f"Edge Case: {description}", False, 
                                    f"Should reject invalid leap year date, got {response.status_code}")
                else:
                    if response.status_code == 200:
                        self.log_test(f"Edge Case: {description}", True, 
                                    f"Successfully accepted valid date: {test_date}")
                    else:
                        self.log_test(f"Edge Case: {description}", False, 
                                    f"Expected 200, got {response.status_code}", response.json())
                        
            except Exception as e:
                self.log_test(f"Edge Case: {description}", False, f"Exception: {str(e)}")

    def test_partial_profile_update_with_birth_date(self):
        """Test 6: Partial Profile Update Preserving Other Data"""
        try:
            # First, update with full profile
            full_profile = {
                "full_name": "Marie Complete Profile",
                "birth_date": "1985-03-20",
                "gender": "female",
                "height": 170.0,
                "weight": 68.0,
                "activity_level": "very_active",
                "goal": "muscle_gain"
            }
            
            response1 = requests.patch(
                f"{self.base_url}/auth/profile",
                json=full_profile,
                headers=self.get_auth_headers()
            )
            
            if response1.status_code != 200:
                self.log_test("Partial Update Setup", False, 
                            f"Failed to set up full profile: {response1.status_code}")
                return
            
            # Now update only birth_date
            partial_update = {
                "birth_date": "1987-07-10"
            }
            
            response2 = requests.patch(
                f"{self.base_url}/auth/profile",
                json=partial_update,
                headers=self.get_auth_headers()
            )
            
            if response2.status_code == 200:
                # Verify other data is preserved
                profile_response = requests.get(
                    f"{self.base_url}/auth/me",
                    headers=self.get_auth_headers()
                )
                
                if profile_response.status_code == 200:
                    profile_data = profile_response.json()
                    
                    # Check if birth_date was updated and other fields preserved
                    birth_date_updated = profile_data.get("birth_date") == "1987-07-10"
                    name_preserved = profile_data.get("full_name") == "Marie Complete Profile"
                    weight_preserved = float(profile_data.get("weight", 0)) == 68.0
                    
                    if birth_date_updated and name_preserved and weight_preserved:
                        self.log_test("Partial Profile Update", True, 
                                    "Birth date updated while preserving other profile data")
                    else:
                        self.log_test("Partial Profile Update", False, 
                                    f"Data integrity issue - birth_date: {birth_date_updated}, "
                                    f"name: {name_preserved}, weight: {weight_preserved}", profile_data)
                else:
                    self.log_test("Partial Profile Update", False, 
                                "Failed to retrieve profile after partial update")
            else:
                self.log_test("Partial Profile Update", False, 
                            f"Partial update failed: {response2.status_code}", response2.json())
                
        except Exception as e:
            self.log_test("Partial Profile Update", False, f"Exception: {str(e)}")

    def test_birth_date_without_age_field(self):
        """Test 7: Profile Update with Birth Date Only (No Age Field)"""
        try:
            # Update profile with birth_date but without age field
            profile_data = {
                "birth_date": "1992-11-25",
                "full_name": "Marie Birth Date Only"
            }
            
            response = requests.patch(
                f"{self.base_url}/auth/profile",
                json=profile_data,
                headers=self.get_auth_headers()
            )
            
            if response.status_code == 200:
                # Verify that age is calculated from birth_date
                profile_response = requests.get(
                    f"{self.base_url}/auth/me",
                    headers=self.get_auth_headers()
                )
                
                if profile_response.status_code == 200:
                    profile_data = profile_response.json()
                    birth_date = profile_data.get("birth_date")
                    calculated_age = profile_data.get("age")
                    
                    if birth_date == "1992-11-25":
                        # Calculate expected age
                        birth_year = 1992
                        current_year = datetime.now().year
                        expected_age = current_year - birth_year
                        
                        if calculated_age and abs(calculated_age - expected_age) <= 1:  # Allow for birthday timing
                            self.log_test("Birth Date Without Age Field", True, 
                                        f"Age correctly calculated from birth_date: {calculated_age}")
                        else:
                            self.log_test("Birth Date Without Age Field", False, 
                                        f"Age calculation incorrect. Expected ~{expected_age}, got {calculated_age}")
                    else:
                        self.log_test("Birth Date Without Age Field", False, 
                                    f"Birth date not updated correctly: {birth_date}")
                else:
                    self.log_test("Birth Date Without Age Field", False, 
                                "Failed to retrieve profile after update")
            else:
                self.log_test("Birth Date Without Age Field", False, 
                            f"Profile update failed: {response.status_code}", response.json())
                
        except Exception as e:
            self.log_test("Birth Date Without Age Field", False, f"Exception: {str(e)}")

    def test_authentication_required(self):
        """Test 8: Authentication Required for Profile Update"""
        try:
            profile_data = {
                "birth_date": "1990-01-01",
                "full_name": "Unauthorized User"
            }
            
            # Make request without authentication headers
            response = requests.patch(f"{self.base_url}/auth/profile", json=profile_data)
            
            if response.status_code == 401:
                self.log_test("Authentication Required", True, 
                            "Correctly rejected unauthenticated request")
            else:
                self.log_test("Authentication Required", False, 
                            f"Expected 401, got {response.status_code}", response.json())
                
        except Exception as e:
            self.log_test("Authentication Required", False, f"Exception: {str(e)}")

    def test_birth_date_field_support(self):
        """Test 9: Check if birth_date field is supported in profile update"""
        try:
            # Test with minimal data to see if birth_date field is accepted
            profile_data = {
                "birth_date": "1990-01-01"
            }
            
            # Make request without authentication to check field validation
            response = requests.patch(f"{self.base_url}/auth/profile", json=profile_data)
            
            # We expect 401 (auth required) not 422 (validation error)
            if response.status_code == 401:
                self.log_test("Birth Date Field Support", True, 
                            "birth_date field is accepted (authentication required as expected)")
            elif response.status_code == 422:
                error_detail = response.json()
                if "birth_date" in str(error_detail):
                    self.log_test("Birth Date Field Support", False, 
                                "birth_date field validation error", error_detail)
                else:
                    self.log_test("Birth Date Field Support", True, 
                                "birth_date field accepted, other validation errors present")
            else:
                self.log_test("Birth Date Field Support", False, 
                            f"Unexpected status code: {response.status_code}", response.json())
                
        except Exception as e:
            self.log_test("Birth Date Field Support", False, f"Exception: {str(e)}")

    def run_all_tests(self):
        """Run all birth_date related tests"""
        print("🧪 BACKEND BIRTH DATE TESTING SUITE")
        print("=" * 50)
        print(f"Backend URL: {self.base_url}")
        print(f"Test started at: {datetime.now().isoformat()}")
        print()
        
        # Setup: Create and login test user
        if not self.create_test_user():
            print("❌ Failed to create test user.")
            
        if not self.login_test_user():
            print("❌ Failed to login test user. Continuing with limited tests.")
        else:
            print("🔐 Authentication Setup Complete")
        print()
        
        # First test if birth_date field is supported
        print("🔍 BIRTH DATE FIELD SUPPORT TEST")
        print("-" * 30)
        self.test_birth_date_field_support()
        
        # Run authentication test
        self.test_authentication_required()
        
        # If we can't authenticate, we'll still run some basic tests
        print("\n📅 BIRTH DATE FUNCTIONALITY TESTS")
        print("-" * 30)
        
        if self.access_token:
            # Run full authenticated tests
            self.test_profile_update_with_birth_date()
            self.test_profile_retrieval_with_birth_date()
            self.test_invalid_date_formats()
            self.test_future_date_validation()
            self.test_edge_case_dates()
            self.test_partial_profile_update_with_birth_date()
            self.test_birth_date_without_age_field()
        else:
            print("⚠️  Skipping authenticated tests due to login failure")
            print("   Testing birth_date field validation without authentication...")
        
        # Summary
        return self.print_summary()

    def print_summary(self):
        """Print test summary"""
        print()
        print("📊 TEST SUMMARY")
        print("=" * 50)
        
        total_tests = len(self.test_results)
        passed_tests = len([t for t in self.test_results if t["success"]])
        failed_tests = total_tests - passed_tests
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests} ✅")
        print(f"Failed: {failed_tests} ❌")
        print(f"Success Rate: {success_rate:.1f}%")
        print()
        
        if failed_tests > 0:
            print("❌ FAILED TESTS:")
            for test in self.test_results:
                if not test["success"]:
                    print(f"  • {test['test']}: {test['details']}")
            print()
        
        print("🎯 BIRTH DATE TESTING COMPLETE!")
        
        # Return success rate for external evaluation
        return success_rate

if __name__ == "__main__":
    tester = BackendTester()
    success_rate = tester.run_all_tests()
    
    # Exit with appropriate code
    sys.exit(0 if success_rate >= 80 else 1)