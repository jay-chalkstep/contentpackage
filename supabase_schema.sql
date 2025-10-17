-- Create logos table
CREATE TABLE IF NOT EXISTS logos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name VARCHAR(255) NOT NULL,
  domain VARCHAR(255),
  logo_url TEXT NOT NULL,
  logo_type VARCHAR(50), -- svg, png, jpg, etc.
  logo_format VARCHAR(50), -- icon, logo, symbol, etc.
  background_color VARCHAR(7), -- hex color
  accent_color VARCHAR(7), -- hex color
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_logos_company_name ON logos(company_name);
CREATE INDEX IF NOT EXISTS idx_logos_created_at ON logos(created_at DESC);

-- Create RLS policies
ALTER TABLE logos ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to read logos (you can modify this based on your auth requirements)
CREATE POLICY "Allow public read access" ON logos
  FOR SELECT USING (true);

-- Allow authenticated users to insert logos (modify based on your auth requirements)
CREATE POLICY "Allow authenticated insert" ON logos
  FOR INSERT WITH CHECK (true);

-- Allow authenticated users to update their own logos (modify based on your auth requirements)
CREATE POLICY "Allow authenticated update" ON logos
  FOR UPDATE USING (true);

-- Allow authenticated users to delete logos (modify based on your auth requirements)
CREATE POLICY "Allow authenticated delete" ON logos
  FOR DELETE USING (true);