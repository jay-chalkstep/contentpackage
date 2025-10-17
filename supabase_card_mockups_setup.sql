-- Create card_mockups table
CREATE TABLE IF NOT EXISTS card_mockups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mockup_name VARCHAR(255) NOT NULL,
  logo_id UUID REFERENCES logos(id) ON DELETE CASCADE,
  template_id UUID REFERENCES card_templates(id) ON DELETE CASCADE,
  logo_x FLOAT DEFAULT 10, -- Percentage from left (10% default)
  logo_y FLOAT DEFAULT 10, -- Percentage from top (10% default)
  logo_scale FLOAT DEFAULT 25, -- Logo width as percentage of card width (25% default)
  mockup_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_card_mockups_name ON card_mockups(mockup_name);
CREATE INDEX IF NOT EXISTS idx_card_mockups_logo ON card_mockups(logo_id);
CREATE INDEX IF NOT EXISTS idx_card_mockups_template ON card_mockups(template_id);
CREATE INDEX IF NOT EXISTS idx_card_mockups_created ON card_mockups(created_at DESC);

-- Enable RLS
ALTER TABLE card_mockups ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Public read access" ON card_mockups
  FOR SELECT USING (true);

CREATE POLICY "Public insert access" ON card_mockups
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public update access" ON card_mockups
  FOR UPDATE USING (true);

CREATE POLICY "Public delete access" ON card_mockups
  FOR DELETE USING (true);

-- Create storage bucket for card mockups
INSERT INTO storage.buckets (id, name, public)
VALUES ('card-mockups', 'card-mockups', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for card mockups
CREATE POLICY "Public Access Card Mockups" ON storage.objects
  FOR SELECT USING (bucket_id = 'card-mockups');

CREATE POLICY "Public upload card mockups" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'card-mockups');

CREATE POLICY "Public update card mockups" ON storage.objects
  FOR UPDATE USING (bucket_id = 'card-mockups');

CREATE POLICY "Public delete card mockups" ON storage.objects
  FOR DELETE USING (bucket_id = 'card-mockups');