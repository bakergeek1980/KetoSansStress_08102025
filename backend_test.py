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

class AuthenticationTester:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        self.test_results = []
        self.access_token = None
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
        print(f"{status}: {test_name}")
        if details:
            print(f"   Details: {details}")
        if not success and response_data:
            print(f"   Response: {response_data}")
        print()

    def test_health_check(self):
        """Test health check endpoint"""
        try:
            response = self.session.get(f"{BASE_URL}/health")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "healthy":
                    self.log_test("Health Check", True, f"Service healthy, Supabase: {data.get('supabase', 'unknown')}")
                else:
                    self.log_test("Health Check", False, f"Service unhealthy: {data}")
            else:
                self.log_test("Health Check", False, f"HTTP {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Health Check", False, f"Exception: {str(e)}")

    def test_registration_with_valid_data(self):
        """Test registration with complete valid user data"""
        try:
            # Generate unique email for this test
            unique_email = f"test.{uuid.uuid4().hex[:8]}@ketosansstress.com"
            
            registration_data = {
                "email": unique_email,
                "password": TEST_PASSWORD,
                "full_name": "Test User",
                "age": 30,
                "gender": "female",
                "height": 165.0,
                "weight": 65.5,
                "activity_level": "moderately_active",
                "goal": "weight_loss",
                "timezone": "UTC"
            }
            
            response = self.session.post(f"{BASE_URL}/auth/register", json=registration_data)
            
            if response.status_code == 201:
                data = response.json()
                if data.get("user_id") and data.get("email") == unique_email:
                    self.log_test("Registration with Valid Data", True, 
                                f"User created successfully: {data.get('user_id')}")
                    # Store for later login test
                    self.test_email = unique_email
                else:
                    self.log_test("Registration with Valid Data", False, 
                                "Missing user_id or email mismatch", data)
            else:
                self.log_test("Registration with Valid Data", False, 
                            f"HTTP {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Registration with Valid Data", False, f"Exception: {str(e)}")

    def test_registration_duplicate_email(self):
        """Test registration with duplicate email (409 conflict)"""
        try:
            # First registration
            registration_data = {
                "email": DUPLICATE_TEST_EMAIL,
                "password": TEST_PASSWORD,
                "full_name": "First User",
                "age": 25,
                "gender": "male",
                "height": 180.0,
                "weight": 75.0,
                "activity_level": "lightly_active",
                "goal": "maintenance",
                "timezone": "UTC"
            }
            
            # First attempt
            response1 = self.session.post(f"{BASE_URL}/auth/register", json=registration_data)
            
            # Second attempt with same email
            registration_data["full_name"] = "Second User"
            response2 = self.session.post(f"{BASE_URL}/auth/register", json=registration_data)
            
            if response2.status_code == 409:
                self.log_test("Duplicate Email Protection", True, 
                            "Correctly returned 409 Conflict for duplicate email")
            elif response2.status_code == 400 and "already" in response2.text.lower():
                self.log_test("Duplicate Email Protection", True, 
                            "Correctly rejected duplicate email with 400 status")
            else:
                self.log_test("Duplicate Email Protection", False, 
                            f"Expected 409 Conflict, got HTTP {response2.status_code}", response2.text)
                
        except Exception as e:
            self.log_test("Duplicate Email Protection", False, f"Exception: {str(e)}")

    def test_registration_invalid_email(self):
        """Test registration with invalid email format"""
        try:
            registration_data = {
                "email": "invalid-email-format",
                "password": TEST_PASSWORD,
                "full_name": "Test User",
                "age": 30,
                "gender": "female",
                "height": 165.0,
                "weight": 65.5,
                "activity_level": "moderately_active",
                "goal": "weight_loss",
                "timezone": "UTC"
            }
            
            response = self.session.post(f"{BASE_URL}/auth/register", json=registration_data)
            
            if response.status_code == 422:  # Pydantic validation error
                self.log_test("Invalid Email Format Validation", True, 
                            "Correctly rejected invalid email format")
            elif response.status_code == 400:
                self.log_test("Invalid Email Format Validation", True, 
                            "Correctly rejected invalid email format with 400")
            else:
                self.log_test("Invalid Email Format Validation", False, 
                            f"Expected 422 or 400, got HTTP {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Invalid Email Format Validation", False, f"Exception: {str(e)}")

    def test_registration_weak_password(self):
        """Test registration with weak password"""
        try:
            registration_data = {
                "email": f"weak.password.{uuid.uuid4().hex[:8]}@ketosansstress.com",
                "password": "123",  # Weak password
                "full_name": "Test User",
                "age": 30,
                "gender": "female",
                "height": 165.0,
                "weight": 65.5,
                "activity_level": "moderately_active",
                "goal": "weight_loss",
                "timezone": "UTC"
            }
            
            response = self.session.post(f"{BASE_URL}/auth/register", json=registration_data)
            
            if response.status_code in [400, 422]:
                self.log_test("Weak Password Validation", True, 
                            "Correctly rejected weak password")
            else:
                self.log_test("Weak Password Validation", False, 
                            f"Expected 400/422 for weak password, got HTTP {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Weak Password Validation", False, f"Exception: {str(e)}")

    def test_registration_missing_fields(self):
        """Test registration with missing required fields"""
        try:
            # Missing full_name
            incomplete_data = {
                "email": f"incomplete.{uuid.uuid4().hex[:8]}@ketosansstress.com",
                "password": TEST_PASSWORD,
                "age": 30,
                "gender": "female",
                "height": 165.0,
                "weight": 65.5,
                "activity_level": "moderately_active",
                "goal": "weight_loss"
                # Missing full_name
            }
            
            response = self.session.post(f"{BASE_URL}/auth/register", json=incomplete_data)
            
            if response.status_code in [400, 422]:
                self.log_test("Missing Required Fields Validation", True, 
                            "Correctly rejected registration with missing full_name")
            else:
                self.log_test("Missing Required Fields Validation", False, 
                            f"Expected 400/422 for missing fields, got HTTP {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Missing Required Fields Validation", False, f"Exception: {str(e)}")

    def test_field_validations(self):
        """Test individual field validations"""
        try:
            base_data = {
                "email": f"validation.{uuid.uuid4().hex[:8]}@ketosansstress.com",
                "password": TEST_PASSWORD,
                "full_name": "Test User",
                "age": 30,
                "gender": "female",
                "height": 165.0,
                "weight": 65.5,
                "activity_level": "moderately_active",
                "goal": "weight_loss",
                "timezone": "UTC"
            }
            
            # Test invalid age
            invalid_age_data = base_data.copy()
            invalid_age_data["age"] = -5
            invalid_age_data["email"] = f"age.{uuid.uuid4().hex[:8]}@ketosansstress.com"
            
            response = self.session.post(f"{BASE_URL}/auth/register", json=invalid_age_data)
            age_validation_pass = response.status_code in [400, 422]
            
            # Test invalid height
            invalid_height_data = base_data.copy()
            invalid_height_data["height"] = -10.0
            invalid_height_data["email"] = f"height.{uuid.uuid4().hex[:8]}@ketosansstress.com"
            
            response = self.session.post(f"{BASE_URL}/auth/register", json=invalid_height_data)
            height_validation_pass = response.status_code in [400, 422]
            
            # Test invalid weight
            invalid_weight_data = base_data.copy()
            invalid_weight_data["weight"] = 0.0
            invalid_weight_data["email"] = f"weight.{uuid.uuid4().hex[:8]}@ketosansstress.com"
            
            response = self.session.post(f"{BASE_URL}/auth/register", json=invalid_weight_data)
            weight_validation_pass = response.status_code in [400, 422]
            
            # Test invalid gender
            invalid_gender_data = base_data.copy()
            invalid_gender_data["gender"] = "invalid_gender"
            invalid_gender_data["email"] = f"gender.{uuid.uuid4().hex[:8]}@ketosansstress.com"
            
            response = self.session.post(f"{BASE_URL}/auth/register", json=invalid_gender_data)
            gender_validation_pass = response.status_code in [400, 422]
            
            all_validations_pass = all([age_validation_pass, height_validation_pass, 
                                      weight_validation_pass, gender_validation_pass])
            
            if all_validations_pass:
                self.log_test("Field Validations", True, 
                            "All field validations working correctly (age, height, weight, gender)")
            else:
                failed_validations = []
                if not age_validation_pass: failed_validations.append("age")
                if not height_validation_pass: failed_validations.append("height")
                if not weight_validation_pass: failed_validations.append("weight")
                if not gender_validation_pass: failed_validations.append("gender")
                
                self.log_test("Field Validations", False, 
                            f"Failed validations: {', '.join(failed_validations)}")
                
        except Exception as e:
            self.log_test("Field Validations", False, f"Exception: {str(e)}")

    def test_login_with_valid_credentials(self):
        """Test login with valid credentials"""
        try:
            # Use the email from successful registration
            if not hasattr(self, 'test_email'):
                # Create a user first
                unique_email = f"login.{uuid.uuid4().hex[:8]}@ketosansstress.com"
                registration_data = {
                    "email": unique_email,
                    "password": TEST_PASSWORD,
                    "full_name": "Login Test User",
                    "age": 28,
                    "gender": "male",
                    "height": 175.0,
                    "weight": 70.0,
                    "activity_level": "moderately_active",
                    "goal": "maintenance",
                    "timezone": "UTC"
                }
                
                reg_response = self.session.post(f"{BASE_URL}/auth/register", json=registration_data)
                if reg_response.status_code != 201:
                    self.log_test("Login with Valid Credentials", False, 
                                "Failed to create test user for login", reg_response.text)
                    return
                
                self.test_email = unique_email
            
            # Now test login
            login_data = {
                "email": self.test_email,
                "password": TEST_PASSWORD
            }
            
            response = self.session.post(f"{BASE_URL}/auth/login", json=login_data)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("access_token") and data.get("user"):
                    self.access_token = data["access_token"]
                    self.user_id = data["user"]["id"]
                    self.log_test("Login with Valid Credentials", True, 
                                f"Login successful, token received for user: {self.user_id}")
                else:
                    self.log_test("Login with Valid Credentials", False, 
                                "Missing access_token or user in response", data)
            else:
                self.log_test("Login with Valid Credentials", False, 
                            f"HTTP {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Login with Valid Credentials", False, f"Exception: {str(e)}")

    def test_login_with_invalid_credentials(self):
        """Test login with invalid credentials"""
        try:
            login_data = {
                "email": "nonexistent@ketosansstress.com",
                "password": "wrongpassword"
            }
            
            response = self.session.post(f"{BASE_URL}/auth/login", json=login_data)
            
            if response.status_code == 401:
                self.log_test("Login with Invalid Credentials", True, 
                            "Correctly rejected invalid credentials with 401")
            else:
                self.log_test("Login with Invalid Credentials", False, 
                            f"Expected 401 Unauthorized, got HTTP {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Login with Invalid Credentials", False, f"Exception: {str(e)}")

    def test_jwt_token_validation(self):
        """Test JWT token validation with /me endpoint"""
        try:
            if not self.access_token:
                self.log_test("JWT Token Validation", False, 
                            "No access token available from previous login test")
                return
            
            headers = {
                "Authorization": f"Bearer {self.access_token}",
                "Content-Type": "application/json"
            }
            
            response = self.session.get(f"{BASE_URL}/auth/me", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("id") and data.get("email"):
                    self.log_test("JWT Token Validation", True, 
                                f"Token validation successful, user data retrieved: {data.get('email')}")
                else:
                    self.log_test("JWT Token Validation", False, 
                                "Missing user data in /me response", data)
            else:
                self.log_test("JWT Token Validation", False, 
                            f"HTTP {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("JWT Token Validation", False, f"Exception: {str(e)}")

    def test_protected_endpoint_without_token(self):
        """Test protected endpoint without authentication token"""
        try:
            response = self.session.get(f"{BASE_URL}/auth/me")
            
            if response.status_code == 401:
                self.log_test("Protected Endpoint Without Token", True, 
                            "Correctly rejected request without token (401)")
            else:
                self.log_test("Protected Endpoint Without Token", False, 
                            f"Expected 401 Unauthorized, got HTTP {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Protected Endpoint Without Token", False, f"Exception: {str(e)}")

    def test_protected_endpoint_with_invalid_token(self):
        """Test protected endpoint with invalid token"""
        try:
            headers = {
                "Authorization": "Bearer invalid.jwt.token",
                "Content-Type": "application/json"
            }
            
            response = self.session.get(f"{BASE_URL}/auth/me", headers=headers)
            
            if response.status_code == 401:
                self.log_test("Protected Endpoint with Invalid Token", True, 
                            "Correctly rejected invalid token (401)")
            else:
                self.log_test("Protected Endpoint with Invalid Token", False, 
                            f"Expected 401 Unauthorized, got HTTP {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Protected Endpoint with Invalid Token", False, f"Exception: {str(e)}")

    def test_user_profile_creation_in_database(self):
        """Test that user profile is properly created in users table"""
        try:
            if not self.access_token:
                self.log_test("User Profile Creation in Database", False, 
                            "No access token available to test profile creation")
                return
            
            headers = {
                "Authorization": f"Bearer {self.access_token}",
                "Content-Type": "application/json"
            }
            
            response = self.session.get(f"{BASE_URL}/auth/me", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["id", "email", "full_name", "age", "gender", "height", "weight"]
                missing_fields = [field for field in required_fields if not data.get(field)]
                
                if not missing_fields:
                    self.log_test("User Profile Creation in Database", True, 
                                f"User profile complete with all required fields: {data.get('email')}")
                else:
                    self.log_test("User Profile Creation in Database", False, 
                                f"Missing profile fields: {missing_fields}", data)
            else:
                self.log_test("User Profile Creation in Database", False, 
                            f"Failed to retrieve user profile: HTTP {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("User Profile Creation in Database", False, f"Exception: {str(e)}")

    def run_all_tests(self):
        """Run all authentication tests"""
        print("🧪 STARTING COMPREHENSIVE AUTHENTICATION SYSTEM TESTING")
        print("=" * 70)
        print()
        
        # Basic connectivity
        self.test_health_check()
        
        # Registration tests
        print("📝 REGISTRATION TESTS")
        print("-" * 30)
        self.test_registration_with_valid_data()
        self.test_registration_duplicate_email()
        self.test_registration_invalid_email()
        self.test_registration_weak_password()
        self.test_registration_missing_fields()
        self.test_field_validations()
        
        # Login tests
        print("🔐 LOGIN TESTS")
        print("-" * 30)
        self.test_login_with_valid_credentials()
        self.test_login_with_invalid_credentials()
        
        # JWT and security tests
        print("🛡️ JWT & SECURITY TESTS")
        print("-" * 30)
        self.test_jwt_token_validation()
        self.test_protected_endpoint_without_token()
        self.test_protected_endpoint_with_invalid_token()
        
        # Database integration tests
        print("💾 DATABASE INTEGRATION TESTS")
        print("-" * 30)
        self.test_user_profile_creation_in_database()
        
        # Summary
        self.print_summary()

    def print_summary(self):
        """Print test summary"""
        print()
        print("=" * 70)
        print("🎯 TEST SUMMARY")
        print("=" * 70)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests} ✅")
        print(f"Failed: {failed_tests} ❌")
        print(f"Success Rate: {success_rate:.1f}%")
        print()
        
        if failed_tests > 0:
            print("❌ FAILED TESTS:")
            print("-" * 30)
            for result in self.test_results:
                if not result["success"]:
                    print(f"• {result['test']}: {result['details']}")
            print()
        
        print("✅ PASSED TESTS:")
        print("-" * 30)
        for result in self.test_results:
            if result["success"]:
                print(f"• {result['test']}")
        
        print()
        print("=" * 70)
        
        return {
            "total": total_tests,
            "passed": passed_tests,
            "failed": failed_tests,
            "success_rate": success_rate,
            "results": self.test_results
        }

if __name__ == "__main__":
    tester = AuthenticationTester()
    summary = tester.run_all_tests()
    
    # Save results to file
    with open("/app/auth_test_results.json", "w") as f:
        json.dump(summary, f, indent=2, default=str)
    
    print(f"📊 Detailed results saved to: /app/auth_test_results.json")