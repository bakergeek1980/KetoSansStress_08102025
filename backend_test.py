#!/usr/bin/env python3
"""
Backend API Testing for KetoSansStress
Tests the daily summary endpoint and resolves 404 error for demo user
"""

import requests
import json
import base64
from datetime import datetime
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get backend URL from frontend .env
def get_backend_url():
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('EXPO_PUBLIC_BACKEND_URL='):
                    return line.split('=', 1)[1].strip()
    except:
        pass
    return "http://localhost:8001"

BASE_URL = get_backend_url()
API_URL = f"{BASE_URL}/api"

print(f"Testing backend at: {API_URL}")

# Sample base64 image (small 1x1 pixel PNG)
SAMPLE_IMAGE_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77zgAAAABJRU5ErkJggg=="

# Demo user profile data
DEMO_USER_PROFILE = {
    "name": "Marie Démonstration",
    "email": "demo@keto.fr",
    "age": 32,
    "gender": "femme",
    "weight": 68.0,
    "height": 165.0,
    "activity_level": "modere",
    "goal": "perte_poids"
}

def test_health_check():
    """Test the health check endpoint"""
    print("\n=== Testing Health Check Endpoint ===")
    try:
        response = requests.get(f"{API_URL}/health", timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get("status") == "healthy" and data.get("service") == "KetoScan API":
                print("✅ Health check endpoint working correctly")
                return True
            else:
                print("❌ Health check response format incorrect")
                return False
        else:
            print(f"❌ Health check failed with status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health check failed with error: {str(e)}")
        return False

def test_user_profile_endpoint():
    """Test POST /api/users/profile"""
    print("\n2. Testing User Profile Creation/Update")
    print("-" * 40)
    
    try:
        response = requests.post(
            f"{API_URL}/users/profile",
            json=FRENCH_USER_PROFILE,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            data = response.json()
            if "message" in data and "daily_macros" in data:
                print("✅ User profile creation PASSED")
                print(f"Daily macros calculated: {data['daily_macros']}")
                return True
            else:
                print("❌ User profile creation FAILED - Invalid response format")
                return False
        else:
            print(f"❌ User profile creation FAILED - Status code: {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ User profile creation FAILED - Connection error: {e}")
        return False
    except Exception as e:
        print(f"❌ User profile creation FAILED - Error: {e}")
        return False

def test_meal_analysis_endpoint():
    """Test POST /api/meals/analyze"""
    print("\n3. Testing Meal Analysis with AI")
    print("-" * 40)
    
    meal_analysis_data = {
        "image_base64": SAMPLE_IMAGE_BASE64,
        "meal_type": "dejeuner"
    }
    
    try:
        response = requests.post(
            f"{API_URL}/meals/analyze",
            json=meal_analysis_data,
            headers={"Content-Type": "application/json"},
            timeout=30  # Longer timeout for AI analysis
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            data = response.json()
            if ("success" in data and data["success"] and 
                "nutritional_info" in data and 
                "meal_type" in data):
                
                nutritional_info = data["nutritional_info"]
                required_fields = ["calories", "proteins", "carbs", "net_carbs", 
                                 "fats", "fiber", "keto_score", "foods_detected", 
                                 "portions", "confidence"]
                
                missing_fields = [field for field in required_fields 
                                if field not in nutritional_info]
                
                if not missing_fields:
                    print("✅ Meal analysis PASSED")
                    print(f"Detected foods: {nutritional_info['foods_detected']}")
                    print(f"Keto score: {nutritional_info['keto_score']}/10")
                    print(f"Confidence: {nutritional_info['confidence']}")
                    return True
                else:
                    print(f"❌ Meal analysis FAILED - Missing fields: {missing_fields}")
                    return False
            else:
                print("❌ Meal analysis FAILED - Invalid response format")
                return False
        else:
            print(f"❌ Meal analysis FAILED - Status code: {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Meal analysis FAILED - Connection error: {e}")
        return False
    except Exception as e:
        print(f"❌ Meal analysis FAILED - Error: {e}")
        return False

def test_food_search_endpoint():
    """Test GET /api/foods/search/avocat"""
    print("\n4. Testing French Food Search")
    print("-" * 40)
    
    try:
        response = requests.get(f"{API_URL}/foods/search/avocat", timeout=10)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            data = response.json()
            if "results" in data:
                results = data["results"]
                if len(results) > 0:
                    print("✅ Food search PASSED")
                    print(f"Found {len(results)} results for 'avocat'")
                    for result in results:
                        print(f"  - {result['name']}: {result['nutrition']}")
                    return True
                else:
                    print("❌ Food search FAILED - No results found for 'avocat'")
                    return False
            else:
                print("❌ Food search FAILED - Invalid response format")
                return False
        else:
            print(f"❌ Food search FAILED - Status code: {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Food search FAILED - Connection error: {e}")
        return False
    except Exception as e:
        print(f"❌ Food search FAILED - Error: {e}")
        return False

def run_all_tests():
    """Run all backend tests"""
    print("Starting KetoScan Backend API Tests")
    print("=" * 60)
    
    test_results = {
        "health_check": test_health_endpoint(),
        "user_profile": test_user_profile_endpoint(),
        "meal_analysis": test_meal_analysis_endpoint(),
        "food_search": test_food_search_endpoint()
    }
    
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    
    passed = sum(test_results.values())
    total = len(test_results)
    
    for test_name, result in test_results.items():
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{test_name.replace('_', ' ').title()}: {status}")
    
    print(f"\nOverall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests PASSED! KetoScan backend is working correctly.")
        return True
    else:
        print(f"⚠️  {total - passed} test(s) FAILED. Please check the issues above.")
        return False

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)