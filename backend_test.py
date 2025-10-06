#!/usr/bin/env python3
"""
Backend API Testing for KetoSansStress User Profile Management System
Tests the newly implemented user profile management endpoints
"""

import requests
import json
import time
from typing import Dict, Any, Optional
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class KetoSansStressAPITester:
    def __init__(self):
        # Use the production URL from frontend .env
        self.base_url = "https://ketometrics.preview.emergentagent.com/api"
        self.session = requests.Session()
        self.access_token = None
        self.test_user_email = "test.profile@ketosansstress.com"
        self.test_user_password = "TestPass123!"
        self.test_results = []
        
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

    def test_health_check(self):
        """Test basic health check"""
        try:
            response = self.session.get(f"{BASE_URL}/health")
            if response.status_code == 200:
                data = response.json()
                self.log_test(
                    "Health Check",
                    True,
                    f"Service healthy: {data.get('service', 'Unknown')}, Supabase: {data.get('supabase', 'Unknown')}"
                )
                return True
            else:
                self.log_test("Health Check", False, f"HTTP {response.status_code}", response.json())
                return False
        except Exception as e:
            self.log_test("Health Check", False, f"Exception: {str(e)}")
            return False

    def test_registration_with_email_confirmation(self):
        """Test registration with email confirmation enabled"""
        try:
            # Test with confirm_email=true
            response = self.session.post(
                f"{BASE_URL}/auth/register?confirm_email=true",
                json=TEST_USER_DATA
            )
            
            if response.status_code == 201:
                data = response.json()
                needs_confirmation = data.get('needs_email_confirmation', False)
                
                if needs_confirmation:
                    self.log_test(
                        "Registration with Email Confirmation",
                        True,
                        f"Registration successful, needs email confirmation: {needs_confirmation}",
                        data
                    )
                    self.user_id = data.get('user_id')
                    return True
                else:
                    self.log_test(
                        "Registration with Email Confirmation",
                        False,
                        "Registration successful but needs_email_confirmation is False",
                        data
                    )
                    return False
            else:
                self.log_test(
                    "Registration with Email Confirmation",
                    False,
                    f"HTTP {response.status_code}",
                    response.json()
                )
                return False
                
        except Exception as e:
            self.log_test("Registration with Email Confirmation", False, f"Exception: {str(e)}")
            return False

    def test_registration_without_email_confirmation(self):
        """Test registration without email confirmation"""
        try:
            # Use different email for this test
            test_data = TEST_USER_DATA.copy()
            test_data["email"] = f"no.confirm.{uuid.uuid4().hex[:8]}@ketosansstress.com"
            
            response = self.session.post(
                f"{BASE_URL}/auth/register?confirm_email=false",
                json=test_data
            )
            
            if response.status_code == 201:
                data = response.json()
                needs_confirmation = data.get('needs_email_confirmation', True)
                
                if not needs_confirmation:
                    self.log_test(
                        "Registration without Email Confirmation",
                        True,
                        f"Registration successful, no email confirmation needed: {needs_confirmation}",
                        data
                    )
                    return True
                else:
                    self.log_test(
                        "Registration without Email Confirmation",
                        False,
                        "Registration successful but needs_email_confirmation is True",
                        data
                    )
                    return False
            else:
                self.log_test(
                    "Registration without Email Confirmation",
                    False,
                    f"HTTP {response.status_code}",
                    response.json()
                )
                return False
                
        except Exception as e:
            self.log_test("Registration without Email Confirmation", False, f"Exception: {str(e)}")
            return False

    def test_login_before_email_confirmation(self):
        """Test that unconfirmed users cannot login"""
        try:
            login_data = {
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD
            }
            
            response = self.session.post(f"{BASE_URL}/auth/login", json=login_data)
            
            if response.status_code == 401:
                self.log_test(
                    "Login Before Email Confirmation",
                    True,
                    "Login correctly rejected for unconfirmed email",
                    response.json()
                )
                return True
            elif response.status_code == 200:
                # This might be acceptable if email confirmation is disabled
                data = response.json()
                user_data = data.get('user', {})
                email_confirmed = user_data.get('email_confirmed_at')
                
                if not email_confirmed:
                    self.log_test(
                        "Login Before Email Confirmation",
                        False,
                        "Login allowed for unconfirmed email - security issue",
                        data
                    )
                    return False
                else:
                    self.log_test(
                        "Login Before Email Confirmation",
                        True,
                        "Login successful - email was auto-confirmed",
                        data
                    )
                    self.access_token = data.get('access_token')
                    return True
            else:
                self.log_test(
                    "Login Before Email Confirmation",
                    False,
                    f"Unexpected HTTP {response.status_code}",
                    response.json()
                )
                return False
                
        except Exception as e:
            self.log_test("Login Before Email Confirmation", False, f"Exception: {str(e)}")
            return False

    def test_email_confirmation_with_mock_token(self):
        """Test email confirmation with mock token"""
        try:
            # Test with invalid token first
            invalid_token_data = {"token": "invalid_mock_token_12345"}
            
            response = self.session.post(
                f"{BASE_URL}/auth/confirm-email",
                json=invalid_token_data
            )
            
            if response.status_code == 400:
                self.log_test(
                    "Email Confirmation - Invalid Token",
                    True,
                    "Invalid token correctly rejected",
                    response.json()
                )
            else:
                self.log_test(
                    "Email Confirmation - Invalid Token",
                    False,
                    f"Invalid token not rejected properly: HTTP {response.status_code}",
                    response.json()
                )
                
            # Test with mock valid token (this will likely fail in real scenario)
            valid_token_data = {"token": "mock_valid_confirmation_token"}
            
            response = self.session.post(
                f"{BASE_URL}/auth/confirm-email",
                json=valid_token_data
            )
            
            if response.status_code == 400:
                self.log_test(
                    "Email Confirmation - Mock Valid Token",
                    True,
                    "Mock token correctly rejected (expected behavior)",
                    response.json()
                )
                return True
            elif response.status_code == 200:
                self.log_test(
                    "Email Confirmation - Mock Valid Token",
                    True,
                    "Mock token accepted (test environment behavior)",
                    response.json()
                )
                return True
            else:
                self.log_test(
                    "Email Confirmation - Mock Valid Token",
                    False,
                    f"Unexpected HTTP {response.status_code}",
                    response.json()
                )
                return False
                
        except Exception as e:
            self.log_test("Email Confirmation with Mock Token", False, f"Exception: {str(e)}")
            return False

    def test_resend_confirmation_email(self):
        """Test resend confirmation email functionality"""
        try:
            # Test with existing email
            resend_data = {"email": TEST_EMAIL}
            
            response = self.session.post(
                f"{BASE_URL}/auth/resend-confirmation",
                json=resend_data
            )
            
            if response.status_code == 200:
                data = response.json()
                message = data.get('message', '')
                
                # Should return success regardless of email existence for security
                if 'sent if account exists' in message.lower() or 'sent' in message.lower():
                    self.log_test(
                        "Resend Confirmation Email - Existing Email",
                        True,
                        f"Resend request handled correctly: {message}",
                        data
                    )
                else:
                    self.log_test(
                        "Resend Confirmation Email - Existing Email",
                        False,
                        f"Unexpected message: {message}",
                        data
                    )
            else:
                self.log_test(
                    "Resend Confirmation Email - Existing Email",
                    False,
                    f"HTTP {response.status_code}",
                    response.json()
                )
                
            # Test with non-existing email (should still return success for security)
            nonexistent_data = {"email": f"nonexistent.{uuid.uuid4().hex[:8]}@ketosansstress.com"}
            
            response = self.session.post(
                f"{BASE_URL}/auth/resend-confirmation",
                json=nonexistent_data
            )
            
            if response.status_code == 200:
                data = response.json()
                message = data.get('message', '')
                
                if 'sent if account exists' in message.lower() or 'sent' in message.lower():
                    self.log_test(
                        "Resend Confirmation Email - Non-existing Email",
                        True,
                        f"Security maintained - no information leak: {message}",
                        data
                    )
                    return True
                else:
                    self.log_test(
                        "Resend Confirmation Email - Non-existing Email",
                        False,
                        f"Potential information leak: {message}",
                        data
                    )
                    return False
            else:
                self.log_test(
                    "Resend Confirmation Email - Non-existing Email",
                    False,
                    f"HTTP {response.status_code}",
                    response.json()
                )
                return False
                
        except Exception as e:
            self.log_test("Resend Confirmation Email", False, f"Exception: {str(e)}")
            return False

    def test_user_profile_creation_after_confirmation(self):
        """Test that user profile is created after email confirmation"""
        try:
            # First, try to create a user without email confirmation
            test_data = TEST_USER_DATA.copy()
            test_data["email"] = f"profile.test.{uuid.uuid4().hex[:8]}@ketosansstress.com"
            
            response = self.session.post(
                f"{BASE_URL}/auth/register?confirm_email=false",
                json=test_data
            )
            
            if response.status_code == 201:
                data = response.json()
                user_id = data.get('user_id')
                
                # Try to login to get access token
                login_response = self.session.post(
                    f"{BASE_URL}/auth/login",
                    json={"email": test_data["email"], "password": test_data["password"]}
                )
                
                if login_response.status_code == 200:
                    login_data = login_response.json()
                    access_token = login_data.get('access_token')
                    
                    # Test protected endpoint to verify profile exists
                    headers = {"Authorization": f"Bearer {access_token}"}
                    me_response = self.session.get(f"{BASE_URL}/auth/me", headers=headers)
                    
                    if me_response.status_code == 200:
                        profile_data = me_response.json()
                        self.log_test(
                            "User Profile Creation After Registration",
                            True,
                            f"User profile accessible: {profile_data.get('full_name', 'Unknown')}",
                            profile_data
                        )
                        return True
                    else:
                        self.log_test(
                            "User Profile Creation After Registration",
                            False,
                            f"Profile not accessible: HTTP {me_response.status_code}",
                            me_response.json()
                        )
                        return False
                else:
                    self.log_test(
                        "User Profile Creation After Registration",
                        False,
                        f"Login failed: HTTP {login_response.status_code}",
                        login_response.json()
                    )
                    return False
            else:
                self.log_test(
                    "User Profile Creation After Registration",
                    False,
                    f"Registration failed: HTTP {response.status_code}",
                    response.json()
                )
                return False
                
        except Exception as e:
            self.log_test("User Profile Creation After Registration", False, f"Exception: {str(e)}")
            return False

    def test_jwt_token_generation_and_validation(self):
        """Test JWT token generation and validation"""
        try:
            # Create a new user for this test
            test_data = TEST_USER_DATA.copy()
            test_data["email"] = f"jwt.test.{uuid.uuid4().hex[:8]}@ketosansstress.com"
            
            # Register user
            register_response = self.session.post(
                f"{BASE_URL}/auth/register?confirm_email=false",
                json=test_data
            )
            
            if register_response.status_code != 201:
                self.log_test(
                    "JWT Token Generation and Validation",
                    False,
                    f"Registration failed: HTTP {register_response.status_code}",
                    register_response.json()
                )
                return False
            
            # Login to get JWT token
            login_response = self.session.post(
                f"{BASE_URL}/auth/login",
                json={"email": test_data["email"], "password": test_data["password"]}
            )
            
            if login_response.status_code == 200:
                login_data = login_response.json()
                access_token = login_data.get('access_token')
                refresh_token = login_data.get('refresh_token')
                expires_in = login_data.get('expires_in')
                
                if access_token and refresh_token:
                    self.log_test(
                        "JWT Token Generation",
                        True,
                        f"Tokens generated successfully, expires in: {expires_in}s"
                    )
                    
                    # Test token validation with protected endpoint
                    headers = {"Authorization": f"Bearer {access_token}"}
                    me_response = self.session.get(f"{BASE_URL}/auth/me", headers=headers)
                    
                    if me_response.status_code == 200:
                        user_data = me_response.json()
                        self.log_test(
                            "JWT Token Validation",
                            True,
                            f"Token validation successful for user: {user_data.get('email')}",
                            user_data
                        )
                        
                        # Test invalid token
                        invalid_headers = {"Authorization": "Bearer invalid_token_12345"}
                        invalid_response = self.session.get(f"{BASE_URL}/auth/me", headers=invalid_headers)
                        
                        if invalid_response.status_code == 401:
                            self.log_test(
                                "JWT Token Validation - Invalid Token",
                                True,
                                "Invalid token correctly rejected"
                            )
                            return True
                        else:
                            self.log_test(
                                "JWT Token Validation - Invalid Token",
                                False,
                                f"Invalid token not rejected: HTTP {invalid_response.status_code}",
                                invalid_response.json()
                            )
                            return False
                    else:
                        self.log_test(
                            "JWT Token Validation",
                            False,
                            f"Token validation failed: HTTP {me_response.status_code}",
                            me_response.json()
                        )
                        return False
                else:
                    self.log_test(
                        "JWT Token Generation",
                        False,
                        "Tokens not generated properly",
                        login_data
                    )
                    return False
            else:
                self.log_test(
                    "JWT Token Generation and Validation",
                    False,
                    f"Login failed: HTTP {login_response.status_code}",
                    login_response.json()
                )
                return False
                
        except Exception as e:
            self.log_test("JWT Token Generation and Validation", False, f"Exception: {str(e)}")
            return False

    def test_protected_endpoints_access(self):
        """Test access to protected endpoints with and without authentication"""
        try:
            # Test without authentication
            no_auth_response = self.session.get(f"{BASE_URL}/auth/me")
            
            if no_auth_response.status_code == 401:
                self.log_test(
                    "Protected Endpoint - No Auth",
                    True,
                    "Correctly rejected request without authentication"
                )
            else:
                self.log_test(
                    "Protected Endpoint - No Auth",
                    False,
                    f"Should reject unauthenticated request: HTTP {no_auth_response.status_code}",
                    no_auth_response.json()
                )
                
            # Create authenticated user for testing
            test_data = TEST_USER_DATA.copy()
            test_data["email"] = f"protected.test.{uuid.uuid4().hex[:8]}@ketosansstress.com"
            
            # Register and login
            self.session.post(f"{BASE_URL}/auth/register?confirm_email=false", json=test_data)
            login_response = self.session.post(
                f"{BASE_URL}/auth/login",
                json={"email": test_data["email"], "password": test_data["password"]}
            )
            
            if login_response.status_code == 200:
                access_token = login_response.json().get('access_token')
                headers = {"Authorization": f"Bearer {access_token}"}
                
                # Test authenticated access
                auth_response = self.session.get(f"{BASE_URL}/auth/me", headers=headers)
                
                if auth_response.status_code == 200:
                    self.log_test(
                        "Protected Endpoint - With Auth",
                        True,
                        "Correctly allowed authenticated request",
                        auth_response.json()
                    )
                    return True
                else:
                    self.log_test(
                        "Protected Endpoint - With Auth",
                        False,
                        f"Should allow authenticated request: HTTP {auth_response.status_code}",
                        auth_response.json()
                    )
                    return False
            else:
                self.log_test(
                    "Protected Endpoints Access",
                    False,
                    f"Login failed for test: HTTP {login_response.status_code}",
                    login_response.json()
                )
                return False
                
        except Exception as e:
            self.log_test("Protected Endpoints Access", False, f"Exception: {str(e)}")
            return False

    def run_all_tests(self):
        """Run all email confirmation system tests"""
        print("🧪 STARTING EMAIL CONFIRMATION SYSTEM TESTING")
        print("=" * 60)
        print()
        
        tests = [
            self.test_health_check,
            self.test_registration_with_email_confirmation,
            self.test_registration_without_email_confirmation,
            self.test_login_before_email_confirmation,
            self.test_email_confirmation_with_mock_token,
            self.test_resend_confirmation_email,
            self.test_user_profile_creation_after_confirmation,
            self.test_jwt_token_generation_and_validation,
            self.test_protected_endpoints_access
        ]
        
        passed = 0
        total = len(tests)
        
        for test in tests:
            try:
                if test():
                    passed += 1
            except Exception as e:
                print(f"❌ CRITICAL ERROR in {test.__name__}: {str(e)}")
        
        print("=" * 60)
        print(f"📊 EMAIL CONFIRMATION SYSTEM TEST RESULTS")
        print(f"✅ Passed: {passed}/{total} ({(passed/total)*100:.1f}%)")
        print(f"❌ Failed: {total-passed}/{total}")
        print()
        
        # Summary of critical findings
        critical_issues = []
        working_features = []
        
        for result in self.test_results:
            if result['success']:
                working_features.append(result['test'])
            else:
                critical_issues.append(f"{result['test']}: {result['details']}")
        
        if critical_issues:
            print("🚨 CRITICAL ISSUES FOUND:")
            for issue in critical_issues:
                print(f"   • {issue}")
            print()
        
        if working_features:
            print("✅ WORKING FEATURES:")
            for feature in working_features:
                print(f"   • {feature}")
            print()
        
        return passed, total, critical_issues

if __name__ == "__main__":
    tester = EmailConfirmationTester()
    passed, total, issues = tester.run_all_tests()
    
    # Exit with appropriate code
    if passed == total:
        print("🎉 ALL TESTS PASSED - EMAIL CONFIRMATION SYSTEM IS WORKING!")
        exit(0)
    else:
        print(f"⚠️  {total-passed} TESTS FAILED - EMAIL CONFIRMATION SYSTEM NEEDS ATTENTION")
        exit(1)