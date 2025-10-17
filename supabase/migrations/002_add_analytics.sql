-- ============================================================================
-- ANALYTICS TABLES AND FUNCTIONS
-- Track user activity, asset usage, and storage metrics
-- ============================================================================

-- ============================================================================
-- DROP OLD user_activity_logs TABLE AND RECREATE WITH NEW STRUCTURE
-- ============================================================================
DROP TABLE IF EXISTS user_activity_logs CASCADE;

-- ============================================================================
-- TABLE: user_activity_logs (NEW STRUCTURE)
-- Purpose: Track all user activities for analytics and audit
-- ============================================================================
CREATE TABLE user_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Activity Information
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'login',
    'logo_search',
    'logo_save',
    'logo_delete',
    'template_upload',
    'template_delete',
    'mockup_create',
    'mockup_duplicate',
    'mockup_export',
    'mockup_delete',
    'user_invite',
    'settings_update',
    'other'
  )),

  -- Details
  description TEXT,
  metadata JSONB DEFAULT '{}', -- Additional data about the activity

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for user_activity_logs
CREATE INDEX idx_activity_logs_user ON user_activity_logs(user_id);
CREATE INDEX idx_activity_logs_org ON user_activity_logs(organization_id);
CREATE INDEX idx_activity_logs_type ON user_activity_logs(activity_type);
CREATE INDEX idx_activity_logs_created_at ON user_activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_org_created ON user_activity_logs(organization_id, created_at DESC);

-- ============================================================================
-- FUNCTION: Log User Activity
-- Purpose: Helper function to easily log user activities
-- ============================================================================
CREATE OR REPLACE FUNCTION log_user_activity(
  p_user_id UUID,
  p_organization_id UUID,
  p_activity_type TEXT,
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO user_activity_logs (
    user_id,
    organization_id,
    activity_type,
    description,
    metadata
  )
  VALUES (
    p_user_id,
    p_organization_id,
    p_activity_type,
    p_description,
    p_metadata
  )
  RETURNING id INTO log_id;

  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGERS: Auto-log asset activities
-- ============================================================================

-- Log when logos are saved
CREATE OR REPLACE FUNCTION log_logo_save()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM log_user_activity(
    NEW.user_id,
    (SELECT organization_id FROM user_profiles WHERE id = NEW.user_id),
    'logo_save',
    'Saved logo: ' || NEW.brand_name,
    jsonb_build_object('logo_id', NEW.id, 'brand_name', NEW.brand_name)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_logo_save
  AFTER INSERT ON logos
  FOR EACH ROW
  EXECUTE FUNCTION log_logo_save();

-- Log when templates are uploaded
CREATE OR REPLACE FUNCTION log_template_upload()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM log_user_activity(
    NEW.user_id,
    (SELECT organization_id FROM user_profiles WHERE id = NEW.user_id),
    'template_upload',
    'Uploaded template: ' || NEW.name,
    jsonb_build_object('template_id', NEW.id, 'name', NEW.name)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_template_upload
  AFTER INSERT ON card_templates
  FOR EACH ROW
  EXECUTE FUNCTION log_template_upload();

-- Log when mockups are created
CREATE OR REPLACE FUNCTION log_mockup_create()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM log_user_activity(
    NEW.user_id,
    (SELECT organization_id FROM user_profiles WHERE id = NEW.user_id),
    'mockup_create',
    'Created mockup: ' || NEW.name,
    jsonb_build_object('mockup_id', NEW.id, 'name', NEW.name)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_mockup_create
  AFTER INSERT ON card_mockups
  FOR EACH ROW
  EXECUTE FUNCTION log_mockup_create();

-- ============================================================================
-- VIEW: organization_analytics_summary
-- Purpose: Pre-computed analytics for quick dashboard loading
-- ============================================================================
CREATE OR REPLACE VIEW organization_analytics_summary AS
SELECT
  o.id as organization_id,
  o.name as organization_name,

  -- User counts
  COUNT(DISTINCT up.id) FILTER (WHERE up.is_active = true) as active_users,
  COUNT(DISTINCT up.id) as total_users,
  COUNT(DISTINCT ual.user_id) FILTER (WHERE ual.created_at >= NOW() - INTERVAL '7 days') as active_users_7d,
  COUNT(DISTINCT ual.user_id) FILTER (WHERE ual.created_at >= NOW() - INTERVAL '30 days') as active_users_30d,

  -- Asset counts
  COUNT(DISTINCT l.id) as total_logos,
  COUNT(DISTINCT ct.id) as total_templates,
  COUNT(DISTINCT cm.id) as total_mockups,

  -- Recent activity
  COUNT(DISTINCT ual.id) FILTER (WHERE ual.created_at >= NOW() - INTERVAL '7 days') as activities_7d,
  COUNT(DISTINCT ual.id) FILTER (WHERE ual.created_at >= NOW() - INTERVAL '30 days') as activities_30d,

  -- Storage (sum of storage_used_mb from user profiles)
  COALESCE(SUM(up.storage_used_mb), 0) as total_storage_mb

FROM organizations o
LEFT JOIN user_profiles up ON o.id = up.organization_id
LEFT JOIN user_activity_logs ual ON o.id = ual.organization_id
LEFT JOIN logos l ON up.id = l.user_id
LEFT JOIN card_templates ct ON up.id = ct.user_id
LEFT JOIN card_mockups cm ON up.id = cm.user_id
GROUP BY o.id, o.name;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on user_activity_logs
ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own organization's activity logs
CREATE POLICY "Users can view org activity logs"
  ON user_activity_logs FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- Only system can insert activity logs (via function)
CREATE POLICY "System can insert activity logs"
  ON user_activity_logs FOR INSERT
  WITH CHECK (true); -- Function is SECURITY DEFINER

-- Grant permissions for the view
GRANT SELECT ON organization_analytics_summary TO authenticated;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE user_activity_logs IS 'Tracks all user activities for analytics and audit purposes';
COMMENT ON FUNCTION log_user_activity IS 'Helper function to log user activities with standardized format';
COMMENT ON VIEW organization_analytics_summary IS 'Pre-computed analytics summary for organization dashboards';
