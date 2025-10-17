-- Add columns to track reminder information
ALTER TABLE organization_invitations
ADD COLUMN IF NOT EXISTS last_reminder_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS reminder_count INTEGER DEFAULT 0;

-- Add comment for clarity
COMMENT ON COLUMN organization_invitations.last_reminder_sent_at IS 'Timestamp of when the last reminder email was sent';
COMMENT ON COLUMN organization_invitations.reminder_count IS 'Number of reminder emails sent for this invitation';