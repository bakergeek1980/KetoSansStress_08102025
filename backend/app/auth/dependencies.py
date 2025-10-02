from typing import Optional, Annotated
from fastapi import Depends, HTTPException, status, Header
from jose import JWTError, jwt
from supabase import Client
from app.config import settings
from app.database.connection import get_supabase_client
from app.database.schemas import User
import logging
import requests
import json

logger = logging.getLogger(__name__)

class AuthenticationError(Exception):
    pass

def extract_token_from_header(authorization: Annotated[str, Header()]) -> str:
    """Extract JWT token from Authorization header."""
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    return authorization.split(" ")[1]

def get_jwks_key(token: str) -> dict:
    """Get the public key from JWKS endpoint based on token's kid."""
    try:
        # Get the header to extract kid
        header = jwt.get_unverified_header(token)
        kid = header.get("kid")
        
        if not kid:
            logger.warning("JWT token missing kid in header")
            return None
        
        # Construct JWKS URL from Supabase URL
        jwks_url = f"{settings.supabase_url}/auth/v1/.well-known/jwks.json"
        
        # Fetch JWKS
        response = requests.get(jwks_url, timeout=10)
        if response.status_code != 200:
            logger.error(f"Failed to fetch JWKS: {response.status_code}")
            return None
        
        jwks = response.json()
        
        # Find the key with matching kid
        for key in jwks.get("keys", []):
            if key.get("kid") == kid:
                return key
        
        logger.warning(f"No key found for kid: {kid}")
        return None
        
    except Exception as e:
        logger.error(f"Error fetching JWKS key: {e}")
        return None

def validate_jwt_token(token: str) -> dict:
    """Validate JWT token and return payload."""
    try:
        # First, try to get the header to determine the algorithm
        header = jwt.get_unverified_header(token)
        algorithm = header.get("alg", "HS256")
        
        # If it's HS256, use the JWT secret
        if algorithm == "HS256":
            if not settings.supabase_jwt_secret or settings.supabase_jwt_secret == "JWT_SECRET_PLACEHOLDER":
                logger.warning("JWT secret not configured properly")
                raise AuthenticationError("JWT secret not configured")
            
            payload = jwt.decode(
                token,
                settings.supabase_jwt_secret,
                algorithms=["HS256"],
                options={
                    "verify_signature": True,
                    "verify_exp": True,
                    "verify_aud": False,
                    "verify_iss": False
                }
            )
        else:
            # For other algorithms (like ES256), get the public key from JWKS
            key = get_jwks_key(token)
            if not key:
                raise AuthenticationError("Unable to get verification key")
            
            payload = jwt.decode(
                token,
                key,
                algorithms=[algorithm],
                options={
                    "verify_signature": True,
                    "verify_exp": True,
                    "verify_aud": False,
                    "verify_iss": False
                }
            )
        
        user_id = payload.get("sub")
        if not user_id:
            raise AuthenticationError("Invalid token: missing user ID")
        
        logger.debug(f"JWT validation successful for user: {user_id}")
        return payload
        
    except JWTError as e:
        error_msg = str(e).lower()
        if "expired" in error_msg:
            logger.warning("JWT token has expired")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired",
                headers={"WWW-Authenticate": "Bearer"}
            )
        elif "audience" in error_msg:
            logger.warning("JWT token has invalid audience")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token audience",
                headers={"WWW-Authenticate": "Bearer"}
            )
        elif "signature" in error_msg:
            logger.warning("JWT signature verification failed")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token signature",
                headers={"WWW-Authenticate": "Bearer"}
            )
        else:
            logger.warning(f"JWT validation failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
                headers={"WWW-Authenticate": "Bearer"}
            )
        logger.warning(f"JWT validation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"}
        )
    except Exception as e:
        logger.error(f"Unexpected error during JWT validation: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed",
            headers={"WWW-Authenticate": "Bearer"}
        )

async def get_current_user_token(
    authorization: Annotated[str, Header()] = None
) -> str:
    """Dependency to extract and validate user token."""
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization required"
        )
    
    token = extract_token_from_header(authorization)
    validate_jwt_token(token)
    return token

async def get_authenticated_supabase_client(
    token: Annotated[str, Depends(get_current_user_token)]
) -> Client:
    """Get Supabase client with user authentication."""
    try:
        client = get_supabase_client()
        
        # Set session with the user's token
        try:
            client.auth.set_session(token, "")
            client.postgrest.auth(token)
        except Exception as e:
            logger.warning(f"Failed to set auth session: {e}")
            # Continue without auth session for now
        
        return client
        
    except Exception as e:
        logger.error(f"Failed to create authenticated client: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication service unavailable"
        )

async def get_current_user(
    token: Annotated[str, Depends(get_current_user_token)],
    supabase: Client = Depends(get_authenticated_supabase_client)
) -> User:
    """Get current authenticated user information."""
    try:
        payload = validate_jwt_token(token)
        user_id = payload.get("sub", "demo-user-id")
        email = payload.get("email", "demo@keto.fr")
        
        # Try to fetch user profile from Supabase
        try:
            result = supabase.table("users").select("*").eq("id", user_id).execute()
            
            if result.data:
                return User(**result.data[0])
        except Exception as e:
            logger.warning(f"Failed to fetch user from Supabase: {e}")
        
        # Return demo user if database fetch fails
        return User(
            id=user_id,
            email=email,
            full_name="Demo User",
            age=30,
            gender="male", 
            height=175.0,
            weight=70.0,
            activity_level="moderately_active",
            goal="maintenance",
            target_calories=2000,
            target_protein=100.0,
            target_carbs=25.0,
            target_fat=150.0,
            created_at="2025-01-01T00:00:00Z",
            updated_at="2025-01-01T00:00:00Z"
        )
        
    except Exception as e:
        logger.error(f"Failed to get current user: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user session"
        )

# Optional authentication for endpoints that work with or without auth
async def get_current_user_optional(
    authorization: Annotated[str, Header()] = None
) -> Optional[User]:
    """Optional authentication dependency."""
    if not authorization:
        return None
    
    try:
        token = extract_token_from_header(authorization)
        return await get_current_user(token)
    except HTTPException:
        return None