-- Migration 19: Fix Missing Columns in Templates Table
--
-- This migration ensures the templates table has all required columns
-- for multi-tenancy and user tracking, regardless of migration order.
--
-- Context: Migration 13 renamed card_templates -> templates
-- Migration 12 tried to add organization_id to card_templates (which no longer exists)
-- This fixes any missing columns on the current templates table.
--
-- Date: 2025-10-29
-- Version: 3.6.1

-- ============================================================================
-- STEP 1: Add missing columns if they don't exist
-- ============================================================================

-- Add organization_id column (for multi-tenant isolation)
ALTER TABLE templates
ADD COLUMN IF NOT EXISTS organization_id TEXT;

-- Add created_by column (for user tracking)
ALTER TABLE templates
ADD COLUMN IF NOT EXISTS created_by TEXT;

-- ============================================================================
-- STEP 2: Create performance indexes
-- ============================================================================

-- Index on organization_id for efficient filtering
CREATE INDEX IF NOT EXISTS idx_templates_organization_id
ON templates(organization_id);

-- Composite index on created_by and organization_id
CREATE INDEX IF NOT EXISTS idx_templates_created_by
ON templates(created_by, organization_id);

-- ============================================================================
-- STEP 3: Update backward compatibility view
-- ============================================================================

-- Update the card_templates view to include new columns
CREATE OR REPLACE VIEW card_templates AS
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

-- ============================================================================
-- STEP 4: Add helpful comments
-- ============================================================================

COMMENT ON COLUMN templates.organization_id IS
  'Organization ID from Clerk for multi-tenant data isolation';

COMMENT ON COLUMN templates.created_by IS
  'User ID from Clerk who uploaded this template';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Run these to verify the migration worked:

-- Check columns exist
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'templates'
-- AND column_name IN ('organization_id', 'created_by')
-- ORDER BY column_name;

-- Check indexes exist
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename = 'templates'
-- AND indexname LIKE 'idx_templates_%';

-- Test inserting a template (should succeed)
-- INSERT INTO templates (template_name, template_url, organization_id, created_by, file_type, file_size)
-- VALUES ('Test Template', 'https://example.com/test.png', 'org_test123', 'user_test123', 'image/png', 12345);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

COMMENT ON TABLE templates IS
  'Design templates for creating brand assets. Fixed in migration 19 to ensure organization_id and created_by columns exist.';
