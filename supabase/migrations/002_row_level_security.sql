-- Enable Row Level Security on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_mockups ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE logos ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_mockups ENABLE ROW LEVEL SECURITY;

-- Helper function to get user's organization_id
CREATE OR REPLACE FUNCTION get_user_organization_id(user_id UUID)
RETURNS UUID AS $$
  SELECT organization_id FROM user_profiles WHERE id = user_id;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT role = 'admin' FROM user_profiles WHERE id = user_id;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Organizations policies
CREATE POLICY "Users can view their own organization" ON organizations
  FOR SELECT USING (
    id = get_user_organization_id(auth.uid())
  );

CREATE POLICY "Admins can update their organization" ON organizations
  FOR UPDATE USING (
    id = get_user_organization_id(auth.uid()) AND is_admin(auth.uid())
  );

-- User profiles policies
CREATE POLICY "Users can view profiles in their organization" ON user_profiles
  FOR SELECT USING (
    organization_id = get_user_organization_id(auth.uid())
  );

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (
    id = auth.uid()
  );

CREATE POLICY "Admins can insert new user profiles" ON user_profiles
  FOR INSERT WITH CHECK (
    organization_id = get_user_organization_id(auth.uid()) AND is_admin(auth.uid())
  );

CREATE POLICY "Admins can update profiles in their organization" ON user_profiles
  FOR UPDATE USING (
    organization_id = get_user_organization_id(auth.uid()) AND is_admin(auth.uid())
  );

-- Organization invitations policies
CREATE POLICY "Admins can manage invitations" ON organization_invitations
  FOR ALL USING (
    organization_id = get_user_organization_id(auth.uid()) AND is_admin(auth.uid())
  );

CREATE POLICY "Anyone can view invitation by token" ON organization_invitations
  FOR SELECT USING (true); -- Token validation happens in application

-- Organization assets policies
CREATE POLICY "Users can view organization assets" ON organization_assets
  FOR SELECT USING (
    organization_id = get_user_organization_id(auth.uid())
  );

CREATE POLICY "Admins can manage organization assets" ON organization_assets
  FOR ALL USING (
    organization_id = get_user_organization_id(auth.uid()) AND is_admin(auth.uid())
  );

-- User activity logs policies
CREATE POLICY "Users can view their own activity" ON user_activity_logs
  FOR SELECT USING (
    user_id = auth.uid()
  );

CREATE POLICY "Admins can view all organization activity" ON user_activity_logs
  FOR SELECT USING (
    organization_id = get_user_organization_id(auth.uid()) AND is_admin(auth.uid())
  );

CREATE POLICY "System can insert activity logs" ON user_activity_logs
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    organization_id = get_user_organization_id(auth.uid())
  );

-- Shared mockups policies
CREATE POLICY "Users can view shared mockups in their organization" ON shared_mockups
  FOR SELECT USING (
    organization_id = get_user_organization_id(auth.uid())
  );

CREATE POLICY "Users can share their own mockups" ON shared_mockups
  FOR INSERT WITH CHECK (
    shared_by = auth.uid() AND
    organization_id = get_user_organization_id(auth.uid())
  );

CREATE POLICY "Users can update their own shared mockups" ON shared_mockups
  FOR UPDATE USING (
    shared_by = auth.uid()
  );

CREATE POLICY "Admins can manage all shared mockups" ON shared_mockups
  FOR ALL USING (
    organization_id = get_user_organization_id(auth.uid()) AND is_admin(auth.uid())
  );

-- Organization settings policies
CREATE POLICY "Admins can manage organization settings" ON organization_settings
  FOR ALL USING (
    organization_id = get_user_organization_id(auth.uid()) AND is_admin(auth.uid())
  );

CREATE POLICY "Users can view organization settings" ON organization_settings
  FOR SELECT USING (
    organization_id = get_user_organization_id(auth.uid())
  );

-- Logos policies
CREATE POLICY "Users can view their own logos" ON logos
  FOR SELECT USING (
    user_id = auth.uid() OR
    (organization_id = get_user_organization_id(auth.uid()) AND visibility = 'organization')
  );

CREATE POLICY "Users can insert their own logos" ON logos
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    organization_id = get_user_organization_id(auth.uid())
  );

CREATE POLICY "Users can update their own logos" ON logos
  FOR UPDATE USING (
    user_id = auth.uid()
  );

CREATE POLICY "Users can delete their own logos" ON logos
  FOR DELETE USING (
    user_id = auth.uid()
  );

-- Card templates policies
CREATE POLICY "Users can view accessible templates" ON card_templates
  FOR SELECT USING (
    user_id = auth.uid() OR
    (organization_id = get_user_organization_id(auth.uid()) AND visibility = 'organization')
  );

CREATE POLICY "Users can insert their own templates" ON card_templates
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    organization_id = get_user_organization_id(auth.uid())
  );

CREATE POLICY "Users can update their own templates" ON card_templates
  FOR UPDATE USING (
    user_id = auth.uid()
  );

CREATE POLICY "Users can delete their own templates" ON card_templates
  FOR DELETE USING (
    user_id = auth.uid()
  );

-- Card mockups policies
CREATE POLICY "Users can view accessible mockups" ON card_mockups
  FOR SELECT USING (
    user_id = auth.uid() OR
    (organization_id = get_user_organization_id(auth.uid()) AND (visibility = 'organization' OR is_shared = true))
  );

CREATE POLICY "Users can insert their own mockups" ON card_mockups
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    organization_id = get_user_organization_id(auth.uid())
  );

CREATE POLICY "Users can update their own mockups" ON card_mockups
  FOR UPDATE USING (
    user_id = auth.uid()
  );

CREATE POLICY "Users can delete their own mockups" ON card_mockups
  FOR DELETE USING (
    user_id = auth.uid()
  );

-- Storage policies for Supabase Storage buckets
-- These would be configured in the Supabase dashboard or via API
-- as they're not part of PostgreSQL directly