#!/usr/bin/env python3
"""
Debug JWT token to understand the structure and signature
"""

import requests
import json
import base64
from jose import jwt

# Get a token first
BACKEND_URL = "https://ketodash.preview.emergentagent.com/api"
DEMO_EMAIL = "demo@keto.fr"
DEMO_PASSWORD = "demo123456"

def get_token():
    """Get a JWT token from login"""
    login_data = {
        "email": DEMO_EMAIL,
        "password": DEMO_PASSWORD
    }
    
    response = requests.post(
        f"{BACKEND_URL}/auth/login",
        json=login_data,
        headers={"Content-Type": "application/json"},
        timeout=10
    )
    
    if response.status_code == 200:
        data = response.json()
        return data.get("access_token")
    else:
        print(f"Login failed: {response.status_code} - {response.text}")
        return None

def decode_jwt_without_verification(token):
    """Decode JWT without signature verification to see structure"""
    try:
        # Decode without verification
        payload = jwt.get_unverified_claims(token)
        header = jwt.get_unverified_header(token)
        
        print("JWT Header:")
        print(json.dumps(header, indent=2))
        print("\nJWT Payload:")
        print(json.dumps(payload, indent=2))
        
        return header, payload
    except Exception as e:
        print(f"Failed to decode JWT: {e}")
        return None, None

def test_jwks_verification(token):
    """Test JWT verification using JWKS"""
    try:
        # Get header
        header = jwt.get_unverified_header(token)
        kid = header.get("kid")
        algorithm = header.get("alg", "HS256")
        
        print(f"Token algorithm: {algorithm}")
        print(f"Token kid: {kid}")
        
        # Fetch JWKS
        jwks_url = "https://vvpscheyjjqavfljpnxf.supabase.co/auth/v1/.well-known/jwks.json"
        response = requests.get(jwks_url, timeout=10)
        
        if response.status_code != 200:
            print(f"❌ Failed to fetch JWKS: {response.status_code}")
            return None
        
        jwks = response.json()
        print(f"JWKS keys available: {[key.get('kid') for key in jwks.get('keys', [])]}")
        
        # Find matching key
        key = None
        for jwk in jwks.get("keys", []):
            if jwk.get("kid") == kid:
                key = jwk
                break
        
        if not key:
            print(f"❌ No key found for kid: {kid}")
            return None
        
        print(f"Found matching key: {key}")
        
        # Try to verify with the key
        payload = jwt.decode(
            token,
            key,
            algorithms=[algorithm],
            options={
                "verify_signature": True,
                "verify_exp": False,
                "verify_aud": False,
                "verify_iss": False
            }
        )
        
        print("✅ SUCCESS with JWKS key!")
        print("Decoded payload:")
        print(json.dumps(payload, indent=2))
        return key
        
    except Exception as e:
        print(f"❌ JWKS verification failed: {e}")
        return None

def test_different_secrets(token):
    """Test different possible JWT secrets"""
    secrets_to_try = [
        "63f08a4d-5168-4ea6-95c2-3e468a03b98c",  # Current secret
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2cHNjaGV5ampxYXZmbGpwbnhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MTQwMzMsImV4cCI6MjA3NDk5MDAzM30.Wcm8bkPL3m7C-qjqyA0OwHU-c2b-LGN7PvmTWrwofyw",  # Anon key
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2cHNjaGV5ampxYXZmbGpwbnhmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTQxNDAzMywiZXhwIjoyMDc0OTkwMDMzfQ.qHvNPvTbhDgsccrgYF3YVxLSQcoI0To7nTNL7vMl1h0",  # Service role key
    ]
    
    for i, secret in enumerate(secrets_to_try):
        print(f"\nTrying secret {i+1}: {secret[:20]}...")
        try:
            payload = jwt.decode(
                token,
                secret,
                algorithms=["HS256"],
                options={
                    "verify_signature": True,
                    "verify_exp": False,  # Don't check expiration for testing
                    "verify_aud": False,
                    "verify_iss": False
                }
            )
            print(f"✅ SUCCESS with secret {i+1}!")
            print("Decoded payload:")
            print(json.dumps(payload, indent=2))
            return secret
        except Exception as e:
            print(f"❌ Failed with secret {i+1}: {e}")
    
    return None

if __name__ == "__main__":
    print("🔍 JWT Token Debug Tool")
    print("=" * 50)
    
    # Get token
    print("Getting JWT token...")
    token = get_token()
    
    if not token:
        print("Failed to get token")
        exit(1)
    
    print(f"Token received: {token[:50]}...")
    
    # Decode without verification
    print("\n" + "=" * 50)
    print("Decoding JWT without verification...")
    header, payload = decode_jwt_without_verification(token)
    
    # Test JWKS verification
    print("\n" + "=" * 50)
    print("Testing JWKS verification...")
    jwks_key = test_jwks_verification(token)
    
    # Test different secrets
    print("\n" + "=" * 50)
    print("Testing different JWT secrets...")
    working_secret = test_different_secrets(token)
    
    if jwks_key:
        print(f"\n🎉 Found working JWKS key!")
    elif working_secret:
        print(f"\n🎉 Found working secret: {working_secret}")
    else:
        print("\n❌ No working verification method found")