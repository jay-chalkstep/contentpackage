-- ============================================================================
-- Enable RLS on migration_history table
-- ============================================================================

-- Enable RLS on migration_history
ALTER TABLE IF EXISTS migration_history ENABLE ROW LEVEL SECURITY;

-- Create policy to allow service role full access
CREATE POLICY "Service role has full access to migration history"
ON migration_history
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create policy to allow authenticated users to read migration history
CREATE POLICY "Authenticated users can view migration history"
ON migration_history
FOR SELECT
TO authenticated
USING (true);

COMMENT ON TABLE migration_history IS 'Tracks database migrations. Service role has full access, authenticated users can read.';
