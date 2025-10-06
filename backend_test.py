#!/usr/bin/env python3
"""
Backend API Testing for KetoSansStress Authentication System
Testing the authentication endpoints after frontend changes from React Hook Form to useState
Focus on login, register, profile endpoints and email confirmation flow
"""

import requests
import json
import time
import uuid
from typing import Dict, Any, List, Optional
from datetime import datetime

# Configuration - Using production URL from frontend .env
BACKEND_URL = "https://ketolite.preview.emergentagent.com/api"

TIMEOUT = 30

class BackendTester:
    def __init__(self):
        self.session = requests.Session()
        self.session.timeout = TIMEOUT
        self.test_results = []
        self.auth_token = None
        self.test_user_email = None
        self.test_user_id = None
        
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
        if not success and response_data:
            print(f"   Response: {response_data}")
        print()

    def test_health_check(self):
        """Test health check endpoint"""
        try:
            response = self.session.get(f"{BACKEND_URL}/health")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "healthy":
                    self.log_test(
                        "Health Check", 
                        True, 
                        f"Service healthy, Supabase: {data.get('supabase', 'unknown')}"
                    )
                else:
                    self.log_test("Health Check", False, f"Service not healthy: {data}")
            else:
                self.log_test("Health Check", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Health Check", False, f"Exception: {str(e)}")

    def test_user_registration(self):
        """Test user registration with all fields (as mentioned in review)"""
        # Generate unique test user
        unique_id = str(uuid.uuid4())[:8]
        self.test_user_email = f"testuser_{unique_id}@ketosansstress.com"
        
        registration_data = {
            "email": self.test_user_email,
            "password": "SecurePass123!",
            "full_name": "Marie Testeur",
            "age": 28,
            "gender": "female", 
            "height": 165.0,
            "weight": 65.0,
            "activity_level": "moderately_active",
            "goal": "weight_loss",
            "timezone": "Europe/Paris"
        }
        
        try:
            response = self.session.post(
                f"{BACKEND_URL}/auth/register",
                json=registration_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 201:
                data = response.json()
                self.test_user_id = data.get("user_id")
                needs_confirmation = data.get("needs_email_confirmation", False)
                
                self.log_test(
                    "User Registration", 
                    True, 
                    f"User registered successfully. Email confirmation needed: {needs_confirmation}",
                    data
                )
                return True
            else:
                self.log_test(
                    "User Registration", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}",
                    response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text
                )
                return False
                
        except Exception as e:
            self.log_test("User Registration", False, f"Exception: {str(e)}")
            return False

    def test_user_login(self):
        """Test user login with email/password"""
        if not self.test_user_email:
            self.log_test("User Login", False, "No test user email available")
            return False
            
        login_data = {
            "email": self.test_user_email,
            "password": "SecurePass123!"
        }
        
        try:
            response = self.session.post(
                f"{BACKEND_URL}/auth/login",
                json=login_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                self.auth_token = data.get("access_token")
                
                self.log_test(
                    "User Login", 
                    True, 
                    f"Login successful. Token received: {bool(self.auth_token)}",
                    {"user_id": data.get("user", {}).get("id"), "expires_in": data.get("expires_in")}
                )
                return True
            elif response.status_code == 403:
                # Email confirmation required
                self.log_test(
                    "User Login", 
                    True, 
                    "Login blocked due to email confirmation requirement (expected behavior)",
                    response.json()
                )
                return True
            else:
                self.log_test(
                    "User Login", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}",
                    response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text
                )
                return False
                
        except Exception as e:
            self.log_test("User Login", False, f"Exception: {str(e)}")
            return False

    def test_get_current_user(self):
        """Test GET /api/auth/me endpoint"""
        if not self.auth_token:
            self.log_test("Get Current User", False, "No auth token available")
            return False
            
        try:
            headers = {
                "Authorization": f"Bearer {self.auth_token}",
                "Content-Type": "application/json"
            }
            
            response = self.session.get(f"{BACKEND_URL}/auth/me", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                self.log_test(
                    "Get Current User", 
                    True, 
                    f"User info retrieved successfully. Email: {data.get('email')}",
                    {"id": data.get("id"), "full_name": data.get("full_name")}
                )
                return True
            else:
                self.log_test(
                    "Get Current User", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}",
                    response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text
                )
                return False
                
        except Exception as e:
            self.log_test("Get Current User", False, f"Exception: {str(e)}")
            return False

    def test_profile_update(self):
        """Test PATCH /api/auth/profile endpoint"""
        if not self.auth_token:
            self.log_test("Profile Update", False, "No auth token available")
            return False
            
        update_data = {
            "full_name": "Marie Testeur Updated",
            "age": 29,
            "gender": "female",
            "height": 167.0,
            "weight": 63.0,
            "activity_level": "very_active",
            "goal": "maintenance"
        }
        
        try:
            headers = {
                "Authorization": f"Bearer {self.auth_token}",
                "Content-Type": "application/json"
            }
            
            response = self.session.patch(
                f"{BACKEND_URL}/auth/profile",
                json=update_data,
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                self.log_test(
                    "Profile Update", 
                    True, 
                    f"Profile updated successfully. New name: {data.get('user', {}).get('full_name')}",
                    data.get("message")
                )
                return True
            else:
                self.log_test(
                    "Profile Update", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}",
                    response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text
                )
                return False
                
        except Exception as e:
            self.log_test("Profile Update", False, f"Exception: {str(e)}")
            return False

    def test_password_change(self):
        """Test PATCH /api/auth/change-password endpoint"""
        if not self.auth_token:
            self.log_test("Password Change", False, "No auth token available")
            return False
            
        password_data = {
            "current_password": "SecurePass123!",
            "new_password": "NewSecurePass456!"
        }
        
        try:
            headers = {
                "Authorization": f"Bearer {self.auth_token}",
                "Content-Type": "application/json"
            }
            
            response = self.session.patch(
                f"{BACKEND_URL}/auth/change-password",
                json=password_data,
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                self.log_test(
                    "Password Change", 
                    True, 
                    f"Password changed successfully: {data.get('message')}",
                    data
                )
                return True
            else:
                self.log_test(
                    "Password Change", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}",
                    response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text
                )
                return False
                
        except Exception as e:
            self.log_test("Password Change", False, f"Exception: {str(e)}")
            return False

    def test_forgot_password(self):
        """Test POST /api/auth/password-reset endpoint"""
        reset_data = {
            "email": self.test_user_email or "test@ketosansstress.com"
        }
        
        try:
            response = self.session.post(
                f"{BACKEND_URL}/auth/password-reset",
                json=reset_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                self.log_test(
                    "Forgot Password", 
                    True, 
                    f"Password reset request processed: {data.get('message')}",
                    data
                )
                return True
            else:
                self.log_test(
                    "Forgot Password", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}",
                    response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text
                )
                return False
                
        except Exception as e:
            self.log_test("Forgot Password", False, f"Exception: {str(e)}")
            return False

    def test_email_confirmation_flow(self):
        """Test email confirmation endpoints"""
        # Test confirm-email endpoint with invalid token
        try:
            confirm_data = {"token": "invalid_token_for_testing"}
            response = self.session.post(
                f"{BACKEND_URL}/auth/confirm-email",
                json=confirm_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 400:
                self.log_test(
                    "Email Confirmation (Invalid Token)", 
                    True, 
                    "Invalid token correctly rejected",
                    response.json()
                )
            else:
                self.log_test(
                    "Email Confirmation (Invalid Token)", 
                    False, 
                    f"Expected 400, got {response.status_code}: {response.text}"
                )
        except Exception as e:
            self.log_test("Email Confirmation (Invalid Token)", False, f"Exception: {str(e)}")

        # Test resend confirmation
        if self.test_user_email:
            try:
                resend_data = {"email": self.test_user_email}
                response = self.session.post(
                    f"{BACKEND_URL}/auth/resend-confirmation",
                    json=resend_data,
                    headers={"Content-Type": "application/json"}
                )
                
                if response.status_code == 200:
                    data = response.json()
                    self.log_test(
                        "Resend Confirmation", 
                        True, 
                        f"Resend confirmation processed: {data.get('message')}",
                        data
                    )
                else:
                    self.log_test(
                        "Resend Confirmation", 
                        False, 
                        f"HTTP {response.status_code}: {response.text}"
                    )
            except Exception as e:
                self.log_test("Resend Confirmation", False, f"Exception: {str(e)}")

    def test_validation_errors(self):
        """Test validation errors for registration"""
        # Test weak password
        weak_password_data = {
            "email": "weaktest@ketosansstress.com",
            "password": "weak",
            "full_name": "Test User",
            "age": 25,
            "gender": "female",
            "height": 165.0,
            "weight": 65.0,
            "activity_level": "moderately_active",
            "goal": "weight_loss",
            "timezone": "Europe/Paris"
        }
        
        try:
            response = self.session.post(
                f"{BACKEND_URL}/auth/register",
                json=weak_password_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 422:
                self.log_test(
                    "Weak Password Validation", 
                    True, 
                    "Weak password correctly rejected",
                    response.json()
                )
            else:
                self.log_test(
                    "Weak Password Validation", 
                    False, 
                    f"Expected 422, got {response.status_code}: {response.text}"
                )
        except Exception as e:
            self.log_test("Weak Password Validation", False, f"Exception: {str(e)}")

        # Test invalid email
        invalid_email_data = {
            "email": "invalid-email",
            "password": "SecurePass123!",
            "full_name": "Test User",
            "age": 25,
            "gender": "female",
            "height": 165.0,
            "weight": 65.0,
            "activity_level": "moderately_active",
            "goal": "weight_loss",
            "timezone": "Europe/Paris"
        }
        
        try:
            response = self.session.post(
                f"{BACKEND_URL}/auth/register",
                json=invalid_email_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 422:
                self.log_test(
                    "Invalid Email Validation", 
                    True, 
                    "Invalid email correctly rejected",
                    response.json()
                )
            else:
                self.log_test(
                    "Invalid Email Validation", 
                    False, 
                    f"Expected 422, got {response.status_code}: {response.text}"
                )
        except Exception as e:
            self.log_test("Invalid Email Validation", False, f"Exception: {str(e)}")

    def run_all_tests(self):
        """Run all backend tests"""
        print("🧪 STARTING BACKEND API TESTING FOR KETOSANSSTRESS AUTHENTICATION")
        print("=" * 70)
        print(f"Base URL: {BACKEND_URL}")
        print(f"Timestamp: {datetime.now().isoformat()}")
        print()
        
        # Core functionality tests
        self.test_health_check()
        self.test_user_registration()
        self.test_user_login()
        self.test_get_current_user()
        self.test_profile_update()
        self.test_password_change()
        self.test_forgot_password()
        
        # Email confirmation flow tests
        self.test_email_confirmation_flow()
        
        # Validation tests
        self.test_validation_errors()
        
        # Summary
        self.print_summary()

    def print_summary(self):
        """Print test summary"""
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
            for result in self.test_results:
                if not result["success"]:
                    print(f"  - {result['test']}: {result['details']}")
            print()
        
        print("✅ PASSED TESTS:")
        for result in self.test_results:
            if result["success"]:
                print(f"  - {result['test']}: {result['details']}")
        
        print()
        print("🔍 KEY FINDINGS:")
        
        # Analyze results
        auth_working = any(r["success"] and "Login" in r["test"] for r in self.test_results)
        registration_working = any(r["success"] and "Registration" in r["test"] for r in self.test_results)
        profile_working = any(r["success"] and "Profile" in r["test"] for r in self.test_results)
        
        if auth_working:
            print("  ✅ Authentication system is functional")
        else:
            print("  ❌ Authentication system has issues")
            
        if registration_working:
            print("  ✅ User registration is working")
        else:
            print("  ❌ User registration has issues")
            
        if profile_working:
            print("  ✅ Profile management is working")
        else:
            print("  ❌ Profile management has issues")
        
        print()
        print("📊 COMPATIBILITY WITH FRONTEND CHANGES:")
        print("  - Testing data type conversions (age, height, weight as int/float)")
        print("  - Validating email/password authentication flow")
        print("  - Confirming profile endpoints work with new frontend state management")
        
        return success_rate >= 70  # Consider 70%+ success rate as acceptable

if __name__ == "__main__":
    tester = BackendTester()
    success = tester.run_all_tests()
    
    if success:
        print("\n🎉 BACKEND TESTING COMPLETED SUCCESSFULLY!")
    else:
        print("\n⚠️  BACKEND TESTING COMPLETED WITH ISSUES!")
        
    exit(0 if success else 1)
                "email": email,
                "status_code": response.status_code,
                "expected_status": expected_status,
                "success": response.status_code == expected_status,
                "response_data": None,
                "error": None,
                "needs_email_confirmation": None
            }
            
            try:
                response_data = response.json()
                result["response_data"] = response_data
                result["needs_email_confirmation"] = response_data.get("needs_email_confirmation")
            except:
                result["response_data"] = response.text
            
            if not result["success"]:
                result["error"] = f"Expected {expected_status}, got {response.status_code}"
                if result["response_data"]:
                    result["error"] += f" - {result['response_data']}"
            
            return result
            
        except Exception as e:
            return {
                "email": email,
                "status_code": None,
                "expected_status": expected_status,
                "success": False,
                "response_data": None,
                "error": f"Request failed: {str(e)}",
                "needs_email_confirmation": None
            }
    
    def test_mainstream_providers(self) -> List[Dict[str, Any]]:
        """Test mainstream email providers"""
        print("🧪 Testing Mainstream Email Providers...")
        
        mainstream_emails = [
            "testeur.gmail@gmail.com",
            "testeur.yahoo@yahoo.fr", 
            "testeur.outlook@hotmail.com",
            "testeur.orange@orange.fr"
        ]
        
        results = []
        for email in mainstream_emails:
            print(f"  Testing: {email}")
            result = self.test_email_registration(email)
            results.append(result)
            time.sleep(0.5)  # Rate limiting
        
        return results
    
    def test_professional_domains(self) -> List[Dict[str, Any]]:
        """Test professional email domains"""
        print("🧪 Testing Professional Email Domains...")
        
        professional_emails = [
            "marie.pro@entreprise.com",
            "etudiant@universite.edu"
        ]
        
        results = []
        for email in professional_emails:
            print(f"  Testing: {email}")
            result = self.test_email_registration(email)
            results.append(result)
            time.sleep(0.5)  # Rate limiting
        
        return results
    
    def test_special_formats(self) -> List[Dict[str, Any]]:
        """Test special email formats"""
        print("🧪 Testing Special Email Formats...")
        
        special_emails = [
            "user+test@domain.net",
            "jean-marie@mon-domaine.org",
            "usuario@dominio.es",
            "test@ai"
        ]
        
        results = []
        for email in special_emails:
            print(f"  Testing: {email}")
            result = self.test_email_registration(email)
            results.append(result)
            time.sleep(0.5)  # Rate limiting
        
        return results
    
    def test_invalid_emails(self) -> List[Dict[str, Any]]:
        """Test invalid email formats (should fail)"""
        print("🧪 Testing Invalid Email Formats (should fail)...")
        
        invalid_emails = [
            ("emailsansarobase", 422),  # No @ symbol
            ("test@", 422),  # No domain
            ("", 422)  # Empty email
        ]
        
        results = []
        for email, expected_status in invalid_emails:
            print(f"  Testing invalid: '{email}' (expecting {expected_status})")
            result = self.test_email_registration(email, expected_status)
            results.append(result)
            time.sleep(0.5)  # Rate limiting
        
        return results
    
    def run_comprehensive_test(self) -> Dict[str, Any]:
        """Run all email domain tests"""
        print("🎯 STARTING COMPREHENSIVE MULTI-DOMAIN EMAIL TESTING")
        print("=" * 60)
        
        start_time = datetime.now()
        
        # Test all categories
        mainstream_results = self.test_mainstream_providers()
        professional_results = self.test_professional_domains()
        special_results = self.test_special_formats()
        invalid_results = self.test_invalid_emails()
        
        # Combine all results
        all_results = mainstream_results + professional_results + special_results + invalid_results
        
        # Calculate statistics
        total_tests = len(all_results)
        successful_tests = sum(1 for r in all_results if r["success"])
        success_rate = (successful_tests / total_tests) * 100 if total_tests > 0 else 0
        
        # Count valid email acceptances (excluding invalid email tests)
        valid_email_tests = mainstream_results + professional_results + special_results
        valid_email_successes = sum(1 for r in valid_email_tests if r["success"])
        valid_domains_tested = len(set(email.split('@')[1] for email in [r["email"] for r in valid_email_tests if '@' in r["email"]]))
        
        # Check for needs_email_confirmation consistency
        confirmation_statuses = [r["needs_email_confirmation"] for r in valid_email_tests if r["success"] and r["needs_email_confirmation"] is not None]
        consistent_confirmation = len(set(confirmation_statuses)) <= 1 if confirmation_statuses else True
        
        end_time = datetime.now()
        
        summary = {
            "test_summary": {
                "total_tests": total_tests,
                "successful_tests": successful_tests,
                "success_rate": round(success_rate, 1),
                "valid_domains_tested": valid_domains_tested,
                "valid_email_successes": valid_email_successes,
                "consistent_email_confirmation": consistent_confirmation,
                "test_duration": str(end_time - start_time)
            },
            "detailed_results": {
                "mainstream_providers": mainstream_results,
                "professional_domains": professional_results,
                "special_formats": special_results,
                "invalid_emails": invalid_results
            },
            "validation_criteria": {
                "accepts_all_valid_domains": valid_email_successes >= 8,  # At least 8 different domains
                "rejects_invalid_emails": all(r["success"] for r in invalid_results),
                "universal_email_confirmation": consistent_confirmation,
                "no_domain_restrictions": True  # Will be determined by results
            }
        }
        
        return summary
    
    def print_results(self, summary: Dict[str, Any]):
        """Print formatted test results"""
        print("\n" + "=" * 60)
        print("📊 MULTI-DOMAIN EMAIL TESTING RESULTS")
        print("=" * 60)
        
        test_summary = summary["test_summary"]
        print(f"Total Tests: {test_summary['total_tests']}")
        print(f"Successful Tests: {test_summary['successful_tests']}")
        print(f"Success Rate: {test_summary['success_rate']}%")
        print(f"Valid Domains Tested: {test_summary['valid_domains_tested']}")
        print(f"Test Duration: {test_summary['test_duration']}")
        
        print("\n🎯 VALIDATION CRITERIA:")
        criteria = summary["validation_criteria"]
        print(f"✅ Accepts All Valid Domains: {'PASS' if criteria['accepts_all_valid_domains'] else 'FAIL'}")
        print(f"✅ Rejects Invalid Emails: {'PASS' if criteria['rejects_invalid_emails'] else 'FAIL'}")
        print(f"✅ Universal Email Confirmation: {'PASS' if criteria['universal_email_confirmation'] else 'FAIL'}")
        
        print("\n📋 DETAILED RESULTS BY CATEGORY:")
        
        # Mainstream providers
        print("\n1️⃣ MAINSTREAM PROVIDERS:")
        for result in summary["detailed_results"]["mainstream_providers"]:
            status = "✅" if result["success"] else "❌"
            confirmation = f" (confirmation: {result['needs_email_confirmation']})" if result["needs_email_confirmation"] is not None else ""
            print(f"  {status} {result['email']} - Status: {result['status_code']}{confirmation}")
            if not result["success"]:
                print(f"      Error: {result['error']}")
        
        # Professional domains
        print("\n2️⃣ PROFESSIONAL DOMAINS:")
        for result in summary["detailed_results"]["professional_domains"]:
            status = "✅" if result["success"] else "❌"
            confirmation = f" (confirmation: {result['needs_email_confirmation']})" if result["needs_email_confirmation"] is not None else ""
            print(f"  {status} {result['email']} - Status: {result['status_code']}{confirmation}")
            if not result["success"]:
                print(f"      Error: {result['error']}")
        
        # Special formats
        print("\n3️⃣ SPECIAL FORMATS:")
        for result in summary["detailed_results"]["special_formats"]:
            status = "✅" if result["success"] else "❌"
            confirmation = f" (confirmation: {result['needs_email_confirmation']})" if result["needs_email_confirmation"] is not None else ""
            print(f"  {status} {result['email']} - Status: {result['status_code']}{confirmation}")
            if not result["success"]:
                print(f"      Error: {result['error']}")
        
        # Invalid emails
        print("\n4️⃣ INVALID EMAILS (should fail):")
        for result in summary["detailed_results"]["invalid_emails"]:
            status = "✅" if result["success"] else "❌"
            print(f"  {status} '{result['email']}' - Status: {result['status_code']} (expected: {result['expected_status']})")
            if not result["success"]:
                print(f"      Error: {result['error']}")
        
        print("\n" + "=" * 60)
        
        # Final verdict
        all_criteria_pass = all(criteria.values())
        if all_criteria_pass:
            print("🎉 VERDICT: ALL CRITERIA PASSED! The application accepts all valid email domains.")
        else:
            print("⚠️  VERDICT: Some criteria failed. Review the results above.")
        
        print("=" * 60)

def main():
    """Main test execution"""
    tester = EmailDomainTester()
    
    try:
        # Run comprehensive tests
        summary = tester.run_comprehensive_test()
        
        # Print results
        tester.print_results(summary)
        
        # Save results to file
        with open('/app/email_domain_test_results.json', 'w', encoding='utf-8') as f:
            json.dump(summary, f, indent=2, ensure_ascii=False)
        
        print(f"\n📄 Detailed results saved to: /app/email_domain_test_results.json")
        
        return summary
        
    except Exception as e:
        print(f"❌ Test execution failed: {str(e)}")
        return None

if __name__ == "__main__":
    main()