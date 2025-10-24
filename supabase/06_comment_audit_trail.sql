-- Migration 06: Comment Audit Trail and Resolution System
-- Adds complete chain of custody for comments with resolution workflow

-- ============================================================================
-- ADD AUDIT TRAIL COLUMNS TO MOCKUP_COMMENTS
-- ============================================================================

-- Resolution tracking (enhance existing is_resolved field)
ALTER TABLE mockup_comments
ADD COLUMN IF NOT EXISTS resolved_by TEXT, -- Clerk user ID who resolved
ADD COLUMN IF NOT EXISTS resolved_by_name TEXT, -- Display name for audit
ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP, -- When resolved
ADD COLUMN IF NOT EXISTS resolution_note TEXT; -- Resolution explanation

-- Soft delete for preserving history
ALTER TABLE mockup_comments
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP, -- Soft delete timestamp
ADD COLUMN IF NOT EXISTS deleted_by TEXT, -- Clerk user ID who deleted
ADD COLUMN IF NOT EXISTS deleted_by_name TEXT; -- Display name for audit

-- Edit history tracking
ALTER TABLE mockup_comments
ADD COLUMN IF NOT EXISTS edit_history JSONB DEFAULT '[]'::jsonb, -- Array of edits
ADD COLUMN IF NOT EXISTS original_comment_text TEXT; -- First version for audit

-- Backfill original_comment_text for existing comments
UPDATE mockup_comments
SET original_comment_text = comment_text
WHERE original_comment_text IS NULL;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Index for filtering resolved/unresolved comments
CREATE INDEX IF NOT EXISTS idx_mockup_comments_resolved_status
ON mockup_comments(mockup_id, is_resolved, created_at DESC)
WHERE deleted_at IS NULL;

-- Index for soft delete filtering
CREATE INDEX IF NOT EXISTS idx_mockup_comments_not_deleted
ON mockup_comments(mockup_id, created_at DESC)
WHERE deleted_at IS NULL;

-- Index for resolved comments
CREATE INDEX IF NOT EXISTS idx_mockup_comments_resolved_by
ON mockup_comments(resolved_by, resolved_at DESC)
WHERE is_resolved = true;

-- ============================================================================
-- HELPER COMMENTS
-- ============================================================================

COMMENT ON COLUMN mockup_comments.resolved_by IS
  'Clerk user ID of person who marked comment as resolved';

COMMENT ON COLUMN mockup_comments.resolution_note IS
  'Explanation of how/why comment was resolved - what action was taken';

COMMENT ON COLUMN mockup_comments.deleted_at IS
  'Soft delete timestamp - comments are never truly deleted for audit trail';

COMMENT ON COLUMN mockup_comments.edit_history IS
  'JSONB array tracking all edits: [{edited_at, edited_by, edited_by_name, old_text, new_text}]';

COMMENT ON COLUMN mockup_comments.original_comment_text IS
  'Original comment text when first created - preserved for audit trail';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- This migration adds complete audit trail capabilities:
-- 1. Resolution workflow with notes
-- 2. Soft deletes (never lose history)
-- 3. Edit history tracking
-- 4. Original text preservation
-- All existing comments are fully compatible (new columns nullable except original_comment_text)
