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
    confirm_email: bool = False,
    supabase: Client = Depends(get_supabase_client)
) -> Dict[str, Any]:
    """Register a new user with Supabase Auth."""
    try:
        # Préparer les options pour Supabase
        auth_options = {
            "data": {
                "full_name": user_data.full_name,
                "age": user_data.age,
                "gender": user_data.gender,
                "height": float(user_data.height),
                "weight": float(user_data.weight),
                "activity_level": user_data.activity_level,
                "goal": user_data.goal,
                "timezone": user_data.timezone,
            }
        }
        
        # Si confirmation email activée, ajouter l'URL de redirection
        if confirm_email:
            auth_options["redirect_to"] = "https://ketosansstress.app/confirm"
            auth_options["email_redirect_to"] = "https://ketosansstress.app/confirm"

        # Register user with Supabase Auth
        auth_response = supabase.auth.sign_up({
            "email": user_data.email,
            "password": user_data.password,
            "options": auth_options
        })

        if auth_response.user:
            # Vérifier si l'email nécessite une confirmation
            needs_email_confirmation = not auth_response.user.email_confirmed_at and confirm_email
            
            # Si pas de confirmation nécessaire, créer le profil immédiatement
            if not needs_email_confirmation:
                # Create user profile in our users table
                user_profile_data = {
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
                    profile_result = supabase.table("users").insert(user_profile_data).execute()
                    logger.info(f"User profile created: {auth_response.user.id}")
                except Exception as e:
                    logger.warning(f"Failed to create user profile: {e}")

            return {
                "message": "User registered successfully" if not needs_email_confirmation else "Registration successful - email confirmation required",
                "user_id": auth_response.user.id,
                "email": user_data.email,
                "needs_email_confirmation": needs_email_confirmation
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create user account"
            )

    except Exception as e:
        logger.error(f"Registration error: {e}")
        if "User already registered" in str(e):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="User already exists"
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed"
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

@router.post("/confirm-email")
async def confirm_email(
    request: EmailConfirmationRequest,
    supabase: Client = Depends(get_supabase_client)
):
    """Confirm user email with token."""
    try:
        # Vérifier le token avec Supabase
        result = supabase.auth.verify_otp({
            'token_hash': request.token,
            'type': 'email'
        })
        
        if result.user:
            return {"message": "Email confirmed successfully", "user_id": result.user.id}
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired confirmation token"
            )
    except Exception as e:
        logger.error(f"Email confirmation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired confirmation token"
        )

@router.post("/resend-confirmation")
async def resend_confirmation_email(
    request: ResendConfirmationRequest,
    supabase: Client = Depends(get_supabase_client)
):
    """Resend email confirmation."""
    try:
        # Utiliser Supabase pour renvoyer l'email de confirmation
        result = supabase.auth.resend({
            'type': 'signup',
            'email': request.email,
            'options': {
                'redirect_to': 'https://ketosansstress.app/confirm'
            }
        })
        
        return {"message": "Confirmation email sent if account exists"}
    except Exception as e:
        logger.error(f"Resend confirmation error: {e}")
        # Ne pas révéler si l'email existe ou non pour des raisons de sécurité
        return {"message": "Confirmation email sent if account exists"}

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