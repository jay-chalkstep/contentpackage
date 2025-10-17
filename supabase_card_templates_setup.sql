-- Create card_templates table
CREATE TABLE IF NOT EXISTS card_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_name VARCHAR(255) NOT NULL,
  template_url TEXT NOT NULL,
  file_type VARCHAR(50),
  file_size INTEGER,
  uploaded_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_card_templates_name ON card_templates(template_name);
CREATE INDEX IF NOT EXISTS idx_card_templates_uploaded ON card_templates(uploaded_date DESC);

-- Enable RLS
ALTER TABLE card_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Public read access" ON card_templates
  FOR SELECT USING (true);

CREATE POLICY "Public insert access" ON card_templates
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public update access" ON card_templates
  FOR UPDATE USING (true);

CREATE POLICY "Public delete access" ON card_templates
  FOR DELETE USING (true);

-- Create storage bucket for card templates
INSERT INTO storage.buckets (id, name, public)
VALUES ('card-templates', 'card-templates', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for card templates
CREATE POLICY "Public Access Card Templates" ON storage.objects
  FOR SELECT USING (bucket_id = 'card-templates');

CREATE POLICY "Public upload card templates" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'card-templates');

CREATE POLICY "Public update card templates" ON storage.objects
  FOR UPDATE USING (bucket_id = 'card-templates');

CREATE POLICY "Public delete card templates" ON storage.objects
  FOR DELETE USING (bucket_id = 'card-templates');