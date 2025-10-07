from pydantic import BaseModel, EmailStr, validator, Field
from typing import Optional, List
from datetime import datetime, date, time
from decimal import Decimal
from enum import Enum

class GenderEnum(str, Enum):
    male = "male"
    female = "female"
    other = "other"

class ActivityLevelEnum(str, Enum):
    sedentary = "sedentary"
    lightly_active = "lightly_active"
    moderately_active = "moderately_active"
    very_active = "very_active"
    extremely_active = "extremely_active"

class GoalEnum(str, Enum):
    weight_loss = "weight_loss"
    weight_gain = "weight_gain"
    maintenance = "maintenance"
    muscle_gain = "muscle_gain"
    fat_loss = "fat_loss"

class MealTypeEnum(str, Enum):
    breakfast = "breakfast"
    lunch = "lunch"
    dinner = "dinner"
    snack = "snack"

# Base User models
class UserBase(BaseModel):
    email: EmailStr
    full_name: str = Field(..., min_length=1, max_length=255)
    age: Optional[int] = Field(None, gt=0, lt=150)  # Calculated from birth_date
    birth_date: date = Field(..., description="Date de naissance de l'utilisateur")
    gender: GenderEnum
    height: Decimal = Field(..., gt=0, decimal_places=2)  # cm
    weight: Decimal = Field(..., gt=0, decimal_places=2)  # kg
    activity_level: ActivityLevelEnum
    goal: GoalEnum
    timezone: str = "UTC"

class UserCreate(UserBase):
    pass

class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=1, max_length=255)
    age: Optional[int] = Field(None, gt=0, lt=150)
    birth_date: Optional[date] = Field(None, description="Date de naissance de l'utilisateur")
    gender: Optional[GenderEnum] = None
    height: Optional[Decimal] = Field(None, gt=0, decimal_places=2)
    weight: Optional[Decimal] = Field(None, gt=0, decimal_places=2)
    activity_level: Optional[ActivityLevelEnum] = None
    goal: Optional[GoalEnum] = None
    target_calories: Optional[int] = Field(None, gt=0)
    target_protein: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    target_carbs: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    target_fat: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    timezone: Optional[str] = None

class User(UserBase):
    id: str
    target_calories: Optional[int] = None
    target_protein: Optional[Decimal] = None
    target_carbs: Optional[Decimal] = None
    target_fat: Optional[Decimal] = None
    is_active: bool = True
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Meal models
class MealBase(BaseModel):
    meal_type: MealTypeEnum
    food_name: str = Field(..., min_length=1, max_length=255)
    brand: Optional[str] = Field(None, max_length=255)
    serving_size: Optional[str] = Field(None, max_length=100)
    quantity: Decimal = Field(..., gt=0, decimal_places=3)
    unit: str = Field(..., min_length=1, max_length=20)
    
    # Nutritional information
    calories: Optional[int] = Field(None, ge=0)
    protein: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    carbohydrates: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    total_fat: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    saturated_fat: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    fiber: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    sugar: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    sodium: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    potassium: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    
    # Context
    consumed_at: Optional[datetime] = None
    notes: Optional[str] = None
    preparation_method: Optional[str] = Field(None, max_length=100)

class MealCreate(MealBase):
    @validator('consumed_at', pre=True, always=True)
    def set_consumed_at(cls, v):
        return v or datetime.utcnow()

class MealUpdate(BaseModel):
    meal_type: Optional[MealTypeEnum] = None
    food_name: Optional[str] = Field(None, min_length=1, max_length=255)
    brand: Optional[str] = Field(None, max_length=255)
    serving_size: Optional[str] = Field(None, max_length=100)
    quantity: Optional[Decimal] = Field(None, gt=0, decimal_places=3)
    unit: Optional[str] = Field(None, min_length=1, max_length=20)
    calories: Optional[int] = Field(None, ge=0)
    protein: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    carbohydrates: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    total_fat: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    fiber: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    consumed_at: Optional[datetime] = None
    notes: Optional[str] = None

class Meal(MealBase):
    id: str
    user_id: str
    net_carbs: Optional[Decimal] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Daily summary models
class DailySummary(BaseModel):
    id: Optional[str] = None
    user_id: str
    summary_date: date
    total_calories: int = 0
    total_protein: Decimal = Field(default=0, decimal_places=2)
    total_carbohydrates: Decimal = Field(default=0, decimal_places=2)
    total_fat: Decimal = Field(default=0, decimal_places=2)
    total_net_carbs: Decimal = Field(default=0, decimal_places=2)
    total_fiber: Decimal = Field(default=0, decimal_places=2)
    protein_percentage: Optional[Decimal] = None
    carbs_percentage: Optional[Decimal] = None
    fat_percentage: Optional[Decimal] = None
    calories_goal: Optional[int] = None
    protein_goal: Optional[Decimal] = None
    carbs_goal: Optional[Decimal] = None
    fat_goal: Optional[Decimal] = None
    calories_achieved_percentage: Optional[Decimal] = None
    meals_logged: int = 0
    is_ketogenic_day: Optional[bool] = None
    water_intake_ml: int = 0
    exercise_minutes: int = 0
    steps_count: int = 0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Response models for API endpoints
class NutritionSummary(BaseModel):
    calories: int
    protein: Decimal
    carbohydrates: Decimal
    fat: Decimal
    net_carbs: Decimal
    fiber: Decimal
    protein_percentage: Decimal
    carbs_percentage: Decimal
    fat_percentage: Decimal