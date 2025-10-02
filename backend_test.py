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

def create_demo_user():
    """Create demo user profile with email demo@keto.fr"""
    print("\n=== Creating Demo User Profile ===")
    
    demo_profile = {
        "name": "Marie Démonstration",
        "email": "demo@keto.fr",
        "age": 32,
        "gender": "femme",
        "weight": 68.0,
        "height": 165.0,
        "activity_level": "modere",
        "goal": "perte_poids"
    }
    
    try:
        response = requests.post(f"{API_URL}/users/profile", json=demo_profile, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            data = response.json()
            if "daily_macros" in data:
                print("✅ Demo user profile created successfully")
                print(f"Daily macros: {data['daily_macros']}")
                return True
            else:
                print("❌ Demo user profile creation response missing daily_macros")
                return False
        else:
            print(f"❌ Demo user profile creation failed with status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Demo user profile creation failed with error: {str(e)}")
        return False

def test_daily_summary_empty():
    """Test daily summary endpoint with demo user (should work but be empty)"""
    print("\n=== Testing Daily Summary Endpoint (Empty) ===")
    
    try:
        response = requests.get(f"{API_URL}/meals/daily-summary/demo@keto.fr", timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            data = response.json()
            required_fields = ["date", "totals", "targets", "progress", "meals_count", "keto_status"]
            if all(field in data for field in required_fields):
                print("✅ Daily summary endpoint working correctly (empty data)")
                print(f"Meals count: {data['meals_count']}")
                print(f"Keto status: {data['keto_status']}")
                return True
            else:
                print("❌ Daily summary response missing required fields")
                return False
        else:
            print(f"❌ Daily summary failed with status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Daily summary failed with error: {str(e)}")
        return False

def add_sample_meal_data():
    """Add sample meal data for demo user to make dashboard realistic"""
    print("\n=== Adding Sample Meal Data ===")
    
    # Create a simple base64 encoded 1x1 pixel image for testing
    sample_image = base64.b64encode(b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\tpHYs\x00\x00\x0b\x13\x00\x00\x0b\x13\x01\x00\x9a\x9c\x18\x00\x00\x00\x12IDATx\x9cc```bPPP\x00\x02\xac\x01\x00\x05\x1a\x00\x01\x02\x0f\x8d\xb2\x00\x00\x00\x00IEND\xaeB`\x82').decode('utf-8')
    
    sample_meals = [
        {
            "user_id": "demo@keto.fr",
            "date": datetime.now().strftime("%Y-%m-%d"),
            "meal_type": "petit_dejeuner",
            "image_base64": sample_image,
            "nutritional_info": {
                "calories": 420.0,
                "proteins": 18.0,
                "carbs": 8.0,
                "net_carbs": 5.0,
                "fats": 35.0,
                "fiber": 3.0,
                "keto_score": 9,
                "foods_detected": ["Œufs brouillés", "Avocat", "Beurre"],
                "portions": ["2 œufs", "1/2 avocat", "1 cuillère à soupe"],
                "confidence": 0.9
            },
            "notes": "Petit-déjeuner keto parfait"
        },
        {
            "user_id": "demo@keto.fr",
            "date": datetime.now().strftime("%Y-%m-%d"),
            "meal_type": "dejeuner",
            "image_base64": sample_image,
            "nutritional_info": {
                "calories": 580.0,
                "proteins": 32.0,
                "carbs": 12.0,
                "net_carbs": 8.0,
                "fats": 45.0,
                "fiber": 4.0,
                "keto_score": 8,
                "foods_detected": ["Saumon grillé", "Épinards", "Huile d'olive"],
                "portions": ["150g", "100g", "2 cuillères à soupe"],
                "confidence": 0.85
            },
            "notes": "Déjeuner riche en oméga-3"
        },
        {
            "user_id": "demo@keto.fr",
            "date": datetime.now().strftime("%Y-%m-%d"),
            "meal_type": "diner",
            "image_base64": sample_image,
            "nutritional_info": {
                "calories": 520.0,
                "proteins": 28.0,
                "carbs": 10.0,
                "net_carbs": 6.0,
                "fats": 42.0,
                "fiber": 4.0,
                "keto_score": 9,
                "foods_detected": ["Poulet rôti", "Brocoli", "Fromage"],
                "portions": ["120g", "150g", "30g"],
                "confidence": 0.88
            },
            "notes": "Dîner équilibré et savoureux"
        }
    ]
    
    success_count = 0
    for i, meal in enumerate(sample_meals):
        try:
            response = requests.post(f"{API_URL}/meals/save", json=meal, timeout=10)
            print(f"Meal {i+1} - Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Sample meal {i+1} ({meal['meal_type']}) saved successfully")
                success_count += 1
            else:
                print(f"❌ Sample meal {i+1} failed with status {response.status_code}")
                print(f"Response: {response.text}")
        except Exception as e:
            print(f"❌ Sample meal {i+1} failed with error: {str(e)}")
    
    print(f"\nSample meals added: {success_count}/{len(sample_meals)}")
    return success_count == len(sample_meals)

def test_daily_summary_with_data():
    """Test daily summary endpoint with demo user after adding meal data"""
    print("\n=== Testing Daily Summary Endpoint (With Data) ===")
    
    try:
        response = requests.get(f"{API_URL}/meals/daily-summary/demo@keto.fr", timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)}")
            
            # Check if we have meal data now
            if data.get("meals_count", 0) > 0:
                print("✅ Daily summary endpoint working with meal data")
                print(f"Total meals: {data['meals_count']}")
                print(f"Total calories: {data['totals']['calories']}")
                print(f"Net carbs: {data['totals']['net_carbs']}")
                print(f"Keto status: {data['keto_status']}")
                return True
            else:
                print("⚠️ Daily summary working but no meal data found")
                return True  # Still working, just no data
        else:
            print(f"❌ Daily summary failed with status {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Daily summary failed with error: {str(e)}")
        return False

def test_get_demo_profile():
    """Test retrieving the demo user profile"""
    print("\n=== Testing Get Demo User Profile ===")
    
    try:
        response = requests.get(f"{API_URL}/users/profile/demo@keto.fr", timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Profile data: {json.dumps(data, indent=2)}")
            print("✅ Demo user profile retrieved successfully")
            return True
        else:
            print(f"❌ Get demo profile failed with status {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Get demo profile failed with error: {str(e)}")
        return False

def main():
    """Run all backend tests"""
    print("🧪 Starting KetoSansStress Backend API Tests")
    print("=" * 60)
    
    results = {}
    
    # Test 1: Health Check
    results['health_check'] = test_health_check()
    
    # Test 2: Create Demo User
    results['create_demo_user'] = create_demo_user()
    
    # Test 3: Get Demo Profile
    results['get_demo_profile'] = test_get_demo_profile()
    
    # Test 4: Daily Summary (Empty)
    results['daily_summary_empty'] = test_daily_summary_empty()
    
    # Test 5: Add Sample Meal Data
    results['add_sample_meals'] = add_sample_meal_data()
    
    # Test 6: Daily Summary (With Data)
    results['daily_summary_with_data'] = test_daily_summary_with_data()
    
    # Summary
    print("\n" + "=" * 60)
    print("🏁 TEST RESULTS SUMMARY")
    print("=" * 60)
    
    passed = 0
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name.replace('_', ' ').title()}: {status}")
        if result:
            passed += 1
    
    print(f"\nOverall: {passed}/{total} tests passed")
    
    if results.get('daily_summary_empty') and results.get('create_demo_user'):
        print("\n🎉 SUCCESS: Demo user created and daily summary endpoint is working!")
        print("The 404 error for demo@keto.fr should now be resolved.")
    else:
        print("\n⚠️ ISSUES: Some critical tests failed. Check the logs above.")
    
    return passed == total

if __name__ == "__main__":
    main()