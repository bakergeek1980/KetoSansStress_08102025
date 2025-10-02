from fastapi import APIRouter, Depends, HTTPException, status, Query
from supabase import Client
from typing import List, Optional, Dict, Any
from datetime import date, datetime, timedelta
from app.database.schemas import Meal, MealCreate, MealUpdate, User, DailySummary
from app.auth.dependencies import get_current_user, get_authenticated_supabase_client
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/meals", tags=["Meal Tracking"])

def calculate_daily_summary(meals: List[Dict[str, Any]], user: User) -> DailySummary:
    """Calculate daily nutrition summary from meals."""
    total_calories = sum(meal.get("calories", 0) * meal.get("quantity", 1) for meal in meals)
    total_protein = sum(meal.get("protein", 0) * meal.get("quantity", 1) for meal in meals)
    total_carbohydrates = sum(meal.get("carbohydrates", 0) * meal.get("quantity", 1) for meal in meals)
    total_fat = sum(meal.get("total_fat", 0) * meal.get("quantity", 1) for meal in meals)
    total_fiber = sum(meal.get("fiber", 0) * meal.get("quantity", 1) for meal in meals)
    
    total_net_carbs = total_carbohydrates - total_fiber
    
    # Calculate percentages
    protein_percentage = (total_protein * 4 / total_calories * 100) if total_calories > 0 else 0
    carbs_percentage = (total_carbohydrates * 4 / total_calories * 100) if total_calories > 0 else 0
    fat_percentage = (total_fat * 9 / total_calories * 100) if total_calories > 0 else 0
    
    # Ketogenic day determination
    is_ketogenic_day = total_net_carbs <= 20 and carbs_percentage <= 10
    
    return DailySummary(
        user_id=user.id,
        summary_date=date.today(),
        total_calories=int(total_calories),
        total_protein=round(total_protein, 2),
        total_carbohydrates=round(total_carbohydrates, 2),
        total_fat=round(total_fat, 2),
        total_net_carbs=round(total_net_carbs, 2),
        total_fiber=round(total_fiber, 2),
        protein_percentage=round(protein_percentage, 2),
        carbs_percentage=round(carbs_percentage, 2),
        fat_percentage=round(fat_percentage, 2),
        calories_goal=user.target_calories,
        protein_goal=user.target_protein,
        carbs_goal=user.target_carbs,
        fat_goal=user.target_fat,
        calories_achieved_percentage=round((total_calories / user.target_calories * 100) if user.target_calories else 0, 2),
        meals_logged=len(meals),
        is_ketogenic_day=is_ketogenic_day
    )

@router.post("/", response_model=Meal, status_code=status.HTTP_201_CREATED)
async def create_meal(
    meal_data: MealCreate,
    current_user: User = Depends(get_current_user),
    supabase: Client = Depends(get_authenticated_supabase_client)
) -> Meal:
    """Create a new meal entry."""
    try:
        # Prepare meal data
        meal_dict = meal_data.dict()
        meal_dict["user_id"] = current_user.id
        
        # Convert datetime to ISO string if present
        if meal_dict.get("consumed_at"):
            meal_dict["consumed_at"] = meal_dict["consumed_at"].isoformat()
        
        # Convert Decimal fields to float for Supabase
        for field in ["quantity", "protein", "carbohydrates", "total_fat", "saturated_fat", "fiber", "sugar", "sodium", "potassium"]:
            if meal_dict.get(field) is not None:
                meal_dict[field] = float(meal_dict[field])
        
        # Insert meal
        result = supabase.table("meals").insert(meal_dict).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create meal"
            )
        
        return Meal(**result.data[0])
        
    except Exception as e:
        logger.error(f"Meal creation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create meal"
        )

@router.get("/", response_model=List[Meal])
async def get_meals(
    date_from: Optional[date] = Query(None, description="Start date for meal filtering"),
    date_to: Optional[date] = Query(None, description="End date for meal filtering"),
    meal_type: Optional[str] = Query(None, description="Filter by meal type"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of meals to return"),
    offset: int = Query(0, ge=0, description="Number of meals to skip"),
    current_user: User = Depends(get_current_user),
    supabase: Client = Depends(get_authenticated_supabase_client)
) -> List[Meal]:
    """Get user's meals with optional filtering."""
    try:
        query = supabase.table("meals").select("*").eq("user_id", current_user.id)
        
        # Apply filters
        if date_from:
            query = query.gte("consumed_at", date_from.isoformat())
        if date_to:
            # Add one day to include the entire end date
            end_date = date_to + timedelta(days=1)
            query = query.lt("consumed_at", end_date.isoformat())
        if meal_type:
            query = query.eq("meal_type", meal_type)
        
        # Apply pagination and ordering
        result = query.order("consumed_at", desc=True).range(offset, offset + limit - 1).execute()
        
        return [Meal(**meal) for meal in result.data]
        
    except Exception as e:
        logger.error(f"Meals retrieval error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve meals"
        )

@router.get("/daily-summary/{user_email}")
async def get_daily_summary(
    user_email: str,
    target_date: Optional[date] = Query(default=None, description="Date for summary (defaults to today)")
) -> Dict[str, Any]:
    """Get daily nutrition summary for a user."""
    try:
        if target_date is None:
            target_date = date.today()
        
        # Create a demo summary for now
        # In production, this would fetch real data from Supabase
        demo_summary = {
            "date": target_date.isoformat(),
            "totals": {
                "calories": 1520.0,
                "proteins": 78.0,
                "carbs": 30.0,
                "net_carbs": 18.0,
                "fats": 115.0,
                "fiber": 12.0
            },
            "targets": {
                "calories": 2000,
                "proteins": 100,
                "carbs": 25,
                "fats": 150
            },
            "percentages": {
                "calories": 76.0,
                "proteins": 78.0,
                "carbs": 120.0,
                "fats": 76.7
            },
            "macros_percentages": {
                "calories": 76.4,
                "proteins": 87.6,
                "fats": 82.4
            },
            "meals_count": 3,
            "keto_status": "excellent"
        }
        
        return demo_summary
        
    except Exception as e:
        logger.error(f"Daily summary error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve daily summary"
        )

@router.get("/today", response_model=List[Meal])
async def get_todays_meals(
    current_user: User = Depends(get_current_user),
    supabase: Client = Depends(get_authenticated_supabase_client)
) -> List[Meal]:
    """Get today's meals organized by meal type."""
    try:
        today = date.today()
        tomorrow = today + timedelta(days=1)
        
        result = supabase.table("meals").select("*").eq(
            "user_id", current_user.id
        ).gte("consumed_at", today.isoformat()).lt(
            "consumed_at", tomorrow.isoformat()
        ).order("consumed_at").execute()
        
        return [Meal(**meal) for meal in result.data]
        
    except Exception as e:
        logger.error(f"Today's meals retrieval error: {e}")
        # Return empty list if there's an error
        return []