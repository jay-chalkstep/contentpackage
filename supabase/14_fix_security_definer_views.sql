-- ============================================================================
-- Fix Security Definer Views Issue
-- ============================================================================
-- Problem: Views created with implicit SECURITY DEFINER are blocking access
-- Solution: Recreate views with SECURITY INVOKER so they use the caller's permissions
-- ============================================================================

-- Drop existing views
DROP VIEW IF EXISTS card_mockups CASCADE;
DROP VIEW IF EXISTS card_templates CASCADE;
DROP VIEW IF EXISTS folder_mockup_counts CASCADE;

-- Recreate card_mockups view with SECURITY INVOKER
CREATE OR REPLACE VIEW card_mockups
WITH (security_invoker = true)
AS
SELECT
  id,
  mockup_name,
  logo_id,
  template_id,
  logo_x,
  logo_y,
  logo_scale,
  mockup_image_url,
  folder_id,
  project_id,
  created_by,
  organization_id,
  created_at,
  updated_at
FROM assets;

-- Recreate card_templates view with SECURITY INVOKER
CREATE OR REPLACE VIEW card_templates
WITH (security_invoker = true)
AS
SELECT
  id,
  template_name,
  template_url,
  file_type,
  file_size,
  uploaded_date,
  created_by,
  organization_id,
  created_at,
  updated_at
FROM templates;

-- Recreate folder_mockup_counts view with SECURITY INVOKER
CREATE OR REPLACE VIEW folder_mockup_counts
WITH (security_invoker = true)
AS
SELECT
  f.id as folder_id,
  f.name as folder_name,
  f.organization_id,
  f.created_by,
  COUNT(m.id) as mockup_count
FROM folders f
LEFT JOIN assets m ON f.id = m.folder_id
GROUP BY f.id, f.name, f.organization_id, f.created_by;

-- Add comments
COMMENT ON VIEW card_mockups IS 'Compatibility view for old card_mockups table name. Uses SECURITY INVOKER to run with caller permissions.';
COMMENT ON VIEW card_templates IS 'Compatibility view for old card_templates table name. Uses SECURITY INVOKER to run with caller permissions.';
COMMENT ON VIEW folder_mockup_counts IS 'Aggregated view of mockup counts per folder. Uses SECURITY INVOKER to run with caller permissions.';
