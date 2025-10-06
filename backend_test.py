#!/usr/bin/env python3
"""
KetoSansStress Backend Testing Suite - Email Confirmation System
Comprehensive testing of the new email validation workflow
"""

import requests
import json
import time
import uuid
from datetime import datetime
from typing import Dict, Any, Optional

# Configuration
BASE_URL = "https://ketotrackerapp-1.preview.emergentagent.com/api"
TEST_EMAIL = "test.confirm@ketosansstress.com"
TEST_PASSWORD = "SecureTest123!"
TEST_USER_DATA = {
    "email": TEST_EMAIL,
    "password": TEST_PASSWORD,
    "full_name": "Test Confirmation User",
    "age": 28,
    "gender": "female",
    "height": 165.0,
    "weight": 60.0,
    "activity_level": "moderately_active",
    "goal": "weight_loss",
    "timezone": "Europe/Paris"
}

class EmailConfirmationTester:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        self.test_results = []
        self.access_token = None
        self.user_id = None
        
    def log_test(self, test_name: str, success: bool, details: str, response_data: Any = None):
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
        print(f"   Details: {details}")
        if response_data and not success:
            print(f"   Response: {json.dumps(response_data, indent=2)}")
        print()

    def test_health_check(self):
        """Test basic health check"""
        try:
            response = self.session.get(f"{API_BASE}/health")
            if response.status_code == 200:
                data = response.json()
                self.log_test(
                    "Health Check", 
                    True, 
                    f"Service: {data.get('service', 'Unknown')}, Supabase: {data.get('supabase', 'Unknown')}"
                )
                return True
            else:
                self.log_test("Health Check", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Health Check", False, f"Error: {str(e)}")
            return False

    def test_enhanced_password_validation(self):
        """Test enhanced password validation requirements"""
        print("🔐 TESTING ENHANCED PASSWORD VALIDATION")
        
        base_user_data = {
            "email": "test.password@keto.com",
            "full_name": "Test Utilisateur",
            "age": 28,
            "gender": "male",
            "height": 180.0,
            "weight": 75.5,
            "activity_level": "moderately_active",
            "goal": "weight_loss",
            "timezone": "Europe/Paris"
        }
        
        # Test cases for password validation
        password_tests = [
            {
                "name": "Valid Strong Password",
                "password": "SecurePass123!",
                "should_pass": True,
                "description": "8+ chars, uppercase, lowercase, digit, special char"
            },
            {
                "name": "Too Short Password",
                "password": "Short1!",
                "should_pass": False,
                "description": "Only 7 characters (minimum 8 required)"
            },
            {
                "name": "Missing Uppercase",
                "password": "lowercase123!",
                "should_pass": False,
                "description": "No uppercase letter"
            },
            {
                "name": "Missing Lowercase",
                "password": "UPPERCASE123!",
                "should_pass": False,
                "description": "No lowercase letter"
            },
            {
                "name": "Missing Digit",
                "password": "NoDigitPass!",
                "should_pass": False,
                "description": "No digit present"
            },
            {
                "name": "Missing Special Character",
                "password": "Password123",
                "should_pass": False,
                "description": "No special character"
            },
            {
                "name": "Weak Password Example",
                "password": "weakpass",
                "should_pass": False,
                "description": "Fails multiple requirements"
            },
            {
                "name": "Another Valid Password",
                "password": "MyKeto2024@",
                "should_pass": True,
                "description": "Meets all requirements"
            }
        ]
        
        for test_case in password_tests:
            user_data = base_user_data.copy()
            user_data["password"] = test_case["password"]
            user_data["email"] = f"pwd.test.{len(self.test_results)}@keto.com"
            
            try:
                response = self.session.post(f"{API_BASE}/auth/register", json=user_data)
                
                if test_case["should_pass"]:
                    # Should succeed
                    if response.status_code == 201:
                        self.log_test(
                            f"Password Validation: {test_case['name']}", 
                            True, 
                            f"{test_case['description']} - Registration successful"
                        )
                    else:
                        self.log_test(
                            f"Password Validation: {test_case['name']}", 
                            False, 
                            f"Expected success but got {response.status_code}: {response.text}",
                            response.json() if response.headers.get('content-type', '').startswith('application/json') else {}
                        )
                else:
                    # Should fail
                    if response.status_code in [400, 422]:
                        error_data = response.json() if response.headers.get('content-type', '').startswith('application/json') else {}
                        self.log_test(
                            f"Password Validation: {test_case['name']}", 
                            True, 
                            f"{test_case['description']} - Correctly rejected with {response.status_code}"
                        )
                    else:
                        self.log_test(
                            f"Password Validation: {test_case['name']}", 
                            False, 
                            f"Expected rejection but got {response.status_code}",
                            response.json() if response.headers.get('content-type', '').startswith('application/json') else {}
                        )
                        
            except Exception as e:
                self.log_test(
                    f"Password Validation: {test_case['name']}", 
                    False, 
                    f"Error: {str(e)}"
                )

    def test_complete_registration_form_validation(self):
        """Test complete registration form validation"""
        print("📋 TESTING COMPLETE REGISTRATION FORM VALIDATION")
        
        # Test email format validation
        email_tests = [
            {"email": "valid@example.com", "should_pass": True},
            {"email": "invalid-email", "should_pass": False},
            {"email": "missing@", "should_pass": False},
            {"email": "@missing.com", "should_pass": False},
            {"email": "", "should_pass": False}
        ]
        
        base_data = {
            "password": "ValidPass123!",
            "full_name": "Test User",
            "age": 25,
            "gender": "female",
            "height": 165.0,
            "weight": 60.0,
            "activity_level": "lightly_active",
            "goal": "maintenance",
            "timezone": "Europe/Paris"
        }
        
        for email_test in email_tests:
            user_data = base_data.copy()
            user_data["email"] = email_test["email"]
            
            try:
                response = self.session.post(f"{API_BASE}/auth/register", json=user_data)
                
                if email_test["should_pass"]:
                    success = response.status_code == 201
                    self.log_test(
                        f"Email Validation: {email_test['email']}", 
                        success, 
                        f"Valid email format - Status: {response.status_code}"
                    )
                else:
                    success = response.status_code in [400, 422]
                    self.log_test(
                        f"Email Validation: {email_test['email']}", 
                        success, 
                        f"Invalid email format correctly rejected - Status: {response.status_code}"
                    )
                    
            except Exception as e:
                self.log_test(f"Email Validation: {email_test['email']}", False, f"Error: {str(e)}")

        # Test required fields validation
        required_fields_tests = [
            {"field": "full_name", "value": None},
            {"field": "full_name", "value": ""},
            {"field": "age", "value": None},
            {"field": "gender", "value": None},
            {"field": "height", "value": None},
            {"field": "weight", "value": None}
        ]
        
        for field_test in required_fields_tests:
            user_data = {
                "email": f"required.test.{len(self.test_results)}@keto.com",
                "password": "ValidPass123!",
                "full_name": "Test User",
                "age": 25,
                "gender": "male",
                "height": 175.0,
                "weight": 70.0,
                "activity_level": "moderately_active",
                "goal": "weight_loss",
                "timezone": "Europe/Paris"
            }
            
            # Remove or set invalid value for the field being tested
            if field_test["value"] is None:
                del user_data[field_test["field"]]
            else:
                user_data[field_test["field"]] = field_test["value"]
            
            try:
                response = self.session.post(f"{API_BASE}/auth/register", json=user_data)
                success = response.status_code in [400, 422]
                self.log_test(
                    f"Required Field: {field_test['field']}", 
                    success, 
                    f"Missing/invalid {field_test['field']} correctly rejected - Status: {response.status_code}"
                )
            except Exception as e:
                self.log_test(f"Required Field: {field_test['field']}", False, f"Error: {str(e)}")

        # Test field constraints
        constraint_tests = [
            {"field": "age", "value": 12, "description": "Age below minimum (13)"},
            {"field": "age", "value": 121, "description": "Age above maximum (120)"},
            {"field": "height", "value": 99, "description": "Height below minimum (100cm)"},
            {"field": "height", "value": 251, "description": "Height above maximum (250cm)"},
            {"field": "weight", "value": 29, "description": "Weight below minimum (30kg)"},
            {"field": "weight", "value": 301, "description": "Weight above maximum (300kg)"},
            {"field": "gender", "value": "invalid", "description": "Invalid gender value"}
        ]
        
        for constraint_test in constraint_tests:
            user_data = {
                "email": f"constraint.test.{len(self.test_results)}@keto.com",
                "password": "ValidPass123!",
                "full_name": "Test User",
                "age": 25,
                "gender": "other",
                "height": 170.0,
                "weight": 65.0,
                "activity_level": "moderately_active",
                "goal": "weight_loss",
                "timezone": "Europe/Paris"
            }
            
            user_data[constraint_test["field"]] = constraint_test["value"]
            
            try:
                response = self.session.post(f"{API_BASE}/auth/register", json=user_data)
                success = response.status_code in [400, 422]
                self.log_test(
                    f"Field Constraint: {constraint_test['description']}", 
                    success, 
                    f"Invalid {constraint_test['field']} correctly rejected - Status: {response.status_code}"
                )
            except Exception as e:
                self.log_test(f"Field Constraint: {constraint_test['description']}", False, f"Error: {str(e)}")

    def test_secure_registration_process(self):
        """Test secure registration process"""
        print("🔒 TESTING SECURE REGISTRATION PROCESS")
        
        # Test successful registration with all fields
        valid_user_data = {
            "email": "test.secure@keto.com",
            "password": "SecurePass123!",
            "full_name": "Test Utilisateur",
            "age": 28,
            "gender": "male",
            "height": 180.0,
            "weight": 75.5,
            "activity_level": "moderately_active",
            "goal": "weight_loss",
            "timezone": "Europe/Paris"
        }
        
        try:
            response = self.session.post(f"{API_BASE}/auth/register", json=valid_user_data)
            
            if response.status_code == 201:
                data = response.json()
                self.log_test(
                    "Complete Valid Registration", 
                    True, 
                    f"User registered successfully with ID: {data.get('user_id', 'Unknown')}"
                )
                
                # Test duplicate email rejection
                duplicate_response = self.session.post(f"{API_BASE}/auth/register", json=valid_user_data)
                if duplicate_response.status_code == 409:
                    self.log_test(
                        "Duplicate Email Rejection", 
                        True, 
                        "Duplicate email correctly rejected with 409 Conflict"
                    )
                else:
                    self.log_test(
                        "Duplicate Email Rejection", 
                        False, 
                        f"Expected 409 Conflict but got {duplicate_response.status_code}"
                    )
                
                # Test login with registered user
                login_data = {
                    "email": valid_user_data["email"],
                    "password": valid_user_data["password"]
                }
                
                login_response = self.session.post(f"{API_BASE}/auth/login", json=login_data)
                if login_response.status_code == 200:
                    login_data = login_response.json()
                    if "access_token" in login_data:
                        self.log_test(
                            "Auto-login After Registration", 
                            True, 
                            "User can login successfully after registration"
                        )
                        
                        # Test JWT token validation
                        headers = {"Authorization": f"Bearer {login_data['access_token']}"}
                        me_response = self.session.get(f"{API_BASE}/auth/me", headers=headers)
                        if me_response.status_code == 200:
                            self.log_test(
                                "JWT Token Validation", 
                                True, 
                                "JWT token validates correctly for protected endpoints"
                            )
                        else:
                            self.log_test(
                                "JWT Token Validation", 
                                False, 
                                f"JWT validation failed with status {me_response.status_code}"
                            )
                    else:
                        self.log_test(
                            "Auto-login After Registration", 
                            False, 
                            "Login successful but no access token returned"
                        )
                else:
                    self.log_test(
                        "Auto-login After Registration", 
                        False, 
                        f"Login failed with status {login_response.status_code}"
                    )
                    
            else:
                self.log_test(
                    "Complete Valid Registration", 
                    False, 
                    f"Registration failed with status {response.status_code}: {response.text}"
                )
                
        except Exception as e:
            self.log_test("Complete Valid Registration", False, f"Error: {str(e)}")

    def test_error_handling_and_messages(self):
        """Test error handling and validation messages"""
        print("⚠️ TESTING ERROR HANDLING & VALIDATION MESSAGES")
        
        # Test various error scenarios
        error_tests = [
            {
                "name": "Invalid JSON",
                "data": "invalid json",
                "expected_status": [400, 422],
                "content_type": "text/plain"
            },
            {
                "name": "Empty Request Body",
                "data": {},
                "expected_status": [400, 422],
                "content_type": "application/json"
            },
            {
                "name": "Partial Data",
                "data": {"email": "partial@test.com"},
                "expected_status": [400, 422],
                "content_type": "application/json"
            }
        ]
        
        for error_test in error_tests:
            try:
                if error_test["content_type"] == "application/json":
                    response = self.session.post(f"{API_BASE}/auth/register", json=error_test["data"])
                else:
                    response = self.session.post(
                        f"{API_BASE}/auth/register", 
                        data=error_test["data"],
                        headers={"Content-Type": "text/plain"}
                    )
                
                success = response.status_code in error_test["expected_status"]
                self.log_test(
                    f"Error Handling: {error_test['name']}", 
                    success, 
                    f"Status: {response.status_code}, Expected: {error_test['expected_status']}"
                )
                
            except Exception as e:
                self.log_test(f"Error Handling: {error_test['name']}", False, f"Error: {str(e)}")

    def test_specific_test_cases(self):
        """Test specific cases mentioned in the review request"""
        print("🎯 TESTING SPECIFIC TEST CASES")
        
        # Test case 1: Valid registration
        valid_case = {
            "email": "test.secure@keto.com",
            "password": "SecurePass123!",
            "full_name": "Test Utilisateur",
            "age": 28,
            "gender": "male",
            "height": 180.0,
            "weight": 75.5,
            "activity_level": "moderately_active",
            "goal": "weight_loss",
            "timezone": "Europe/Paris"
        }
        
        try:
            # First, try to register (might already exist from previous tests)
            response = self.session.post(f"{API_BASE}/auth/register", json=valid_case)
            if response.status_code in [201, 409]:  # Success or already exists
                self.log_test(
                    "Specific Test: Valid Registration", 
                    True, 
                    f"Valid registration handled correctly - Status: {response.status_code}"
                )
            else:
                self.log_test(
                    "Specific Test: Valid Registration", 
                    False, 
                    f"Unexpected status: {response.status_code}"
                )
        except Exception as e:
            self.log_test("Specific Test: Valid Registration", False, f"Error: {str(e)}")
        
        # Test case 2: Weak password
        weak_password_case = valid_case.copy()
        weak_password_case["email"] = "weak.password@keto.com"
        weak_password_case["password"] = "weakpass"
        
        try:
            response = self.session.post(f"{API_BASE}/auth/register", json=weak_password_case)
            success = response.status_code in [400, 422]
            self.log_test(
                "Specific Test: Weak Password 'weakpass'", 
                success, 
                f"Weak password correctly rejected - Status: {response.status_code}"
            )
        except Exception as e:
            self.log_test("Specific Test: Weak Password 'weakpass'", False, f"Error: {str(e)}")
        
        # Test case 3: Missing special character
        missing_special_case = valid_case.copy()
        missing_special_case["email"] = "missing.special@keto.com"
        missing_special_case["password"] = "Password123"
        
        try:
            response = self.session.post(f"{API_BASE}/auth/register", json=missing_special_case)
            success = response.status_code in [400, 422]
            self.log_test(
                "Specific Test: Missing Special Char 'Password123'", 
                success, 
                f"Password without special char correctly rejected - Status: {response.status_code}"
            )
        except Exception as e:
            self.log_test("Specific Test: Missing Special Char 'Password123'", False, f"Error: {str(e)}")
        
        # Test case 4: Invalid email format
        invalid_email_case = valid_case.copy()
        invalid_email_case["email"] = "invalid-email-format"
        
        try:
            response = self.session.post(f"{API_BASE}/auth/register", json=invalid_email_case)
            success = response.status_code in [400, 422]
            self.log_test(
                "Specific Test: Invalid Email Format", 
                success, 
                f"Invalid email format correctly rejected - Status: {response.status_code}"
            )
        except Exception as e:
            self.log_test("Specific Test: Invalid Email Format", False, f"Error: {str(e)}")

    def run_all_tests(self):
        """Run all tests"""
        print(f"🚀 STARTING COMPREHENSIVE KETO REGISTRATION TESTING")
        print(f"Backend URL: {BACKEND_URL}")
        print(f"API Base: {API_BASE}")
        print("=" * 80)
        
        # Run all test suites
        if not self.test_health_check():
            print("❌ Health check failed. Stopping tests.")
            return
            
        self.test_enhanced_password_validation()
        self.test_complete_registration_form_validation()
        self.test_secure_registration_process()
        self.test_error_handling_and_messages()
        self.test_specific_test_cases()
        
        # Summary
        print("=" * 80)
        print("📊 TEST SUMMARY")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'])
        failed_tests = total_tests - passed_tests
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests} ✅")
        print(f"Failed: {failed_tests} ❌")
        print(f"Success Rate: {success_rate:.1f}%")
        
        if failed_tests > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  - {result['test']}: {result['details']}")
        
        print("\n🎯 ENHANCED SECURITY VALIDATION SUMMARY:")
        password_tests = [r for r in self.test_results if 'Password Validation' in r['test']]
        password_passed = sum(1 for r in password_tests if r['success'])
        print(f"  Password Validation: {password_passed}/{len(password_tests)} tests passed")
        
        form_tests = [r for r in self.test_results if any(x in r['test'] for x in ['Email Validation', 'Required Field', 'Field Constraint'])]
        form_passed = sum(1 for r in form_tests if r['success'])
        print(f"  Form Validation: {form_passed}/{len(form_tests)} tests passed")
        
        security_tests = [r for r in self.test_results if any(x in r['test'] for x in ['Registration', 'Duplicate', 'JWT'])]
        security_passed = sum(1 for r in security_tests if r['success'])
        print(f"  Security Features: {security_passed}/{len(security_tests)} tests passed")
        
        return success_rate >= 90  # Consider successful if 90%+ tests pass

if __name__ == "__main__":
    tester = KetoRegistrationTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)