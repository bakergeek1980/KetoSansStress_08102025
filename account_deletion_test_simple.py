#!/usr/bin/env python3
"""
Simple Account Deletion System Test
Focus on testing the new endpoints and identifying issues
"""

import requests
import json
from datetime import datetime

BASE_URL = "https://keto-journey-1.preview.emergentagent.com/api"

def test_account_deletion_endpoints():
    """Test the account deletion endpoints to identify issues"""
    print("🧪 TESTING ACCOUNT DELETION SYSTEM")
    print("=" * 50)
    
    results = []
    
    # Test 1: Test confirm-account-deletion endpoint structure
    print("\n1. Testing confirm-account-deletion endpoint structure...")
    try:
        response = requests.post(f"{BASE_URL}/auth/confirm-account-deletion", 
                               json={"token": "test_token"})
        
        if response.status_code == 500:
            error_data = response.json()
            if "account_deletion_requests" in str(error_data):
                print("✅ CRITICAL FINDING: Missing 'account_deletion_requests' table in Supabase")
                results.append({
                    "test": "Database Schema Check",
                    "status": "CRITICAL_ISSUE",
                    "finding": "Missing 'account_deletion_requests' table in Supabase database"
                })
            else:
                print(f"❌ Unexpected error: {error_data}")
        else:
            print(f"⚠️ Unexpected status code: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Request failed: {e}")
    
    # Test 2: Test request-account-deletion without auth
    print("\n2. Testing request-account-deletion security...")
    try:
        response = requests.post(f"{BASE_URL}/auth/request-account-deletion")
        
        if response.status_code == 401:
            print("✅ SECURITY: Correctly requires authentication")
            results.append({
                "test": "Authentication Security",
                "status": "WORKING",
                "finding": "Endpoint correctly requires authentication"
            })
        else:
            print(f"❌ Security issue: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Request failed: {e}")
    
    # Test 3: Test deprecated DELETE endpoint
    print("\n3. Testing deprecated DELETE /auth/account...")
    try:
        response = requests.delete(f"{BASE_URL}/auth/account")
        
        if response.status_code == 401:
            print("✅ SECURITY: Requires authentication (expected)")
            results.append({
                "test": "Deprecated Endpoint Security",
                "status": "WORKING",
                "finding": "Deprecated endpoint requires authentication"
            })
        elif response.status_code == 400:
            error_data = response.json()
            if "confirmation par email" in error_data.get("detail", "").lower():
                print("✅ DEPRECATION: Correctly redirects to email confirmation")
                results.append({
                    "test": "Endpoint Deprecation",
                    "status": "WORKING",
                    "finding": "Direct deletion correctly deprecated"
                })
        else:
            print(f"⚠️ Unexpected response: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Request failed: {e}")
    
    # Test 4: Test invalid token handling
    print("\n4. Testing invalid token handling...")
    try:
        invalid_tokens = ["", "invalid", "a"*100]
        for token in invalid_tokens:
            response = requests.post(f"{BASE_URL}/auth/confirm-account-deletion", 
                                   json={"token": token})
            
            if response.status_code == 500:
                error_data = response.json()
                if "account_deletion_requests" in str(error_data):
                    print(f"✅ Token '{token[:10]}...' - Blocked by missing table (expected)")
                else:
                    print(f"❌ Unexpected error for token '{token[:10]}...': {error_data}")
            elif response.status_code in [400, 404]:
                print(f"✅ Token '{token[:10]}...' - Correctly rejected")
            else:
                print(f"⚠️ Token '{token[:10]}...' - Unexpected: {response.status_code}")
                
    except Exception as e:
        print(f"❌ Request failed: {e}")
    
    # Summary
    print("\n" + "=" * 50)
    print("🔍 SUMMARY OF FINDINGS")
    print("=" * 50)
    
    critical_issues = [r for r in results if r["status"] == "CRITICAL_ISSUE"]
    working_features = [r for r in results if r["status"] == "WORKING"]
    
    if critical_issues:
        print("\n❌ CRITICAL ISSUES FOUND:")
        for issue in critical_issues:
            print(f"   • {issue['test']}: {issue['finding']}")
    
    if working_features:
        print("\n✅ WORKING FEATURES:")
        for feature in working_features:
            print(f"   • {feature['test']}: {feature['finding']}")
    
    print(f"\n📊 OVERALL STATUS:")
    print(f"   • Critical Issues: {len(critical_issues)}")
    print(f"   • Working Features: {len(working_features)}")
    
    if critical_issues:
        print("\n🚨 ACTION REQUIRED:")
        print("   1. Create 'account_deletion_requests' table in Supabase")
        print("   2. Execute the SQL schema for account deletion functionality")
        print("   3. Test with authenticated user after table creation")
    
    return results

if __name__ == "__main__":
    test_account_deletion_endpoints()