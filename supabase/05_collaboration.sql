-- Migration 05: Collaboration System
-- Adds visual annotation and review capabilities to mockups

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- MOCKUP COMMENTS TABLE
-- ============================================================================
-- Stores all comments on mockups with visual annotation data

CREATE TABLE IF NOT EXISTS mockup_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mockup_id UUID NOT NULL REFERENCES card_mockups(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL, -- Clerk user ID
  user_name TEXT NOT NULL, -- Display name from Clerk
  user_email TEXT NOT NULL, -- Email for notifications
  user_avatar TEXT, -- Profile pic URL from Clerk
  comment_text TEXT NOT NULL,

  -- Visual annotation fields
  annotation_data JSONB, -- Stores Konva shape objects (arrows, circles, paths, etc.)
  position_x DECIMAL(5,2), -- X position as % from left (0-100), for pin markers
  position_y DECIMAL(5,2), -- Y position as % from top (0-100), for pin markers
  annotation_type TEXT, -- 'pin' | 'arrow' | 'circle' | 'rect' | 'freehand' | 'text' | 'none'
  annotation_color TEXT DEFAULT '#FF6B6B', -- Color for annotation (assigned per reviewer)

  -- Status and metadata
  is_resolved BOOLEAN DEFAULT false, -- For marking comments as resolved
  parent_comment_id UUID REFERENCES mockup_comments(id) ON DELETE CASCADE, -- For threaded replies

  -- Audit fields
  organization_id TEXT NOT NULL, -- Clerk org ID for multi-tenancy
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX idx_mockup_comments_mockup ON mockup_comments(mockup_id, created_at DESC);
CREATE INDEX idx_mockup_comments_user ON mockup_comments(user_id, created_at DESC);
CREATE INDEX idx_mockup_comments_org ON mockup_comments(organization_id);
CREATE INDEX idx_mockup_comments_resolved ON mockup_comments(is_resolved, mockup_id);
CREATE INDEX idx_mockup_comments_parent ON mockup_comments(parent_comment_id);

-- ============================================================================
-- MOCKUP REVIEWERS TABLE
-- ============================================================================
-- Tracks who's been invited to review mockups and their status

CREATE TABLE IF NOT EXISTS mockup_reviewers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mockup_id UUID NOT NULL REFERENCES card_mockups(id) ON DELETE CASCADE,

  -- Reviewer info (from Clerk)
  reviewer_id TEXT NOT NULL, -- Clerk user ID
  reviewer_name TEXT NOT NULL, -- Display name
  reviewer_email TEXT NOT NULL, -- For email notifications
  reviewer_avatar TEXT, -- Profile pic URL
  reviewer_color TEXT, -- Assigned color for their annotations

  -- Review status
  status TEXT DEFAULT 'pending', -- 'pending' | 'viewed' | 'approved' | 'changes_requested'

  -- Invitation details
  invited_by TEXT NOT NULL, -- Clerk user ID of person who invited
  invited_at TIMESTAMP DEFAULT NOW(),
  invitation_message TEXT, -- Optional message from inviter

  -- Activity timestamps
  viewed_at TIMESTAMP, -- First time reviewer opened the mockup
  responded_at TIMESTAMP, -- When they approved/requested changes
  response_note TEXT, -- Note added when approving or requesting changes

  -- Multi-tenancy
  organization_id TEXT NOT NULL, -- Clerk org ID

  -- Prevent duplicate invitations
  UNIQUE(mockup_id, reviewer_id)
);

-- Indexes for performance
CREATE INDEX idx_mockup_reviewers_mockup ON mockup_reviewers(mockup_id);
CREATE INDEX idx_mockup_reviewers_reviewer ON mockup_reviewers(reviewer_id, status);
CREATE INDEX idx_mockup_reviewers_org ON mockup_reviewers(organization_id);
CREATE INDEX idx_mockup_reviewers_status ON mockup_reviewers(status, invited_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on both tables
ALTER TABLE mockup_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE mockup_reviewers ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- MOCKUP COMMENTS POLICIES
-- ----------------------------------------------------------------------------

-- Users can view comments on mockups they created or are reviewing
CREATE POLICY "Users can view relevant comments"
ON mockup_comments FOR SELECT
USING (
  organization_id IN (
    SELECT unnest(string_to_array(current_setting('request.jwt.claims', true)::json->>'orgs', ','))
  )
  AND (
    -- Creator can see all comments on their mockup
    mockup_id IN (
      SELECT id FROM card_mockups
      WHERE created_by = current_setting('request.jwt.claims', true)::json->>'sub'
    )
    OR
    -- Reviewer can see comments on mockups they're reviewing
    mockup_id IN (
      SELECT mockup_id FROM mockup_reviewers
      WHERE reviewer_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  )
);

-- Users can add comments to mockups they have access to
CREATE POLICY "Users can add comments"
ON mockup_comments FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT unnest(string_to_array(current_setting('request.jwt.claims', true)::json->>'orgs', ','))
  )
  AND user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  AND (
    -- Creator can comment on their own mockup
    mockup_id IN (
      SELECT id FROM card_mockups
      WHERE created_by = current_setting('request.jwt.claims', true)::json->>'sub'
    )
    OR
    -- Reviewer can comment on mockups they're reviewing
    mockup_id IN (
      SELECT mockup_id FROM mockup_reviewers
      WHERE reviewer_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  )
);

-- Users can update their own comments
CREATE POLICY "Users can update own comments"
ON mockup_comments FOR UPDATE
USING (
  user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  AND organization_id IN (
    SELECT unnest(string_to_array(current_setting('request.jwt.claims', true)::json->>'orgs', ','))
  )
);

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments"
ON mockup_comments FOR DELETE
USING (
  user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  AND organization_id IN (
    SELECT unnest(string_to_array(current_setting('request.jwt.claims', true)::json->>'orgs', ','))
  )
);

-- ----------------------------------------------------------------------------
-- MOCKUP REVIEWERS POLICIES
-- ----------------------------------------------------------------------------

-- Users can view reviewers on mockups they created or are reviewing
CREATE POLICY "Users can view relevant reviewers"
ON mockup_reviewers FOR SELECT
USING (
  organization_id IN (
    SELECT unnest(string_to_array(current_setting('request.jwt.claims', true)::json->>'orgs', ','))
  )
  AND (
    -- Creator can see all reviewers on their mockup
    mockup_id IN (
      SELECT id FROM card_mockups
      WHERE created_by = current_setting('request.jwt.claims', true)::json->>'sub'
    )
    OR
    -- Reviewer can see themselves and other reviewers
    reviewer_id = current_setting('request.jwt.claims', true)::json->>'sub'
  )
);

-- Only mockup creators can add reviewers
CREATE POLICY "Creators can add reviewers"
ON mockup_reviewers FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT unnest(string_to_array(current_setting('request.jwt.claims', true)::json->>'orgs', ','))
  )
  AND invited_by = current_setting('request.jwt.claims', true)::json->>'sub'
  AND mockup_id IN (
    SELECT id FROM card_mockups
    WHERE created_by = current_setting('request.jwt.claims', true)::json->>'sub'
  )
);

-- Reviewers can update their own status, creators can update any reviewer
CREATE POLICY "Reviewers can update own status"
ON mockup_reviewers FOR UPDATE
USING (
  organization_id IN (
    SELECT unnest(string_to_array(current_setting('request.jwt.claims', true)::json->>'orgs', ','))
  )
  AND (
    -- Reviewer can update their own record
    reviewer_id = current_setting('request.jwt.claims', true)::json->>'sub'
    OR
    -- Creator can update any reviewer on their mockup
    mockup_id IN (
      SELECT id FROM card_mockups
      WHERE created_by = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  )
);

-- Creators can remove reviewers
CREATE POLICY "Creators can remove reviewers"
ON mockup_reviewers FOR DELETE
USING (
  organization_id IN (
    SELECT unnest(string_to_array(current_setting('request.jwt.claims', true)::json->>'orgs', ','))
  )
  AND mockup_id IN (
    SELECT id FROM card_mockups
    WHERE created_by = current_setting('request.jwt.claims', true)::json->>'sub'
  )
);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for mockup_comments
CREATE TRIGGER update_mockup_comments_updated_at
BEFORE UPDATE ON mockup_comments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COLOR ASSIGNMENT HELPER
-- ============================================================================

-- Predefined colors for reviewer annotations (rotates through list)
-- Colors chosen for good contrast against typical mockup backgrounds
COMMENT ON COLUMN mockup_reviewers.reviewer_color IS
  'Auto-assigned from: #FF6B6B (red), #4ECDC4 (teal), #FFE66D (yellow), #95E1D3 (mint), #A29BFE (purple), #FD79A8 (pink)';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

COMMENT ON TABLE mockup_comments IS 'Stores comments and visual annotations on mockups for collaboration';
COMMENT ON TABLE mockup_reviewers IS 'Tracks review invitations and approval status for mockups';
