-- Migration 12: Fix Multi-Tenancy for All Brand-Related Tables
--
-- This migration fixes a critical multi-tenancy bug where:
-- 1. The organization_id column was missing from MULTIPLE tables (brands, card_mockups,
--    card_templates, logo_variants, brand_colors, brand_fonts)
-- 2. Migration 04 created indexes referencing organization_id but never created the column
-- 3. The unique constraint on brands.domain prevented different orgs from saving the same brand
-- 4. Application code referenced organization_id throughout but column didn't exist
--
-- This migration enables true multi-tenant storage where different organizations
-- can independently save and manage the same brands, mockups, and templates.
--
-- Date: 2025-10-28
-- Version: 3.4.1

-- ============================================================================
-- STEP 1: Add missing organization_id column to ALL affected tables
-- ============================================================================

-- Add organization_id column to brands table (nullable initially for safety)
ALTER TABLE brands
ADD COLUMN IF NOT EXISTS organization_id TEXT;

-- Add organization_id to card_mockups (referenced in migration 04 indexes but never created)
ALTER TABLE card_mockups
ADD COLUMN IF NOT EXISTS organization_id TEXT;

-- Add organization_id to card_templates (referenced in migration 04 indexes but never created)
ALTER TABLE card_templates
ADD COLUMN IF NOT EXISTS organization_id TEXT;

-- Add organization_id to logo_variants (referenced in app code but never created)
ALTER TABLE logo_variants
ADD COLUMN IF NOT EXISTS organization_id TEXT;

-- Add organization_id to brand_colors (referenced in app code but never created)
ALTER TABLE brand_colors
ADD COLUMN IF NOT EXISTS organization_id TEXT;

-- Add organization_id to brand_fonts (referenced in app code but never created)
ALTER TABLE brand_fonts
ADD COLUMN IF NOT EXISTS organization_id TEXT;

-- ============================================================================
-- STEP 2: Handle existing data
-- ============================================================================

-- IMPORTANT: For existing records without organization_id, we have two options:
--
-- OPTION A (Recommended for fresh/test deployments):
--   Delete existing data - users can re-save from scratch
--   Uncomment the following lines:
--
--   DELETE FROM brands WHERE organization_id IS NULL;
--   DELETE FROM card_mockups WHERE organization_id IS NULL;
--   DELETE FROM card_templates WHERE organization_id IS NULL;
--   DELETE FROM logo_variants WHERE organization_id IS NULL;
--   DELETE FROM brand_colors WHERE organization_id IS NULL;
--   DELETE FROM brand_fonts WHERE organization_id IS NULL;
--
-- OPTION B (Recommended for production with existing data):
--   Keep existing data but it will need manual cleanup
--   Records will be visible across all organizations until cleaned up
--   You can identify and reassign them later using created_by field
--
-- For this migration, we'll use OPTION B to preserve data by default.
-- Admins can manually delete orphaned records after migration if needed.

COMMENT ON COLUMN brands.organization_id IS
  'Organization ID from Clerk. NULL values indicate legacy data that needs cleanup.';
COMMENT ON COLUMN card_mockups.organization_id IS
  'Organization ID from Clerk. NULL values indicate legacy data that needs cleanup.';
COMMENT ON COLUMN card_templates.organization_id IS
  'Organization ID from Clerk. NULL values indicate legacy data that needs cleanup.';
COMMENT ON COLUMN logo_variants.organization_id IS
  'Organization ID from Clerk. NULL values indicate legacy data that needs cleanup.';
COMMENT ON COLUMN brand_colors.organization_id IS
  'Organization ID from Clerk. NULL values indicate legacy data that needs cleanup.';
COMMENT ON COLUMN brand_fonts.organization_id IS
  'Organization ID from Clerk. NULL values indicate legacy data that needs cleanup.';

-- ============================================================================
-- STEP 3: Update unique constraints for multi-tenancy
-- ============================================================================

-- Drop the existing global unique constraint on domain
-- This constraint prevented different organizations from saving the same brand
ALTER TABLE brands
DROP CONSTRAINT IF EXISTS brands_domain_key;

-- Add composite unique constraint on (domain, organization_id)
-- This allows different organizations to save the same brand domain
-- while preventing duplicates within the same organization
--
-- NOTE: PostgreSQL treats NULL as distinct, so brands with NULL organization_id
-- can have duplicate domains. This is acceptable for legacy data cleanup.
ALTER TABLE brands
ADD CONSTRAINT brands_domain_organization_key
  UNIQUE (domain, organization_id);

-- ============================================================================
-- STEP 4: Update indexes for performance
-- ============================================================================

-- The index idx_brands_created_by already exists from migration 04 and includes organization_id
-- Verify it exists (it was created expecting this column)
CREATE INDEX IF NOT EXISTS idx_brands_organization_id ON brands(organization_id);

-- ============================================================================
-- STEP 5: Verify RLS policies
-- ============================================================================

-- RLS is already enabled on brands table from migration 02
-- The existing policy "Allow all for authenticated users" remains in place
-- Organization isolation is handled at the application layer via API routes
-- No changes needed to RLS policies

-- ============================================================================
-- STEP 6: Create indexes on all tables (now that organization_id exists)
-- ============================================================================

-- These indexes were attempted in migration 04 but failed because the column didn't exist
-- Now we can create them successfully

-- Create/recreate composite indexes from migration 04 (these may have failed originally)
CREATE INDEX IF NOT EXISTS idx_mockups_created_by ON card_mockups(created_by, organization_id);
CREATE INDEX IF NOT EXISTS idx_templates_created_by ON card_templates(created_by, organization_id);
CREATE INDEX IF NOT EXISTS idx_brands_created_by ON brands(created_by, organization_id);

-- Add organization_id indexes for better query performance on related tables
CREATE INDEX IF NOT EXISTS idx_card_mockups_organization_id ON card_mockups(organization_id);
CREATE INDEX IF NOT EXISTS idx_card_templates_organization_id ON card_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_logo_variants_organization_id ON logo_variants(organization_id);
CREATE INDEX IF NOT EXISTS idx_brand_colors_organization_id ON brand_colors(organization_id);
CREATE INDEX IF NOT EXISTS idx_brand_fonts_organization_id ON brand_fonts(organization_id);

-- ============================================================================
-- VERIFICATION QUERIES (run these to verify migration success)
-- ============================================================================

-- Check for brands missing organization_id
-- SELECT COUNT(*) as legacy_brands FROM brands WHERE organization_id IS NULL;

-- Verify unique constraint
-- SELECT constraint_name, constraint_type
-- FROM information_schema.table_constraints
-- WHERE table_name = 'brands' AND constraint_type = 'UNIQUE';

-- Test multi-tenancy (should allow same domain for different org_ids)
-- These should both succeed:
-- INSERT INTO brands (id, name, domain, organization_id, created_by)
--   VALUES (gen_random_uuid(), 'Nike', 'nike.com', 'org_123', 'user_123');
-- INSERT INTO brands (id, name, domain, organization_id, created_by)
--   VALUES (gen_random_uuid(), 'Nike', 'nike.com', 'org_456', 'user_456');

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

COMMENT ON TABLE brands IS
  'Brand information with multi-tenant isolation. Each organization can have its own copy of any brand.';
