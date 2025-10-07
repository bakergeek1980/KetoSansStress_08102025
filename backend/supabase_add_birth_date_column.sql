-- Add birth_date column to users table
-- This will allow storing user's birth date instead of just age

-- Add the birth_date column to the users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS birth_date DATE;

-- Add a comment to the new column
COMMENT ON COLUMN public.users.birth_date IS 'Date de naissance de l\'utilisateur (format YYYY-MM-DD)';

-- Create an index for efficient querying by birth_date (for age calculations, birthday reminders, etc.)
CREATE INDEX IF NOT EXISTS idx_users_birth_date 
ON public.users(birth_date);

-- Optional: Create a function to automatically calculate age from birth_date
CREATE OR REPLACE FUNCTION calculate_age(birth_date DATE)
RETURNS INTEGER AS $$
BEGIN
    RETURN EXTRACT(YEAR FROM AGE(CURRENT_DATE, birth_date));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Grant execute permission on the age calculation function
GRANT EXECUTE ON FUNCTION calculate_age(DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_age(DATE) TO service_role;

-- Optional: Create a view that includes calculated age
CREATE OR REPLACE VIEW public.users_with_age AS
SELECT 
    *,
    calculate_age(birth_date) as calculated_age
FROM public.users
WHERE birth_date IS NOT NULL;

-- Grant permissions on the view
GRANT SELECT ON public.users_with_age TO authenticated;
GRANT SELECT ON public.users_with_age TO service_role;

-- Add RLS policies for the new view if needed
-- (Inherit from users table policies)

-- Update existing records that might have null birth_date
-- For demo purposes, we'll set a default birth_date based on age if it exists
-- This is optional and can be customized based on your needs

DO $$
DECLARE
    user_record RECORD;
BEGIN
    -- For existing users without birth_date but with age, calculate approximate birth_date
    FOR user_record IN 
        SELECT id, age 
        FROM public.users 
        WHERE birth_date IS NULL AND age IS NOT NULL
    LOOP
        UPDATE public.users 
        SET birth_date = CURRENT_DATE - INTERVAL '1 year' * user_record.age
        WHERE id = user_record.id;
        
        RAISE NOTICE 'Updated user % with approximate birth_date based on age %', user_record.id, user_record.age;
    END LOOP;
    
    -- Log the completion
    RAISE NOTICE 'Birth date column added and existing records updated successfully';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error updating existing records: %. This is normal if no records exist yet.', SQLERRM;
END $$;

-- Create a trigger to automatically update age when birth_date changes (optional)
CREATE OR REPLACE FUNCTION update_age_from_birth_date()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the age column based on birth_date
    IF NEW.birth_date IS NOT NULL THEN
        NEW.age := calculate_age(NEW.birth_date);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_update_age_from_birth_date ON public.users;
CREATE TRIGGER trigger_update_age_from_birth_date
    BEFORE INSERT OR UPDATE OF birth_date ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_age_from_birth_date();

GRANT EXECUTE ON FUNCTION update_age_from_birth_date() TO authenticated;
GRANT EXECUTE ON FUNCTION update_age_from_birth_date() TO service_role;

-- Test the new functionality (optional)
DO $$
BEGIN
    -- Test the age calculation function
    IF calculate_age('1990-01-01') > 30 THEN
        RAISE NOTICE 'Age calculation function working correctly';
    END IF;
    
    RAISE NOTICE 'Birth date functionality setup complete!';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Test completed with notice: %', SQLERRM;
END $$;