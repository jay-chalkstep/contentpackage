-- Create storage bucket for logos (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- Add column to track uploaded vs API logos
ALTER TABLE logos
ADD COLUMN IF NOT EXISTS is_uploaded BOOLEAN DEFAULT false;

-- Storage policies to allow public access to uploaded logos
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT USING (bucket_id = 'logos');

CREATE POLICY "Authenticated users can upload logos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'logos');

CREATE POLICY "Authenticated users can update logos" ON storage.objects
  FOR UPDATE USING (bucket_id = 'logos');

CREATE POLICY "Authenticated users can delete logos" ON storage.objects
  FOR DELETE USING (bucket_id = 'logos');