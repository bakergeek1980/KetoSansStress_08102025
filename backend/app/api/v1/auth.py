from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Dict, Any
from supabase import Client
from app.database.connection import get_supabase_client
from app.auth.dependencies import get_current_user, get_current_user_token
from app.database.schemas import User, UserCreate
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["Authentication"])

class UserRegistration(UserCreate):
    password: str = Field(..., min_length=8)
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        """Validate password strength"""
        import re
        
        if len(v) < 8:
            raise ValueError('Le mot de passe doit contenir au moins 8 caractères')
        
        # Check for lowercase
        if not re.search(r'[a-z]', v):
            raise ValueError('Le mot de passe doit contenir au moins une lettre minuscule')
            
        # Check for uppercase  
        if not re.search(r'[A-Z]', v):
            raise ValueError('Le mot de passe doit contenir au moins une lettre majuscule')
            
        # Check for digit
        if not re.search(r'\d', v):
            raise ValueError('Le mot de passe doit contenir au moins un chiffre')
            
        # Check for special character
        if not re.search(r'[!@#$%^&*()_+\-=\[\]{};\':"\\|,.<>\/?]', v):
            raise ValueError('Le mot de passe doit contenir au moins un caractère spécial (!@#$%^&*)')
            
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class PasswordReset(BaseModel):
    email: EmailStr

class PasswordUpdate(BaseModel):
    password: str

class EmailConfirmationRequest(BaseModel):
    token: str

class ResendConfirmationRequest(BaseModel):
    email: EmailStr

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register_user(
    user_data: UserRegistration,
    supabase: Client = Depends(get_supabase_client)
) -> Dict[str, Any]:
    """Register a new user with Supabase Auth."""
    try:
        # Create user with Supabase Auth
        auth_response = supabase.auth.sign_up({
            "email": user_data.email,
            "password": user_data.password,
            "options": {
                "data": {
                    "full_name": user_data.full_name,
                    "age": user_data.age,
                    "gender": user_data.gender,
                    "height": float(user_data.height),
                    "weight": float(user_data.weight),
                    "activity_level": user_data.activity_level,
                    "goal": user_data.goal
                }
            }
        })
        
        if auth_response.user:
            # Create user profile in database
            profile_data = {
                "id": auth_response.user.id,
                "email": user_data.email,
                "full_name": user_data.full_name,
                "age": user_data.age,
                "gender": user_data.gender,
                "height": float(user_data.height),
                "weight": float(user_data.weight),
                "activity_level": user_data.activity_level,
                "goal": user_data.goal,
                "timezone": user_data.timezone,
                "created_at": "now()",
                "updated_at": "now()"
            }
            
            try:
                profile_result = supabase.table("users").insert(profile_data).execute()
                logger.info(f"User profile created: {auth_response.user.id}")
            except Exception as e:
                logger.warning(f"Failed to create user profile: {e}")
            
            return {
                "message": "User registered successfully",
                "user_id": auth_response.user.id,
                "email": auth_response.user.email,
                "requires_verification": not auth_response.session
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Registration failed"
            )
            
    except Exception as e:
        logger.error(f"Registration error: {e}")
        if "already registered" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="User already exists"
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Registration failed: {str(e)}"
        )

@router.post("/login")
async def login_user(
    credentials: UserLogin,
    supabase: Client = Depends(get_supabase_client)
) -> Dict[str, Any]:
    """Authenticate user and return session tokens."""
    try:
        auth_response = supabase.auth.sign_in_with_password({
            "email": credentials.email,
            "password": credentials.password
        })
        
        if auth_response.session and auth_response.user:
            return {
                "access_token": auth_response.session.access_token,
                "refresh_token": auth_response.session.refresh_token,
                "expires_in": auth_response.session.expires_in,
                "user": {
                    "id": auth_response.user.id,
                    "email": auth_response.user.email,
                    "email_confirmed_at": auth_response.user.email_confirmed_at
                }
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
            
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed"
        )

@router.post("/logout")
async def logout_user(
    token: str = Depends(get_current_user_token),
    supabase: Client = Depends(get_supabase_client)
) -> Dict[str, str]:
    """Logout user and invalidate session."""
    try:
        # Set session before logout
        supabase.auth.set_session(token, "")
        supabase.auth.sign_out()
        
        return {"message": "Logged out successfully"}
        
    except Exception as e:
        logger.error(f"Logout error: {e}")
        return {"message": "Logout completed"}  # Always return success for logout

@router.post("/password-reset")
async def request_password_reset(
    reset_data: PasswordReset,
    supabase: Client = Depends(get_supabase_client)
) -> Dict[str, str]:
    """Send password reset email."""
    try:
        supabase.auth.reset_password_email(reset_data.email)
        return {"message": "Password reset email sent"}
        
    except Exception as e:
        logger.error(f"Password reset error: {e}")
        # Always return success to prevent email enumeration
        return {"message": "Password reset email sent"}

@router.get("/me")
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
) -> User:
    """Get current user information."""
    return current_user