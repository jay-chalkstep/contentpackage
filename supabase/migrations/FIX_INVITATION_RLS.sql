-- Fix RLS policies for organization_invitations table
-- This allows admins to create invitations for their organization

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can create invitations" ON organization_invitations;
DROP POLICY IF EXISTS "Users can view their invitations" ON organization_invitations;
DROP POLICY IF EXISTS "Public can read invitation by token" ON organization_invitations;

-- Create new policies

-- 1. Allow admins to create invitations for their organization
CREATE POLICY "Admins can create invitations" ON organization_invitations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- User must be an admin of the organization they're inviting to
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.organization_id = organization_invitations.organization_id
      AND user_profiles.role = 'admin'
    )
  );

-- 2. Allow admins to view invitations for their organization
CREATE POLICY "Admins can view their org invitations" ON organization_invitations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.organization_id = organization_invitations.organization_id
      AND user_profiles.role = 'admin'
    )
  );

-- 3. Allow anyone to read an invitation by its token (for the acceptance flow)
CREATE POLICY "Public can read invitation by token" ON organization_invitations
  FOR SELECT
  TO anon, authenticated
  USING (
    -- This will be filtered by token in the query
    token IS NOT NULL
  );

-- 4. Allow admins to delete invitations for their organization
CREATE POLICY "Admins can delete their org invitations" ON organization_invitations
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.organization_id = organization_invitations.organization_id
      AND user_profiles.role = 'admin'
    )
  );

-- Also ensure the invited_by column can reference the user
-- Update the foreign key if needed
ALTER TABLE organization_invitations
  DROP CONSTRAINT IF EXISTS organization_invitations_invited_by_fkey;

ALTER TABLE organization_invitations
  ADD CONSTRAINT organization_invitations_invited_by_fkey
  FOREIGN KEY (invited_by) REFERENCES user_profiles(id) ON DELETE SET NULL;

-- Grant necessary permissions to the authenticated role
GRANT ALL ON organization_invitations TO authenticated;
GRANT SELECT ON organization_invitations TO anon;

-- Also fix any issues with the user_profiles table permissions
GRANT SELECT ON user_profiles TO authenticated;
GRANT SELECT ON organizations TO authenticated;

-- Verify RLS is enabled
ALTER TABLE organization_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Show current policies for verification
SELECT tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'organization_invitations'
ORDER BY tablename, policyname;