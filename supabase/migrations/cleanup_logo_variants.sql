-- First, let's see what we're working with by creating brands from existing logo_variants data
-- Insert unique brands from logo_variants into brands table
INSERT INTO brands (company_name, domain, description)
SELECT DISTINCT company_name, domain, description
FROM logo_variants
WHERE company_name IS NOT NULL AND domain IS NOT NULL
ON CONFLICT (domain) DO NOTHING;

-- Update logo_variants to set brand_id from brands table
UPDATE logo_variants lv
SET brand_id = b.id
FROM brands b
WHERE lv.domain = b.domain
AND lv.company_name = b.company_name
AND lv.brand_id IS NULL;

-- Now remove the old columns from logo_variants
ALTER TABLE logo_variants DROP COLUMN IF EXISTS company_name CASCADE;
ALTER TABLE logo_variants DROP COLUMN IF EXISTS domain CASCADE;
ALTER TABLE logo_variants DROP COLUMN IF EXISTS description CASCADE;

-- Add NOT NULL constraint to brand_id
ALTER TABLE logo_variants ALTER COLUMN brand_id SET NOT NULL;
