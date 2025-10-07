-- Account Deletion Requests Table
-- This table stores temporary deletion requests with secure tokens
-- Required for the new secure account deletion with email confirmation system

CREATE TABLE IF NOT EXISTS public.account_deletion_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    deletion_token TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL,
    full_name TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key constraint (optional, depends on your users table structure)
    -- FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_account_deletion_requests_token 
ON public.account_deletion_requests(deletion_token);

-- Create index for cleanup of expired requests
CREATE INDEX IF NOT EXISTS idx_account_deletion_requests_expires_at 
ON public.account_deletion_requests(expires_at);

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

-- Optional: Create a function to automatically clean up expired requests
CREATE OR REPLACE FUNCTION cleanup_expired_deletion_requests()
RETURNS void AS $$
BEGIN
    DELETE FROM public.account_deletion_requests 
    WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Optional: Create a scheduled job to run cleanup (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-expired-deletions', '0 * * * *', 'SELECT cleanup_expired_deletion_requests();');

COMMENT ON TABLE public.account_deletion_requests IS 'Stores temporary account deletion requests with secure tokens for email confirmation workflow';
COMMENT ON COLUMN public.account_deletion_requests.deletion_token IS 'Secure token sent via email for deletion confirmation';
COMMENT ON COLUMN public.account_deletion_requests.expires_at IS 'Token expiration time (24 hours from creation)';