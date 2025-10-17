-- ================================================
-- DISABLE EMAIL CONFIRMATION FOR TESTING
-- Run this in Supabase SQL Editor
-- ================================================

-- This will allow users to log in immediately without email confirmation
-- For production, you should keep email confirmation enabled

-- Update the auth.users table to mark all users as confirmed
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- For your specific email if it exists
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'jay@chalkstep.com';

SELECT 'Email confirmation disabled for existing users. You can now log in!' as message;