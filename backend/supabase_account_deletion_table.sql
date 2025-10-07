-- Account Deletion Requests Table
-- This table stores temporary deletion requests with secure tokens
-- Required for the new secure account deletion with email confirmation system

CREATE TABLE IF NOT EXISTS public.account_deletion_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,  -- Using TEXT instead of UUID for compatibility
    deletion_token TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL,
    full_name TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_account_deletion_requests_token 
ON public.account_deletion_requests(deletion_token);

-- Create index for cleanup of expired requests
CREATE INDEX IF NOT EXISTS idx_account_deletion_requests_expires_at 
ON public.account_deletion_requests(expires_at);

-- Create index for user_id lookups
CREATE INDEX IF NOT EXISTS idx_account_deletion_requests_user_id 
ON public.account_deletion_requests(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only allow service role to access this table
-- (since this is a backend-only table for security purposes)
CREATE POLICY "Service role can manage deletion requests" 
ON public.account_deletion_requests
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- Grant permissions to service role
GRANT ALL ON public.account_deletion_requests TO service_role;

-- Grant permissions to authenticated role for backend operations
GRANT ALL ON public.account_deletion_requests TO authenticated;

-- Optional: Create a function to automatically clean up expired requests
CREATE OR REPLACE FUNCTION cleanup_expired_deletion_requests()
RETURNS void AS $$
BEGIN
    DELETE FROM public.account_deletion_requests 
    WHERE expires_at < NOW();
    
    -- Log cleanup activity
    RAISE NOTICE 'Cleaned up expired account deletion requests';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the cleanup function
GRANT EXECUTE ON FUNCTION cleanup_expired_deletion_requests() TO service_role;

COMMENT ON TABLE public.account_deletion_requests IS 'Stores temporary account deletion requests with secure tokens for email confirmation workflow';
COMMENT ON COLUMN public.account_deletion_requests.deletion_token IS 'Secure token sent via email for deletion confirmation';
COMMENT ON COLUMN public.account_deletion_requests.expires_at IS 'Token expiration time (24 hours from creation)';
COMMENT ON COLUMN public.account_deletion_requests.user_id IS 'ID of the user requesting account deletion';
COMMENT ON COLUMN public.account_deletion_requests.email IS 'Email address where confirmation was sent';
COMMENT ON COLUMN public.account_deletion_requests.full_name IS 'Full name of user for email personalization';

-- Insert a test record to verify table creation (will be cleaned up automatically)
DO $$ 
BEGIN
    INSERT INTO public.account_deletion_requests (
        user_id, 
        deletion_token, 
        email, 
        full_name, 
        expires_at
    ) VALUES (
        'test-user-id', 
        'test-token-' || extract(epoch from now()), 
        'test@example.com', 
        'Test User', 
        NOW() + INTERVAL '1 minute'
    );
    
    RAISE NOTICE 'Test record inserted successfully - table creation verified';
    
    -- Clean up test record immediately
    DELETE FROM public.account_deletion_requests WHERE user_id = 'test-user-id';
    RAISE NOTICE 'Test record cleaned up - table is ready for production use';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error during table verification: %', SQLERRM;
END $$;