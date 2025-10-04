-- KetoSansStress - Test Data for Supabase
-- Execute this AFTER creating the main schema

-- Insert demo user (using a test UUID - replace with actual user ID from auth.users after registration)
-- This is for testing purposes only. In production, users are created through the registration endpoint.

-- Note: Replace 'demo-user-uuid-here' with the actual UUID from auth.users table
-- You can get this by first registering a user through /api/auth/register endpoint
-- then checking the auth.users table for the generated UUID

-- Example demo user data (uncomment and modify UUIDs as needed):
/*
INSERT INTO public.users (
    id, 
    email, 
    full_name, 
    age, 
    gender, 
    height, 
    weight, 
    activity_level, 
    goal,
    target_calories,
    target_protein,
    target_carbs,
    target_fat,
    timezone
) VALUES (
    'demo-user-uuid-here', -- Replace with actual auth.users UUID
    'demo@ketosansstress.com',
    'Marie Dubois',
    30,
    'female',
    170.00,
    70.00,
    'moderately_active',
    'weight_loss',
    1781,
    89.00,
    22.00,
    148.00,
    'Europe/Paris'
) ON CONFLICT (id) DO UPDATE SET
    target_calories = EXCLUDED.target_calories,
    target_protein = EXCLUDED.target_protein,
    target_carbs = EXCLUDED.target_carbs,
    target_fat = EXCLUDED.target_fat;
*/

-- Example meal data (uncomment and modify user_id as needed):
/*
INSERT INTO public.meals (
    user_id,
    meal_type,
    food_name,
    brand,
    serving_size,
    quantity,
    unit,
    calories,
    protein,
    carbohydrates,
    total_fat,
    saturated_fat,
    fiber,
    sugar,
    sodium,
    consumed_at,
    notes
) VALUES 
-- Breakfast
(
    'demo-user-uuid-here', -- Replace with actual user UUID
    'breakfast',
    'Œufs brouillés au beurre',
    NULL,
    '2 œufs + 10g beurre',
    1.0,
    'portion',
    220,
    13.0,
    1.0,
    18.0,
    8.0,
    0.0,
    1.0,
    200.0,
    NOW() - INTERVAL '2 hours',
    'Petit-déjeuner cétogène'
),
-- Lunch  
(
    'demo-user-uuid-here', -- Replace with actual user UUID
    'lunch',
    'Salade de saumon aux épinards',
    NULL,
    '150g saumon + 100g épinards + 15ml huile olive',
    1.0,
    'portion',
    380,
    28.0,
    4.0,
    28.0,
    5.0,
    2.5,
    1.5,
    300.0,
    NOW() - INTERVAL '4 hours',
    'Déjeuner keto'
),
-- Dinner
(
    'demo-user-uuid-here', -- Replace with actual user UUID
    'dinner',
    'Poulet grillé aux brocolis',
    NULL,
    '120g poulet + 150g brocolis + 20g fromage',
    1.0,
    'portion',
    320,
    35.0,
    8.0,
    15.0,
    8.0,
    3.0,
    2.0,
    400.0,
    NOW() - INTERVAL '1 hour',
    'Dîner faible en glucides'
),
-- Snack
(
    'demo-user-uuid-here', -- Replace with actual user UUID
    'snack',
    'Avocat aux noix',
    NULL,
    '1/2 avocat + 30g noix',
    1.0,
    'portion',
    280,
    6.0,
    8.0,
    26.0,
    4.0,
    6.0,
    1.5,
    5.0,
    NOW() - INTERVAL '3 hours',
    'Collation cétogène'
);
*/

-- You can also create a daily summary after inserting meals:
/*
INSERT INTO public.daily_summaries (
    user_id,
    summary_date,
    total_calories,
    total_protein,
    total_carbohydrates,
    total_fat,
    total_net_carbs,
    total_fiber,
    protein_percentage,
    carbs_percentage,
    fat_percentage,
    calories_goal,
    protein_goal,
    carbs_goal,
    fat_goal,
    calories_achieved_percentage,
    meals_logged,
    is_ketogenic_day,
    water_intake_ml
) VALUES (
    'demo-user-uuid-here', -- Replace with actual user UUID
    CURRENT_DATE,
    1200,
    82.0,
    21.0,
    87.0,
    12.5,  -- net carbs (21 - 8.5 fiber)
    8.5,
    27.3,  -- protein percentage
    7.0,   -- carbs percentage  
    65.25, -- fat percentage
    1781,  -- target calories
    89.0,  -- target protein
    22.0,  -- target carbs
    148.0, -- target fat
    67.4,  -- calories achieved %
    4,     -- meals logged
    true,  -- is ketogenic day
    2000   -- water intake in ml
);
*/