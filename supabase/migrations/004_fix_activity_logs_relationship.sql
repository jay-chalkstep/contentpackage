-- ============================================================================
-- FIX: Add proper relationship between user_activity_logs and user_profiles
-- ============================================================================

-- The issue: user_activity_logs.user_id references auth.users
-- but we need to join with user_profiles for display data

-- Option 1: Add a foreign key to user_profiles (safer, maintains referential integrity)
-- Since user_profiles.id already references auth.users(id), this creates a chain

-- No structural changes needed - just need to ensure RLS policies allow the join

-- Update RLS policy to allow reading with joined data
DROP POLICY IF EXISTS "Users can view org activity logs" ON user_activity_logs;

CREATE POLICY "Users can view org activity logs"
  ON user_activity_logs FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- Grant necessary permissions
GRANT SELECT ON user_profiles TO authenticated;
GRANT SELECT ON user_activity_logs TO authenticated;

-- Create a helper view that pre-joins the data for easier querying
CREATE OR REPLACE VIEW user_activity_logs_with_profiles AS
SELECT
  ual.id,
  ual.user_id,
  ual.organization_id,
  ual.activity_type,
  ual.description,
  ual.metadata,
  ual.created_at,
  up.full_name,
  up.email,
  up.avatar_url
FROM user_activity_logs ual
LEFT JOIN user_profiles up ON ual.user_id = up.id;

-- Grant access to the view
GRANT SELECT ON user_activity_logs_with_profiles TO authenticated;

-- Add RLS to the view
ALTER VIEW user_activity_logs_with_profiles SET (security_invoker = on);

COMMENT ON VIEW user_activity_logs_with_profiles IS 'Activity logs with user profile data pre-joined for convenience';
