-- Logo Finder / Asset Studio - Storage Setup
-- This file sets up Supabase Storage buckets and policies
--
-- NOTE: Storage buckets must be created through the Supabase Dashboard or CLI
-- This file contains the SQL policies to apply after bucket creation
--
-- Prerequisites:
-- 1. Complete 01_initial_schema.sql
-- 2. Complete 02_brand_centric.sql
-- 3. Create storage buckets (see instructions below)

-- ============================================================================
-- STEP 1: CREATE STORAGE BUCKETS (via Supabase Dashboard or CLI)
-- ============================================================================
-- You must create these buckets manually in the Supabase Dashboard:
--
-- 1. Go to Storage section in Supabase Dashboard
-- 2. Click "Create bucket"
-- 3. Create the following buckets:
--
--    Bucket Name: logos
--    Public: Yes
--    File size limit: 10 MB
--    Allowed MIME types: image/png, image/jpeg, image/jpg, image/svg+xml, image/webp
--
--    Bucket Name: card-templates
--    Public: Yes
--    File size limit: 10 MB
--    Allowed MIME types: image/png, image/jpeg, image/jpg, image/svg+xml
--
--    Bucket Name: card-mockups
--    Public: Yes
--    File size limit: 10 MB
--    Allowed MIME types: image/png, image/jpeg, image/jpg
--
-- OR use Supabase CLI:
--   supabase storage create logos --public
--   supabase storage create card-templates --public
--   supabase storage create card-mockups --public

-- ============================================================================
-- STEP 2: STORAGE POLICIES (Run this SQL after creating buckets)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- LOGOS BUCKET POLICIES
-- ----------------------------------------------------------------------------

-- Allow anyone to view files in the logos bucket (public read)
CREATE POLICY "Public read access for logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'logos');

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'logos'
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to update their uploaded files
CREATE POLICY "Authenticated users can update logos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'logos'
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to delete files
CREATE POLICY "Authenticated users can delete logos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'logos'
  AND auth.role() = 'authenticated'
);

-- ----------------------------------------------------------------------------
-- CARD-TEMPLATES BUCKET POLICIES
-- ----------------------------------------------------------------------------

-- Allow anyone to view templates (public read)
CREATE POLICY "Public read access for card templates"
ON storage.objects FOR SELECT
USING (bucket_id = 'card-templates');

-- Allow authenticated users to upload templates
CREATE POLICY "Authenticated users can upload card templates"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'card-templates'
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to update templates
CREATE POLICY "Authenticated users can update card templates"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'card-templates'
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to delete templates
CREATE POLICY "Authenticated users can delete card templates"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'card-templates'
  AND auth.role() = 'authenticated'
);

-- ----------------------------------------------------------------------------
-- CARD-MOCKUPS BUCKET POLICIES
-- ----------------------------------------------------------------------------

-- Allow anyone to view mockups (public read)
CREATE POLICY "Public read access for card mockups"
ON storage.objects FOR SELECT
USING (bucket_id = 'card-mockups');

-- Allow authenticated users to upload mockups
CREATE POLICY "Authenticated users can upload card mockups"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'card-mockups'
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to update mockups
CREATE POLICY "Authenticated users can update card mockups"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'card-mockups'
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to delete mockups
CREATE POLICY "Authenticated users can delete card mockups"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'card-mockups'
  AND auth.role() = 'authenticated'
);

-- ============================================================================
-- STORAGE SETUP COMPLETE
-- ============================================================================
-- Your storage buckets are now configured with the following access:
-- - Public read access (anyone can view files via public URLs)
-- - Authenticated write access (logged-in users can upload/update/delete)
--
-- Test your setup:
-- 1. Try uploading a logo through the app's upload page
-- 2. Verify the file appears in Supabase Storage
-- 3. Check that the public URL works in your browser
--
-- Troubleshooting:
-- - If uploads fail, check the bucket exists and is public
-- - Verify RLS policies are enabled with: SELECT * FROM storage.policies;
-- - Check browser console for CORS or policy errors
