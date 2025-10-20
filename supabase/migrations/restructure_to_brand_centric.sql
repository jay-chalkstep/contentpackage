-- Create brands table (normalized brand information)
CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name TEXT NOT NULL,
  domain TEXT UNIQUE NOT NULL,
  description TEXT,
  primary_logo_variant_id UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Rename logos table to logo_variants and add brand_id
ALTER TABLE logos RENAME TO logo_variants;
ALTER TABLE logo_variants ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES brands(id) ON DELETE CASCADE;

-- Update brand_colors to reference brands instead of individual logos
ALTER TABLE brand_colors DROP CONSTRAINT IF EXISTS brand_colors_logo_id_fkey;
ALTER TABLE brand_colors ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES brands(id) ON DELETE CASCADE;

-- Update brand_fonts to reference brands instead of individual logos
ALTER TABLE brand_fonts DROP CONSTRAINT IF EXISTS brand_fonts_logo_id_fkey;
ALTER TABLE brand_fonts ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES brands(id) ON DELETE CASCADE;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_logo_variants_brand_id ON logo_variants(brand_id);
CREATE INDEX IF NOT EXISTS idx_brands_domain ON brands(domain);
CREATE INDEX IF NOT EXISTS idx_brand_colors_brand_id ON brand_colors(brand_id);
CREATE INDEX IF NOT EXISTS idx_brand_fonts_brand_id ON brand_fonts(brand_id);

-- Add foreign key constraint for primary_logo_variant_id
ALTER TABLE brands ADD CONSTRAINT fk_primary_logo_variant
  FOREIGN KEY (primary_logo_variant_id) REFERENCES logo_variants(id) ON DELETE SET NULL;
