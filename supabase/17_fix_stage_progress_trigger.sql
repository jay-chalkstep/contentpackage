-- ============================================================================
-- Fix Stage Progress Trigger After Column Rename
-- ============================================================================
-- Migration 13 renamed mockup_id to asset_id in mockup_stage_progress table
-- but didn't update the trigger function that references it
-- ============================================================================

-- Update the trigger function to use asset_id instead of mockup_id
CREATE OR REPLACE FUNCTION initialize_mockup_stage_progress()
RETURNS TRIGGER AS $$
DECLARE
  workflow_record RECORD;
  stage RECORD;
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
      -- FIXED: Use asset_id instead of mockup_id
      DELETE FROM mockup_stage_progress WHERE asset_id = NEW.id;

      -- Create progress records for each stage in the workflow
      FOR stage IN
        SELECT
          (stage_data->>'order')::INTEGER as stage_order
        FROM jsonb_array_elements(workflow_record.stages) as stage_data
        ORDER BY (stage_data->>'order')::INTEGER
      LOOP
        INSERT INTO mockup_stage_progress (
          asset_id,  -- FIXED: Use asset_id instead of mockup_id
          project_id,
          stage_order,
          status,
          notification_sent
        ) VALUES (
          NEW.id,
          NEW.project_id,
          stage.stage_order,
          CASE
            -- First stage starts in review, all others pending
            WHEN stage.stage_order = 1 THEN 'in_review'::stage_status
            ELSE 'pending'::stage_status
          END,
          false
        );
      END LOOP;

      -- Note: Email notification to stage 1 reviewers will be sent by application
      -- after INSERT completes, to avoid complex async email logic in triggers
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update advance_to_next_stage function
CREATE OR REPLACE FUNCTION advance_to_next_stage(
  p_mockup_id UUID,
  p_current_stage_order INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  v_next_stage_order INTEGER;
  v_has_next_stage BOOLEAN;
BEGIN
  -- Find the next stage
  -- FIXED: Use asset_id instead of mockup_id
  SELECT stage_order INTO v_next_stage_order
  FROM mockup_stage_progress
  WHERE asset_id = p_mockup_id
  AND stage_order > p_current_stage_order
  ORDER BY stage_order ASC
  LIMIT 1;

  v_has_next_stage := FOUND;

  IF v_has_next_stage THEN
    -- Update next stage to in_review
    UPDATE mockup_stage_progress
    SET
      status = 'in_review',
      updated_at = NOW()
    WHERE asset_id = p_mockup_id
      AND stage_order = v_next_stage_order;

    RETURN TRUE;
  ELSE
    -- No next stage, this was the last one
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Update reset_to_first_stage function
CREATE OR REPLACE FUNCTION reset_to_first_stage(
  p_mockup_id UUID
)
RETURNS VOID AS $$
BEGIN
  -- Reset all stages to pending
  -- FIXED: Use asset_id instead of mockup_id
  UPDATE mockup_stage_progress
  SET
    status = 'pending',
    reviewed_by = NULL,
    reviewed_by_name = NULL,
    reviewed_at = NULL,
    notes = NULL,
    notification_sent = false,
    notification_sent_at = NULL,
    updated_at = NOW()
  WHERE asset_id = p_mockup_id;

  -- Set stage 1 to in_review
  UPDATE mockup_stage_progress
  SET
    status = 'in_review',
    updated_at = NOW()
  WHERE asset_id = p_mockup_id
  AND stage_order = 1;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION initialize_mockup_stage_progress IS 'FIXED: Updated to use asset_id column after migration 13 rename';
COMMENT ON FUNCTION advance_to_next_stage IS 'FIXED: Updated to use asset_id column after migration 13 rename';
COMMENT ON FUNCTION reset_to_first_stage IS 'FIXED: Updated to use asset_id column after migration 13 rename';
