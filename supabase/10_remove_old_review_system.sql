-- ============================================================================
-- MIGRATION 10: REMOVE OLD REVIEW SYSTEM
-- Drops the legacy ad-hoc reviewer invitation system (mockup_reviewers table)
-- The new stage-based workflow approval system (mockup_stage_progress) remains
-- ============================================================================

-- Drop the old review system table
-- This table stored ad-hoc reviewer invitations before the workflow system
DROP TABLE IF EXISTS mockup_reviewers CASCADE;

-- Note: mockup_comments table is preserved (still used for annotations)
-- Note: mockup_stage_progress table is preserved (new workflow system)
-- Note: project_stage_reviewers table is preserved (workflow stage assignments)

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- Removed: mockup_reviewers table (old ad-hoc review invitations)
-- Kept: mockup_comments (annotations/comments on mockups)
-- Kept: mockup_stage_progress (new workflow progress tracking)
-- Kept: project_stage_reviewers (workflow stage reviewer assignments)
-- ============================================================================
