-- ============================================================================
-- Migration 18: User-Level Approval Tracking & Owner Final Approval
-- ============================================================================
-- Implements individual reviewer approval tracking and project owner final
-- approval step. Changes approval logic from "any one reviewer" to
-- "all reviewers must approve" before advancing stages.
-- ============================================================================

-- ============================================================================
-- PART 1: NEW TABLES
-- ============================================================================

-- Table: mockup_stage_user_approvals
-- Purpose: Track each individual reviewer's approval/rejection per stage
-- One record per user per stage per asset
CREATE TABLE IF NOT EXISTS mockup_stage_user_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  stage_order INTEGER NOT NULL,
  user_id TEXT NOT NULL, -- Clerk user ID
  user_name TEXT NOT NULL,
  user_email TEXT,
  user_image_url TEXT,
  action TEXT NOT NULL CHECK (action IN ('approve', 'request_changes')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure user can only approve/reject once per stage per asset
  CONSTRAINT unique_user_stage_asset UNIQUE(asset_id, stage_order, user_id)
);

-- Indexes for performance
CREATE INDEX idx_user_approvals_asset ON mockup_stage_user_approvals(asset_id);
CREATE INDEX idx_user_approvals_project ON mockup_stage_user_approvals(project_id);
CREATE INDEX idx_user_approvals_user ON mockup_stage_user_approvals(user_id);
CREATE INDEX idx_user_approvals_stage ON mockup_stage_user_approvals(asset_id, stage_order);
CREATE INDEX idx_user_approvals_created_at ON mockup_stage_user_approvals(created_at DESC);

-- Trigger for updated_at
CREATE TRIGGER update_user_approvals_updated_at
  BEFORE UPDATE ON mockup_stage_user_approvals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE mockup_stage_user_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated users in org"
  ON mockup_stage_user_approvals FOR ALL USING (true);

COMMENT ON TABLE mockup_stage_user_approvals IS 'Tracks individual reviewer approvals/rejections per workflow stage';
COMMENT ON COLUMN mockup_stage_user_approvals.action IS 'approve or request_changes';

-- ============================================================================
-- PART 2: ALTER EXISTING TABLES
-- ============================================================================

-- Add approval tracking columns to mockup_stage_progress
ALTER TABLE mockup_stage_progress
  ADD COLUMN IF NOT EXISTS approvals_required INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS approvals_received INTEGER DEFAULT 0;

COMMENT ON COLUMN mockup_stage_progress.approvals_required IS 'Number of reviewers assigned to this stage';
COMMENT ON COLUMN mockup_stage_progress.approvals_received IS 'Number of reviewers who have approved';

-- Add final approval columns to assets table
ALTER TABLE assets
  ADD COLUMN IF NOT EXISTS final_approved_by TEXT,
  ADD COLUMN IF NOT EXISTS final_approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS final_approval_notes TEXT;

COMMENT ON COLUMN assets.final_approved_by IS 'Clerk user ID of project owner who gave final approval';
COMMENT ON COLUMN assets.final_approved_at IS 'Timestamp of final approval';
COMMENT ON COLUMN assets.final_approval_notes IS 'Optional notes from owner during final approval';

-- ============================================================================
-- PART 3: UPDATE EXISTING ENUMS
-- ============================================================================

-- Add new status for pending final approval
-- Note: ALTER TYPE ADD VALUE cannot be in a transaction block, may need manual execution
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'pending_final_approval'
    AND enumtypid = 'stage_status'::regtype
  ) THEN
    ALTER TYPE stage_status ADD VALUE 'pending_final_approval';
  END IF;
END$$;

-- ============================================================================
-- PART 4: DATABASE FUNCTIONS
-- ============================================================================

-- Function: Count reviewers for a stage
-- Returns: Number of reviewers assigned to given stage for project
CREATE OR REPLACE FUNCTION count_stage_reviewers(p_project_id UUID, p_stage_order INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  reviewer_count INTEGER;
BEGIN
  SELECT COUNT(DISTINCT user_id)
  INTO reviewer_count
  FROM project_stage_reviewers
  WHERE project_id = p_project_id
    AND stage_order = p_stage_order;

  RETURN COALESCE(reviewer_count, 0);
END;
$$;

COMMENT ON FUNCTION count_stage_reviewers IS 'Counts number of reviewers assigned to a specific stage';

-- Function: Check if stage has all required approvals
-- Returns: TRUE if approvals_received >= approvals_required
CREATE OR REPLACE FUNCTION check_stage_approval_complete(p_asset_id UUID, p_stage_order INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_approvals_required INTEGER;
  v_approvals_received INTEGER;
BEGIN
  SELECT approvals_required, approvals_received
  INTO v_approvals_required, v_approvals_received
  FROM mockup_stage_progress
  WHERE asset_id = p_asset_id
    AND stage_order = p_stage_order;

  -- If no reviewers assigned, consider complete
  IF v_approvals_required = 0 THEN
    RETURN TRUE;
  END IF;

  RETURN v_approvals_received >= v_approvals_required;
END;
$$;

COMMENT ON FUNCTION check_stage_approval_complete IS 'Checks if stage has received all required approvals';

-- Function: Update stage approval count
-- Increments approvals_received when a user approves
CREATE OR REPLACE FUNCTION increment_stage_approval_count(p_asset_id UUID, p_stage_order INTEGER)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE mockup_stage_progress
  SET approvals_received = approvals_received + 1,
      updated_at = NOW()
  WHERE asset_id = p_asset_id
    AND stage_order = p_stage_order;
END;
$$;

COMMENT ON FUNCTION increment_stage_approval_count IS 'Increments approval count when reviewer approves';

-- Function: Record final approval by project owner
-- Sets final approval fields on asset
CREATE OR REPLACE FUNCTION record_final_approval(
  p_asset_id UUID,
  p_user_id TEXT,
  p_user_name TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project_id UUID;
  v_max_stage INTEGER;
BEGIN
  -- Get asset's project and max stage
  SELECT project_id INTO v_project_id
  FROM assets
  WHERE id = p_asset_id;

  IF v_project_id IS NULL THEN
    RAISE EXCEPTION 'Asset not assigned to project';
  END IF;

  -- Get highest stage order
  SELECT MAX(stage_order) INTO v_max_stage
  FROM mockup_stage_progress
  WHERE asset_id = p_asset_id;

  -- Set final approval on asset
  UPDATE assets
  SET final_approved_by = p_user_id,
      final_approved_at = NOW(),
      final_approval_notes = p_notes,
      updated_at = NOW()
  WHERE id = p_asset_id;

  -- Update last stage progress to 'approved'
  UPDATE mockup_stage_progress
  SET status = 'approved',
      reviewed_by = p_user_id,
      reviewed_by_name = p_user_name,
      reviewed_at = NOW(),
      notes = p_notes,
      updated_at = NOW()
  WHERE asset_id = p_asset_id
    AND stage_order = v_max_stage;

  RETURN TRUE;
END;
$$;

COMMENT ON FUNCTION record_final_approval IS 'Records final approval by project owner after all stages complete';

-- ============================================================================
-- PART 5: UPDATE EXISTING FUNCTIONS
-- ============================================================================

-- Update: initialize_mockup_stage_progress
-- Now counts reviewers and sets approvals_required
CREATE OR REPLACE FUNCTION initialize_mockup_stage_progress()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  workflow_record RECORD;
  stage RECORD;
  reviewer_count INTEGER;
BEGIN
  -- Only initialize if mockup is being assigned to a project (not null)
  -- and either it's a new mockup or the project_id is changing
  IF NEW.project_id IS NOT NULL AND (
    TG_OP = 'INSERT' OR
    (TG_OP = 'UPDATE' AND (OLD.project_id IS NULL OR OLD.project_id != NEW.project_id))
  ) THEN
    -- Check if project has a workflow
    SELECT w.* INTO workflow_record
    FROM workflows w
    JOIN projects p ON p.workflow_id = w.id
    WHERE p.id = NEW.project_id;

    IF FOUND AND workflow_record.stages IS NOT NULL THEN
      -- Delete any existing progress for this mockup (in case of project reassignment)
      DELETE FROM mockup_stage_progress WHERE asset_id = NEW.id;
      DELETE FROM mockup_stage_user_approvals WHERE asset_id = NEW.id;

      -- Create progress records for each stage in the workflow
      FOR stage IN
        SELECT
          (stage_data->>'order')::INTEGER as stage_order
        FROM jsonb_array_elements(workflow_record.stages) as stage_data
        ORDER BY (stage_data->>'order')::INTEGER
      LOOP
        -- Count reviewers for this stage
        reviewer_count := count_stage_reviewers(NEW.project_id, stage.stage_order);

        INSERT INTO mockup_stage_progress (
          asset_id,
          project_id,
          stage_order,
          status,
          notification_sent,
          approvals_required,
          approvals_received
        ) VALUES (
          NEW.id,
          NEW.project_id,
          stage.stage_order,
          CASE
            -- First stage starts in review
            WHEN stage.stage_order = 1 THEN 'in_review'::stage_status
            -- All other stages are pending
            ELSE 'pending'::stage_status
          END,
          FALSE,
          reviewer_count,
          0
        );
      END LOOP;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION initialize_mockup_stage_progress IS 'Auto-creates stage progress with approval counts when mockup assigned to workflow project';

-- Update: advance_to_next_stage
-- Now checks if it's the last stage and sets pending_final_approval
CREATE OR REPLACE FUNCTION advance_to_next_stage(p_asset_id UUID, p_current_stage_order INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_next_stage_order INTEGER;
  v_project_id UUID;
  v_max_stage INTEGER;
  v_reviewer_count INTEGER;
BEGIN
  -- Get project_id and find max stage
  SELECT project_id INTO v_project_id
  FROM mockup_stage_progress
  WHERE asset_id = p_asset_id
  LIMIT 1;

  SELECT MAX(stage_order) INTO v_max_stage
  FROM mockup_stage_progress
  WHERE asset_id = p_asset_id;

  v_next_stage_order := p_current_stage_order + 1;

  -- Check if this was the last stage
  IF v_next_stage_order > v_max_stage THEN
    -- Last stage completed - set to pending final approval
    UPDATE mockup_stage_progress
    SET status = 'pending_final_approval'::stage_status,
        updated_at = NOW()
    WHERE asset_id = p_asset_id
      AND stage_order = p_current_stage_order;

    RETURN FALSE; -- No next stage
  END IF;

  -- Count reviewers for next stage
  v_reviewer_count := count_stage_reviewers(v_project_id, v_next_stage_order);

  -- Update next stage to in_review
  UPDATE mockup_stage_progress
  SET status = 'in_review'::stage_status,
      approvals_required = v_reviewer_count,
      approvals_received = 0,
      reviewed_by = NULL,
      reviewed_by_name = NULL,
      reviewed_at = NULL,
      notes = NULL,
      updated_at = NOW()
  WHERE asset_id = p_asset_id
    AND stage_order = v_next_stage_order;

  RETURN TRUE; -- Next stage exists
END;
$$;

COMMENT ON FUNCTION advance_to_next_stage IS 'Advances to next stage or sets pending_final_approval if last stage';

-- ============================================================================
-- PART 6: VERIFICATION QUERIES
-- ============================================================================

-- Check that new table exists
SELECT EXISTS (
  SELECT FROM pg_tables
  WHERE schemaname = 'public'
  AND tablename = 'mockup_stage_user_approvals'
) AS user_approvals_table_exists;

-- Check new columns exist
SELECT EXISTS (
  SELECT FROM information_schema.columns
  WHERE table_name = 'mockup_stage_progress'
  AND column_name = 'approvals_required'
) AS stage_approvals_columns_exist;

SELECT EXISTS (
  SELECT FROM information_schema.columns
  WHERE table_name = 'assets'
  AND column_name = 'final_approved_by'
) AS asset_final_approval_columns_exist;

-- Check new enum value exists
SELECT EXISTS (
  SELECT 1 FROM pg_enum
  WHERE enumlabel = 'pending_final_approval'
  AND enumtypid = 'stage_status'::regtype
) AS pending_final_approval_status_exists;

-- Count new functions
SELECT COUNT(*) as new_functions_count
FROM pg_proc
WHERE proname IN (
  'count_stage_reviewers',
  'check_stage_approval_complete',
  'increment_stage_approval_count',
  'record_final_approval'
);

-- ============================================================================
-- MIGRATION NOTES
-- ============================================================================
/*
BREAKING CHANGES:
- None for existing data. This is additive only.
- Existing workflows will now require ALL reviewers to approve (was ANY one)
- New "pending_final_approval" status added after last stage completes

POST-MIGRATION STEPS:
1. Verify all tables and columns created
2. Test with a sample project:
   - Assign multiple reviewers to stages
   - Verify approvals_required is set correctly
   - Test that all must approve before advancing
3. Update frontend to use new approval endpoints
4. Test final approval flow with project owner

ROLLBACK:
To rollback this migration:
```sql
DROP TABLE IF EXISTS mockup_stage_user_approvals CASCADE;
ALTER TABLE mockup_stage_progress DROP COLUMN IF EXISTS approvals_required;
ALTER TABLE mockup_stage_progress DROP COLUMN IF EXISTS approvals_received;
ALTER TABLE assets DROP COLUMN IF EXISTS final_approved_by;
ALTER TABLE assets DROP COLUMN IF EXISTS final_approved_at;
ALTER TABLE assets DROP COLUMN IF EXISTS final_approval_notes;
DROP FUNCTION IF EXISTS count_stage_reviewers CASCADE;
DROP FUNCTION IF EXISTS check_stage_approval_complete CASCADE;
DROP FUNCTION IF EXISTS increment_stage_approval_count CASCADE;
DROP FUNCTION IF EXISTS record_final_approval CASCADE;
-- Note: Cannot remove enum value without recreating the type
```
*/
