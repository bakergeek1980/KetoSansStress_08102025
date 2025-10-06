#!/usr/bin/env python3
"""
Backend Testing Suite for KetoSansStress Email Confirmation System
Tests the complete integrated email confirmation workflow
"""

import requests
import json
import time
import os
from datetime import datetime
from typing import Dict, Any, Optional

# Configuration
BACKEND_URL = "https://ketometrics.preview.emergentagent.com/api"
TEST_EMAIL = "test.confirmation@ketosansstress.com"
TEST_PASSWORD = "TestConfirm123!"

class EmailConfirmationTester:
    def __init__(self):
        self.session = requests.Session()
        self.test_results = []
        self.test_user_id = None
        self.access_token = None
        
    def log_test_result(self, test_name: str, success: bool, details: str = ""):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        logger.info(f"{status}: {test_name}")
        if details:
            logger.info(f"   Details: {details}")
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details
        })
    
    def make_request(self, method: str, endpoint: str, data: Dict = None, headers: Dict = None) -> requests.Response:
        """Make HTTP request with proper error handling"""
        url = f"{self.base_url}{endpoint}"
        
        # Add authorization header if token exists
        if self.access_token and headers is None:
            headers = {"Authorization": f"Bearer {self.access_token}"}
        elif self.access_token and headers:
            headers["Authorization"] = f"Bearer {self.access_token}"
        
        try:
            if method.upper() == "GET":
                response = self.session.get(url, headers=headers)
            elif method.upper() == "POST":
                response = self.session.post(url, json=data, headers=headers)
            elif method.upper() == "PATCH":
                response = self.session.patch(url, json=data, headers=headers)
            elif method.upper() == "DELETE":
                response = self.session.delete(url, headers=headers)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
            
            logger.info(f"{method.upper()} {url} -> {response.status_code}")
            return response
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Request failed: {e}")
            raise
    
    def setup_test_user(self) -> bool:
        """Register and authenticate test user"""
        logger.info("=== SETTING UP TEST USER ===")
        
        # Try to register test user
        registration_data = {
            "email": self.test_user_email,
            "password": self.test_user_password,
            "full_name": "Marie Testeur",
            "age": 25,
            "gender": "female",
            "height": 165.0,
            "weight": 60.0,
            "activity_level": "moderately_active",
            "goal": "weight_loss",
            "timezone": "Europe/Paris"
        }
        
        try:
            # Try registration
            response = self.make_request("POST", "/auth/register", registration_data, headers={})
            
            if response.status_code == 201:
                self.log_test_result("User Registration", True, "New test user registered successfully")
            elif response.status_code == 409:
                self.log_test_result("User Registration", True, "Test user already exists (expected)")
            else:
                self.log_test_result("User Registration", False, f"Unexpected status: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test_result("User Registration", False, f"Registration error: {str(e)}")
            # Continue anyway, user might already exist
        
        # Login to get access token
        login_data = {
            "email": self.test_user_email,
            "password": self.test_user_password
        }
        
        try:
            response = self.make_request("POST", "/auth/login", login_data, headers={})
            
            if response.status_code == 200:
                data = response.json()
                self.access_token = data.get("access_token")
                if self.access_token:
                    self.log_test_result("User Login", True, "Authentication successful")
                    return True
                else:
                    self.log_test_result("User Login", False, "No access token in response")
                    return False
            else:
                self.log_test_result("User Login", False, f"Login failed: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test_result("User Login", False, f"Login error: {str(e)}")
            return False
    
    def test_profile_update(self):
        """Test PATCH /api/auth/profile endpoint"""
        logger.info("=== TESTING PROFILE UPDATE ===")
        
        # Test 1: Valid profile update with all fields
        update_data = {
            "full_name": "Marie Testeur Updated",
            "age": 26,
            "gender": "female",
            "height": 170.0,
            "weight": 65.0,
            "activity_level": "very_active",
            "goal": "maintenance"
        }
        
        try:
            response = self.make_request("PATCH", "/auth/profile", update_data)
            
            if response.status_code == 200:
                data = response.json()
                if "message" in data and "user" in data:
                    self.log_test_result("Profile Update - Valid Data", True, "Profile updated successfully")
                else:
                    self.log_test_result("Profile Update - Valid Data", False, "Invalid response format")
            else:
                self.log_test_result("Profile Update - Valid Data", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_test_result("Profile Update - Valid Data", False, f"Error: {str(e)}")
        
        # Test 2: Invalid age (below minimum)
        invalid_age_data = {
            "full_name": "Marie Test",
            "age": 10,  # Below minimum of 13
            "gender": "female",
            "height": 165.0,
            "weight": 60.0
        }
        
        try:
            response = self.make_request("PATCH", "/auth/profile", invalid_age_data)
            
            if response.status_code == 422:
                self.log_test_result("Profile Update - Invalid Age", True, "Age validation working correctly")
            else:
                self.log_test_result("Profile Update - Invalid Age", False, f"Expected 422, got {response.status_code}")
                
        except Exception as e:
            self.log_test_result("Profile Update - Invalid Age", False, f"Error: {str(e)}")
        
        # Test 3: Invalid gender
        invalid_gender_data = {
            "full_name": "Marie Test",
            "age": 25,
            "gender": "invalid_gender",
            "height": 165.0,
            "weight": 60.0
        }
        
        try:
            response = self.make_request("PATCH", "/auth/profile", invalid_gender_data)
            
            if response.status_code == 422:
                self.log_test_result("Profile Update - Invalid Gender", True, "Gender validation working correctly")
            else:
                self.log_test_result("Profile Update - Invalid Gender", False, f"Expected 422, got {response.status_code}")
                
        except Exception as e:
            self.log_test_result("Profile Update - Invalid Gender", False, f"Error: {str(e)}")
        
        # Test 4: Missing required fields
        incomplete_data = {
            "age": 25
            # Missing required fields
        }
        
        try:
            response = self.make_request("PATCH", "/auth/profile", incomplete_data)
            
            if response.status_code == 422:
                self.log_test_result("Profile Update - Missing Fields", True, "Required field validation working")
            else:
                self.log_test_result("Profile Update - Missing Fields", False, f"Expected 422, got {response.status_code}")
                
        except Exception as e:
            self.log_test_result("Profile Update - Missing Fields", False, f"Error: {str(e)}")
        
        # Test 5: Unauthorized access (no token)
        try:
            response = self.make_request("PATCH", "/auth/profile", update_data, headers={})
            
            if response.status_code == 401:
                self.log_test_result("Profile Update - No Auth", True, "Authentication required correctly")
            else:
                self.log_test_result("Profile Update - No Auth", False, f"Expected 401, got {response.status_code}")
                
        except Exception as e:
            self.log_test_result("Profile Update - No Auth", False, f"Error: {str(e)}")
    
    def test_password_change(self):
        """Test PATCH /api/auth/change-password endpoint"""
        logger.info("=== TESTING PASSWORD CHANGE ===")
        
        # Test 1: Valid password change
        password_data = {
            "current_password": self.test_user_password,
            "new_password": "NewTestPass123!"
        }
        
        try:
            response = self.make_request("PATCH", "/auth/change-password", password_data)
            
            if response.status_code == 200:
                data = response.json()
                if "message" in data:
                    self.log_test_result("Password Change - Valid", True, "Password changed successfully")
                    # Update password for future tests
                    self.test_user_password = "NewTestPass123!"
                else:
                    self.log_test_result("Password Change - Valid", False, "Invalid response format")
            else:
                self.log_test_result("Password Change - Valid", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_test_result("Password Change - Valid", False, f"Error: {str(e)}")
        
        # Test 2: Incorrect current password
        wrong_password_data = {
            "current_password": "WrongPassword123!",
            "new_password": "AnotherNewPass123!"
        }
        
        try:
            response = self.make_request("PATCH", "/auth/change-password", wrong_password_data)
            
            if response.status_code == 400:
                self.log_test_result("Password Change - Wrong Current", True, "Current password verification working")
            else:
                self.log_test_result("Password Change - Wrong Current", False, f"Expected 400, got {response.status_code}")
                
        except Exception as e:
            self.log_test_result("Password Change - Wrong Current", False, f"Error: {str(e)}")
        
        # Test 3: Weak new password
        weak_password_data = {
            "current_password": self.test_user_password,
            "new_password": "weak"
        }
        
        try:
            response = self.make_request("PATCH", "/auth/change-password", weak_password_data)
            
            if response.status_code == 422:
                self.log_test_result("Password Change - Weak Password", True, "Password strength validation working")
            else:
                self.log_test_result("Password Change - Weak Password", False, f"Expected 422, got {response.status_code}")
                
        except Exception as e:
            self.log_test_result("Password Change - Weak Password", False, f"Error: {str(e)}")
        
        # Test 4: Unauthorized access
        try:
            response = self.make_request("PATCH", "/auth/change-password", password_data, headers={})
            
            if response.status_code == 401:
                self.log_test_result("Password Change - No Auth", True, "Authentication required correctly")
            else:
                self.log_test_result("Password Change - No Auth", False, f"Expected 401, got {response.status_code}")
                
        except Exception as e:
            self.log_test_result("Password Change - No Auth", False, f"Error: {str(e)}")
    
    def test_forgot_password(self):
        """Test POST /api/auth/password-reset endpoint"""
        logger.info("=== TESTING FORGOT PASSWORD ===")
        
        # Test 1: Valid email address
        reset_data = {
            "email": self.test_user_email
        }
        
        try:
            response = self.make_request("POST", "/auth/password-reset", reset_data, headers={})
            
            if response.status_code == 200:
                data = response.json()
                if "message" in data:
                    self.log_test_result("Forgot Password - Valid Email", True, "Password reset email sent")
                else:
                    self.log_test_result("Forgot Password - Valid Email", False, "Invalid response format")
            else:
                self.log_test_result("Forgot Password - Valid Email", False, f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_test_result("Forgot Password - Valid Email", False, f"Error: {str(e)}")
        
        # Test 2: Non-existent email (should still return success for security)
        nonexistent_data = {
            "email": "nonexistent@example.com"
        }
        
        try:
            response = self.make_request("POST", "/auth/password-reset", nonexistent_data, headers={})
            
            if response.status_code == 200:
                self.log_test_result("Forgot Password - Nonexistent Email", True, "Security behavior correct (no info leakage)")
            else:
                self.log_test_result("Forgot Password - Nonexistent Email", False, f"Expected 200, got {response.status_code}")
                
        except Exception as e:
            self.log_test_result("Forgot Password - Nonexistent Email", False, f"Error: {str(e)}")
        
        # Test 3: Invalid email format
        invalid_email_data = {
            "email": "invalid-email-format"
        }
        
        try:
            response = self.make_request("POST", "/auth/password-reset", invalid_email_data, headers={})
            
            if response.status_code == 422:
                self.log_test_result("Forgot Password - Invalid Email Format", True, "Email validation working")
            else:
                self.log_test_result("Forgot Password - Invalid Email Format", False, f"Expected 422, got {response.status_code}")
                
        except Exception as e:
            self.log_test_result("Forgot Password - Invalid Email Format", False, f"Error: {str(e)}")
    
    def test_account_deletion(self):
        """Test DELETE /api/auth/account endpoint"""
        logger.info("=== TESTING ACCOUNT DELETION ===")
        
        # Test 1: Unauthorized access (no token)
        try:
            response = self.make_request("DELETE", "/auth/account", headers={})
            
            if response.status_code == 401:
                self.log_test_result("Account Deletion - No Auth", True, "Authentication required correctly")
            else:
                self.log_test_result("Account Deletion - No Auth", False, f"Expected 401, got {response.status_code}")
                
        except Exception as e:
            self.log_test_result("Account Deletion - No Auth", False, f"Error: {str(e)}")
        
        # Test 2: Valid account deletion (this should be last test)
        try:
            response = self.make_request("DELETE", "/auth/account")
            
            if response.status_code == 200:
                data = response.json()
                if "message" in data:
                    self.log_test_result("Account Deletion - Valid", True, "Account deleted successfully")
                    # Clear token since account is deleted
                    self.access_token = None
                else:
                    self.log_test_result("Account Deletion - Valid", False, "Invalid response format")
            else:
                self.log_test_result("Account Deletion - Valid", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_test_result("Account Deletion - Valid", False, f"Error: {str(e)}")
        
        # Test 3: Verify account is actually deleted (try to login)
        login_data = {
            "email": self.test_user_email,
            "password": self.test_user_password
        }
        
        try:
            response = self.make_request("POST", "/auth/login", login_data, headers={})
            
            if response.status_code == 401:
                self.log_test_result("Account Deletion - Verification", True, "Account properly deleted (login fails)")
            else:
                self.log_test_result("Account Deletion - Verification", False, f"Account still exists, login status: {response.status_code}")
                
        except Exception as e:
            self.log_test_result("Account Deletion - Verification", False, f"Error: {str(e)}")
    
    def run_all_tests(self):
        """Run all user profile management tests"""
        logger.info("🧪 STARTING USER PROFILE MANAGEMENT BACKEND TESTING")
        logger.info(f"Testing against: {self.base_url}")
        
        # Setup test user
        if not self.setup_test_user():
            logger.error("❌ Failed to setup test user. Aborting tests.")
            return
        
        # Run all tests
        self.test_profile_update()
        self.test_password_change()
        self.test_forgot_password()
        self.test_account_deletion()  # This should be last as it deletes the user
        
        # Print summary
        self.print_test_summary()
    
    def print_test_summary(self):
        """Print test results summary"""
        logger.info("\n" + "="*60)
        logger.info("🧪 USER PROFILE MANAGEMENT TESTING SUMMARY")
        logger.info("="*60)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        logger.info(f"Total Tests: {total_tests}")
        logger.info(f"Passed: {passed_tests} ✅")
        logger.info(f"Failed: {failed_tests} ❌")
        logger.info(f"Success Rate: {success_rate:.1f}%")
        
        if failed_tests > 0:
            logger.info("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    logger.info(f"  - {result['test']}: {result['details']}")
        
        logger.info("\n✅ PASSED TESTS:")
        for result in self.test_results:
            if result["success"]:
                logger.info(f"  - {result['test']}")
        
        logger.info("="*60)

if __name__ == "__main__":
    tester = KetoSansStressAPITester()
    tester.run_all_tests()