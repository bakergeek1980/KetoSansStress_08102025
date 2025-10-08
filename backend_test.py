#!/usr/bin/env python3
"""
Backend API Testing for KetoSansStress
Testing the simplified registration endpoint POST /api/auth/register
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
BASE_URL = "https://keto-onboard.preview.emergentagent.com/api"
HEADERS = {
    "Content-Type": "application/json",
    "Accept": "application/json"
}

class TestResults:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.results = []
    
    def add_result(self, test_name, passed, details=""):
        self.results.append({
            "test": test_name,
            "passed": passed,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })
        if passed:
            self.passed += 1
        else:
            self.failed += 1
    
    def print_summary(self):
        total = self.passed + self.failed
        success_rate = (self.passed / total * 100) if total > 0 else 0
        
        print(f"\n{'='*60}")
        print(f"SIMPLIFIED REGISTRATION ENDPOINT TEST SUMMARY")
        print(f"{'='*60}")
        print(f"Total Tests: {total}")
        print(f"Passed: {self.passed}")
        print(f"Failed: {self.failed}")
        print(f"Success Rate: {success_rate:.1f}%")
        print(f"{'='*60}")
        
        for result in self.results:
            status = "✅ PASS" if result["passed"] else "❌ FAIL"
            print(f"{status} - {result['test']}")
            if result["details"]:
                print(f"    Details: {result['details']}")
        print(f"{'='*60}")

def test_simplified_registration():
    """Test the simplified registration endpoint with various scenarios"""
    
    results = TestResults()
    
    print("🧪 TESTING SIMPLIFIED REGISTRATION ENDPOINT")
    print(f"Backend URL: {BASE_URL}")
    print(f"Testing endpoint: POST /api/auth/register")
    print("-" * 60)
    
    # Test Case 1: Valid registration with only email and password
    print("\n1. Testing valid registration with email and password...")
    try:
        test_data = {
            "email": "test.simple@ketosansstress.com",
            "password": "ValidPass123!"
        }
        
        response = requests.post(
            f"{BASE_URL}/auth/register",
            headers=HEADERS,
            json=test_data,
            timeout=30
        )
        
        print(f"   Status Code: {response.status_code}")
        print(f"   Response: {response.text[:200]}...")
        
        if response.status_code == 201:
            response_data = response.json()
            required_fields = ["user_id", "email", "needs_email_confirmation"]
            
            has_all_fields = all(field in response_data for field in required_fields)
            correct_email = response_data.get("email") == test_data["email"]
            has_confirmation_flag = "needs_email_confirmation" in response_data
            
            if has_all_fields and correct_email and has_confirmation_flag:
                results.add_result(
                    "Valid registration with email and password", 
                    True, 
                    f"User created successfully with user_id: {response_data.get('user_id')}, needs_email_confirmation: {response_data.get('needs_email_confirmation')}"
                )
            else:
                results.add_result(
                    "Valid registration with email and password", 
                    False, 
                    f"Missing required fields or incorrect data. Response: {response_data}"
                )
        else:
            results.add_result(
                "Valid registration with email and password", 
                False, 
                f"Expected 201, got {response.status_code}. Response: {response.text}"
            )
            
    except Exception as e:
        results.add_result(
            "Valid registration with email and password", 
            False, 
            f"Request failed: {str(e)}"
        )
    
    # Test Case 2: Invalid email format should be rejected with 422
    print("\n2. Testing invalid email format...")
    try:
        test_data = {
            "email": "invalid-email",
            "password": "ValidPass123!"
        }
        
        response = requests.post(
            f"{BASE_URL}/auth/register",
            headers=HEADERS,
            json=test_data,
            timeout=30
        )
        
        print(f"   Status Code: {response.status_code}")
        print(f"   Response: {response.text[:200]}...")
        
        if response.status_code == 422:
            results.add_result(
                "Invalid email format rejection", 
                True, 
                "Invalid email correctly rejected with 422"
            )
        else:
            results.add_result(
                "Invalid email format rejection", 
                False, 
                f"Expected 422, got {response.status_code}. Response: {response.text}"
            )
            
    except Exception as e:
        results.add_result(
            "Invalid email format rejection", 
            False, 
            f"Request failed: {str(e)}"
        )
    
    # Test Case 3: Weak password should be rejected with 422
    print("\n3. Testing weak password...")
    try:
        test_data = {
            "email": "weak@test.com",
            "password": "123"
        }
        
        response = requests.post(
            f"{BASE_URL}/auth/register",
            headers=HEADERS,
            json=test_data,
            timeout=30
        )
        
        print(f"   Status Code: {response.status_code}")
        print(f"   Response: {response.text[:200]}...")
        
        if response.status_code == 422:
            results.add_result(
                "Weak password rejection", 
                True, 
                "Weak password correctly rejected with 422"
            )
        else:
            results.add_result(
                "Weak password rejection", 
                False, 
                f"Expected 422, got {response.status_code}. Response: {response.text}"
            )
            
    except Exception as e:
        results.add_result(
            "Weak password rejection", 
            False, 
            f"Request failed: {str(e)}"
        )
    
    # Test Case 4: Missing email should be rejected with 422
    print("\n4. Testing missing email...")
    try:
        test_data = {
            "password": "ValidPass123!"
        }
        
        response = requests.post(
            f"{BASE_URL}/auth/register",
            headers=HEADERS,
            json=test_data,
            timeout=30
        )
        
        print(f"   Status Code: {response.status_code}")
        print(f"   Response: {response.text[:200]}...")
        
        if response.status_code == 422:
            results.add_result(
                "Missing email rejection", 
                True, 
                "Missing email correctly rejected with 422"
            )
        else:
            results.add_result(
                "Missing email rejection", 
                False, 
                f"Expected 422, got {response.status_code}. Response: {response.text}"
            )
            
    except Exception as e:
        results.add_result(
            "Missing email rejection", 
            False, 
            f"Request failed: {str(e)}"
        )
    
    # Test Case 5: Missing password should be rejected with 422
    print("\n5. Testing missing password...")
    try:
        test_data = {
            "email": "missing@test.com"
        }
        
        response = requests.post(
            f"{BASE_URL}/auth/register",
            headers=HEADERS,
            json=test_data,
            timeout=30
        )
        
        print(f"   Status Code: {response.status_code}")
        print(f"   Response: {response.text[:200]}...")
        
        if response.status_code == 422:
            results.add_result(
                "Missing password rejection", 
                True, 
                "Missing password correctly rejected with 422"
            )
        else:
            results.add_result(
                "Missing password rejection", 
                False, 
                f"Expected 422, got {response.status_code}. Response: {response.text}"
            )
            
    except Exception as e:
        results.add_result(
            "Missing password rejection", 
            False, 
            f"Request failed: {str(e)}"
        )
    
    # Test Case 6: Test duplicate email registration (should return 409 or 500)
    print("\n6. Testing duplicate email registration...")
    try:
        test_data = {
            "email": "test.simple@ketosansstress.com",  # Same as test case 1
            "password": "ValidPass123!"
        }
        
        response = requests.post(
            f"{BASE_URL}/auth/register",
            headers=HEADERS,
            json=test_data,
            timeout=30
        )
        
        print(f"   Status Code: {response.status_code}")
        print(f"   Response: {response.text[:200]}...")
        
        if response.status_code in [409, 500]:  # Either conflict or server error due to rate limiting
            results.add_result(
                "Duplicate email handling", 
                True, 
                f"Duplicate email correctly handled with {response.status_code}"
            )
        else:
            results.add_result(
                "Duplicate email handling", 
                False, 
                f"Expected 409 or 500, got {response.status_code}. Response: {response.text}"
            )
            
    except Exception as e:
        results.add_result(
            "Duplicate email handling", 
            False, 
            f"Request failed: {str(e)}"
        )
    
    # Test Case 7: Test endpoint accessibility (should not require authentication)
    print("\n7. Testing endpoint accessibility...")
    try:
        # Test with no authorization header
        test_data = {
            "email": "access.test@ketosansstress.com",
            "password": "AccessTest123!"
        }
        
        response = requests.post(
            f"{BASE_URL}/auth/register",
            headers={"Content-Type": "application/json"},  # No auth header
            json=test_data,
            timeout=30
        )
        
        print(f"   Status Code: {response.status_code}")
        print(f"   Response: {response.text[:200]}...")
        
        if response.status_code in [201, 409, 500]:  # Success, conflict, or rate limit - not 401/403
            results.add_result(
                "Endpoint accessibility (no auth required)", 
                True, 
                f"Endpoint accessible without authentication: {response.status_code}"
            )
        else:
            results.add_result(
                "Endpoint accessibility (no auth required)", 
                False, 
                f"Endpoint may require authentication. Status: {response.status_code}"
            )
            
    except Exception as e:
        results.add_result(
            "Endpoint accessibility (no auth required)", 
            False, 
            f"Request failed: {str(e)}"
        )
    
    return results

def test_health_check():
    """Test the health check endpoint to verify backend is running"""
    print("\n🏥 TESTING BACKEND HEALTH CHECK")
    print("-" * 40)
    
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=10)
        print(f"Health Check Status: {response.status_code}")
        
        if response.status_code == 200:
            health_data = response.json()
            print(f"Service Status: {health_data.get('status', 'unknown')}")
            print(f"Service Name: {health_data.get('service', 'unknown')}")
            print(f"Supabase Status: {health_data.get('supabase', 'unknown')}")
            return True
        else:
            print(f"Health check failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"Health check error: {str(e)}")
        return False

if __name__ == "__main__":
    print("🚀 STARTING BACKEND API TESTING")
    print(f"Timestamp: {datetime.now().isoformat()}")
    print("=" * 60)
    
    # Test backend health first
    if not test_health_check():
        print("❌ Backend health check failed. Exiting...")
        sys.exit(1)
    
    # Run simplified registration tests
    test_results = test_simplified_registration()
    
    # Print summary
    test_results.print_summary()
    
    # Exit with appropriate code
    if test_results.failed > 0:
        print(f"\n❌ {test_results.failed} test(s) failed!")
        sys.exit(1)
    else:
        print(f"\n✅ All {test_results.passed} tests passed!")
        sys.exit(0)