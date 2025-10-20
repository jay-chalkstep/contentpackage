-- Logo Finder / Asset Studio - Initial Database Schema
-- This file creates all the base tables needed for the application
-- Run this first before any other migrations

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- LOGOS TABLE (Main logo storage - will be migrated to logo_variants later)
-- ============================================================================
CREATE TABLE IF NOT EXISTS logos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name TEXT NOT NULL,
  domain TEXT,
  description TEXT,
  logo_url TEXT NOT NULL,
  logo_type TEXT, -- file extension: png, svg, jpg, etc.
  logo_format TEXT, -- icon, logo, symbol, etc.
  theme TEXT, -- light, dark, etc.
  width INTEGER,
  height INTEGER,
  file_size INTEGER,
  background_color TEXT,
  accent_color TEXT,
  is_uploaded BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- BRAND COLORS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS brand_colors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  logo_id UUID REFERENCES logos(id) ON DELETE CASCADE,
  hex TEXT NOT NULL,
  type TEXT, -- primary, secondary, accent, etc.
  brightness NUMERIC, -- 0-100
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- BRAND FONTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS brand_fonts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  logo_id UUID REFERENCES logos(id) ON DELETE CASCADE,
  font_name TEXT NOT NULL,
  font_type TEXT, -- sans-serif, serif, display, etc.
  origin TEXT, -- google-fonts, custom, etc.
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- CARD TEMPLATES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS card_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_name TEXT NOT NULL,
  template_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  uploaded_date TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- CARD MOCKUPS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS card_mockups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mockup_name TEXT NOT NULL,
  logo_id UUID REFERENCES logos(id) ON DELETE CASCADE,
  template_id UUID REFERENCES card_templates(id) ON DELETE CASCADE,
  logo_x NUMERIC NOT NULL, -- Percentage from left (0-100)
  logo_y NUMERIC NOT NULL, -- Percentage from top (0-100)
  logo_scale NUMERIC NOT NULL, -- Logo width as percentage of card width
  mockup_image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_logos_company_name ON logos(company_name);
CREATE INDEX IF NOT EXISTS idx_logos_domain ON logos(domain);
CREATE INDEX IF NOT EXISTS idx_logos_created_at ON logos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_brand_colors_logo_id ON brand_colors(logo_id);
CREATE INDEX IF NOT EXISTS idx_brand_fonts_logo_id ON brand_fonts(logo_id);
CREATE INDEX IF NOT EXISTS idx_card_mockups_logo_id ON card_mockups(logo_id);
CREATE INDEX IF NOT EXISTS idx_card_mockups_template_id ON card_mockups(template_id);

-- ============================================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables
CREATE TRIGGER update_logos_updated_at
    BEFORE UPDATE ON logos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_brand_colors_updated_at
    BEFORE UPDATE ON brand_colors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_brand_fonts_updated_at
    BEFORE UPDATE ON brand_fonts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_card_templates_updated_at
    BEFORE UPDATE ON card_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_card_mockups_updated_at
    BEFORE UPDATE ON card_mockups
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================
-- Note: Since this is a single-user application, we'll enable RLS but allow
-- all operations. You can customize these policies for multi-user scenarios.

ALTER TABLE logos ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_colors ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_fonts ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_mockups ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (single-user app)
CREATE POLICY "Allow all for authenticated users" ON logos
    FOR ALL USING (true);

CREATE POLICY "Allow all for authenticated users" ON brand_colors
    FOR ALL USING (true);

CREATE POLICY "Allow all for authenticated users" ON brand_fonts
    FOR ALL USING (true);

CREATE POLICY "Allow all for authenticated users" ON card_templates
    FOR ALL USING (true);

CREATE POLICY "Allow all for authenticated users" ON card_mockups
    FOR ALL USING (true);

-- ============================================================================
-- INITIAL SETUP COMPLETE
-- ============================================================================
-- Next steps:
-- 1. Run 02_brand_centric.sql to migrate to the brand-centric data model
-- 2. Run 03_storage_setup.sql to create storage buckets
