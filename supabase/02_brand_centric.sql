-- Logo Finder / Asset Studio - Brand-Centric Data Model Migration
-- This migration restructures the database to use a brand-centric approach
-- where each brand can have multiple logo variants
--
-- Prerequisites: 01_initial_schema.sql must be run first
-- Run this after 01_initial_schema.sql

-- ============================================================================
-- STEP 1: CREATE BRANDS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name TEXT NOT NULL,
  domain TEXT UNIQUE NOT NULL,
  description TEXT,
  primary_logo_variant_id UUID, -- Will be set after logo_variants are created
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- STEP 2: MIGRATE LOGOS TABLE TO LOGO_VARIANTS
-- ============================================================================
-- First, create unique brands from existing logos data
INSERT INTO brands (company_name, domain, description)
SELECT DISTINCT
  company_name,
  COALESCE(domain, LOWER(REPLACE(company_name, ' ', '')) || '.com') as domain,
  description
FROM logos
WHERE company_name IS NOT NULL
ON CONFLICT (domain) DO NOTHING;

-- Rename logos to logo_variants
ALTER TABLE logos RENAME TO logo_variants;

-- Add brand_id column to logo_variants
ALTER TABLE logo_variants ADD COLUMN IF NOT EXISTS brand_id UUID;

-- Populate brand_id based on company_name/domain match
UPDATE logo_variants lv
SET brand_id = b.id
FROM brands b
WHERE lv.company_name = b.company_name
  AND (lv.domain = b.domain OR lv.domain IS NULL);

-- For any logo_variants without a brand_id, create a new brand
DO $$
DECLARE
  variant_record RECORD;
  new_brand_id UUID;
BEGIN
  FOR variant_record IN
    SELECT * FROM logo_variants WHERE brand_id IS NULL
  LOOP
    -- Create a new brand
    INSERT INTO brands (company_name, domain, description)
    VALUES (
      variant_record.company_name,
      COALESCE(variant_record.domain, LOWER(REPLACE(variant_record.company_name, ' ', '')) || '.com'),
      variant_record.description
    )
    ON CONFLICT (domain) DO UPDATE SET company_name = EXCLUDED.company_name
    RETURNING id INTO new_brand_id;

    -- Update the logo_variant
    UPDATE logo_variants
    SET brand_id = new_brand_id
    WHERE id = variant_record.id;
  END LOOP;
END $$;

-- Now drop the redundant columns from logo_variants
ALTER TABLE logo_variants DROP COLUMN IF EXISTS company_name;
ALTER TABLE logo_variants DROP COLUMN IF EXISTS domain;
ALTER TABLE logo_variants DROP COLUMN IF EXISTS description;

-- Make brand_id required
ALTER TABLE logo_variants ALTER COLUMN brand_id SET NOT NULL;

-- Add foreign key constraint
ALTER TABLE logo_variants
  ADD CONSTRAINT fk_logo_variants_brand_id
  FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;

-- ============================================================================
-- STEP 3: UPDATE BRAND_COLORS TO REFERENCE BRANDS
-- ============================================================================
-- Add brand_id column
ALTER TABLE brand_colors ADD COLUMN IF NOT EXISTS brand_id UUID;

-- Migrate data from logo_id to brand_id
UPDATE brand_colors bc
SET brand_id = lv.brand_id
FROM logo_variants lv
WHERE bc.logo_id = lv.id AND bc.brand_id IS NULL;

-- Drop old logo_id foreign key constraint if it exists
ALTER TABLE brand_colors DROP CONSTRAINT IF EXISTS brand_colors_logo_id_fkey;

-- Drop logo_id column (colors are now associated with brands, not individual logos)
ALTER TABLE brand_colors DROP COLUMN IF EXISTS logo_id;

-- Make brand_id required for new records
ALTER TABLE brand_colors ALTER COLUMN brand_id SET NOT NULL;

-- Add foreign key constraint
ALTER TABLE brand_colors
  ADD CONSTRAINT fk_brand_colors_brand_id
  FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;

-- ============================================================================
-- STEP 4: UPDATE BRAND_FONTS TO REFERENCE BRANDS
-- ============================================================================
-- Add brand_id column
ALTER TABLE brand_fonts ADD COLUMN IF NOT EXISTS brand_id UUID;

-- Migrate data from logo_id to brand_id
UPDATE brand_fonts bf
SET brand_id = lv.brand_id
FROM logo_variants lv
WHERE bf.logo_id = lv.id AND bf.brand_id IS NULL;

-- Drop old logo_id foreign key constraint if it exists
ALTER TABLE brand_fonts DROP CONSTRAINT IF EXISTS brand_fonts_logo_id_fkey;

-- Drop logo_id column (fonts are now associated with brands, not individual logos)
ALTER TABLE brand_fonts DROP COLUMN IF EXISTS logo_id;

-- Make brand_id required for new records
ALTER TABLE brand_fonts ALTER COLUMN brand_id SET NOT NULL;

-- Add foreign key constraint
ALTER TABLE brand_fonts
  ADD CONSTRAINT fk_brand_fonts_brand_id
  FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;

-- ============================================================================
-- STEP 5: SET PRIMARY LOGO VARIANT FOR EACH BRAND
-- ============================================================================
-- For each brand, set the first logo variant as the primary one
UPDATE brands b
SET primary_logo_variant_id = (
  SELECT id FROM logo_variants
  WHERE brand_id = b.id
  ORDER BY created_at ASC
  LIMIT 1
)
WHERE primary_logo_variant_id IS NULL;

-- Add foreign key constraint for primary_logo_variant_id
ALTER TABLE brands
  ADD CONSTRAINT fk_brands_primary_logo_variant
  FOREIGN KEY (primary_logo_variant_id)
  REFERENCES logo_variants(id) ON DELETE SET NULL;

-- ============================================================================
-- STEP 6: CREATE INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_logo_variants_brand_id ON logo_variants(brand_id);
CREATE INDEX IF NOT EXISTS idx_brands_domain ON brands(domain);
CREATE INDEX IF NOT EXISTS idx_brands_company_name ON brands(company_name);
CREATE INDEX IF NOT EXISTS idx_brand_colors_brand_id ON brand_colors(brand_id);
CREATE INDEX IF NOT EXISTS idx_brand_fonts_brand_id ON brand_fonts(brand_id);

-- ============================================================================
-- STEP 7: ADD UPDATED_AT TRIGGER TO BRANDS
-- ============================================================================
CREATE TRIGGER update_brands_updated_at
    BEFORE UPDATE ON brands
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STEP 8: ENABLE RLS ON BRANDS TABLE
-- ============================================================================
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated users" ON brands
    FOR ALL USING (true);

-- Update RLS policy name for logo_variants to be more accurate
DROP POLICY IF EXISTS "Allow all for authenticated users" ON logo_variants;
CREATE POLICY "Allow all for authenticated users" ON logo_variants
    FOR ALL USING (true);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- The database is now using a brand-centric model where:
-- - Each brand can have multiple logo variants
-- - Colors and fonts are associated with brands, not individual logos
-- - Each brand has a primary logo variant for quick reference
--
-- Next step: Run 03_storage_setup.sql to create storage buckets
