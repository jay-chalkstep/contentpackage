-- ============================================================================
-- Fix Approval Counts for Existing Assets
-- ============================================================================
-- This script updates approvals_required for existing stage progress records
-- that were created before migration 18 was run.
--
-- Run this after migration 18 to fix existing assets.
-- ============================================================================

-- Step 1: Check current state (diagnostic query)
-- Run this first to see which records need updating
SELECT
  msp.asset_id,
  a.mockup_name,
  p.name as project_name,
  msp.stage_order,
  msp.status,
  msp.approvals_required,
  msp.approvals_received,
  count_stage_reviewers(msp.project_id, msp.stage_order) as actual_reviewer_count
FROM mockup_stage_progress msp
JOIN assets a ON a.id = msp.asset_id
JOIN projects p ON p.id = msp.project_id
WHERE msp.approvals_required = 0
ORDER BY p.name, a.mockup_name, msp.stage_order;

-- Step 2: Fix the counts
-- This updates all stage progress records to have the correct approvals_required
UPDATE mockup_stage_progress msp
SET
  approvals_required = count_stage_reviewers(msp.project_id, msp.stage_order),
  updated_at = NOW()
WHERE approvals_required = 0
  AND project_id IS NOT NULL;

-- Step 3: Verify the fix
-- Run this to confirm all records now have correct counts
SELECT
  msp.asset_id,
  a.mockup_name,
  p.name as project_name,
  msp.stage_order,
  msp.status,
  msp.approvals_required,
  msp.approvals_received,
  count_stage_reviewers(msp.project_id, msp.stage_order) as actual_reviewer_count
FROM mockup_stage_progress msp
JOIN assets a ON a.id = msp.asset_id
JOIN projects p ON p.id = msp.project_id
ORDER BY p.name, a.mockup_name, msp.stage_order;

-- ============================================================================
-- Alternative: Force re-initialization for a specific project
-- ============================================================================
-- If you want to completely reset a project's workflow progress:
-- Replace 'YOUR_PROJECT_ID' with the actual project UUID

/*
DO $$
DECLARE
  v_project_id UUID := 'YOUR_PROJECT_ID'; -- Replace with actual project ID
  v_asset RECORD;
BEGIN
  -- For each asset in the project
  FOR v_asset IN
    SELECT id, project_id, org_id
    FROM assets
    WHERE project_id = v_project_id
  LOOP
    -- Delete existing progress
    DELETE FROM mockup_stage_progress WHERE asset_id = v_asset.id;
    DELETE FROM mockup_stage_user_approvals WHERE asset_id = v_asset.id;

    -- Re-initialize with correct counts
    PERFORM initialize_mockup_stage_progress(
      v_asset.id,
      v_asset.project_id,
      v_asset.org_id
    );

    RAISE NOTICE 'Re-initialized asset: %', v_asset.id;
  END LOOP;
END $$;
*/

-- ============================================================================
-- Notes
-- ============================================================================
/*
After running this fix:
1. Refresh your browser to see updated counts
2. The "X of Y approved" should now show correct numbers
3. Existing approvals in mockup_stage_user_approvals are preserved
4. Only the counts are updated

If you still see 0 of 0:
- Check that reviewers are actually assigned to the stage
- Run: SELECT * FROM project_stage_reviewers WHERE project_id = 'YOUR_PROJECT_ID'
- If no reviewers assigned, the count will legitimately be 0
*/
