-- ============================================================================
-- MIGRATION 09: STAGE PROGRESS
-- Tracks mockup progress through multi-stage approval workflows
-- ============================================================================

-- Create enum for stage status
CREATE TYPE stage_status AS ENUM (
  'pending',              -- Not yet reached this stage
  'in_review',           -- Currently at this stage, awaiting approval
  'approved',            -- Stage approved
  'changes_requested'    -- Changes requested at this stage
);

-- Mockup stage progress - tracks each mockup's progress through workflow stages
CREATE TABLE mockup_stage_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mockup_id UUID NOT NULL REFERENCES card_mockups(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  stage_order INTEGER NOT NULL, -- Which stage (1, 2, 3...)
  status stage_status NOT NULL DEFAULT 'pending',

  -- Reviewer who acted on this stage
  reviewed_by TEXT, -- Clerk user ID
  reviewed_by_name TEXT,
  reviewed_at TIMESTAMP,
  notes TEXT, -- Approval notes or change request details

  -- Email notification tracking
  notification_sent BOOLEAN DEFAULT false,
  notification_sent_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Ensure one progress record per mockup per stage
  UNIQUE(mockup_id, stage_order)
);

-- Performance indexes
CREATE INDEX idx_stage_progress_mockup ON mockup_stage_progress(mockup_id);
CREATE INDEX idx_stage_progress_project ON mockup_stage_progress(project_id);
CREATE INDEX idx_stage_progress_status ON mockup_stage_progress(status);
CREATE INDEX idx_stage_progress_project_stage ON mockup_stage_progress(project_id, stage_order);
CREATE INDEX idx_stage_progress_mockup_stage ON mockup_stage_progress(mockup_id, stage_order);

-- Updated_at trigger
CREATE TRIGGER update_stage_progress_updated_at
  BEFORE UPDATE ON mockup_stage_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to initialize stage progress when mockup is assigned to a project with workflow
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
      DELETE FROM mockup_stage_progress WHERE mockup_id = NEW.id;

      -- Create progress records for each stage in the workflow
      FOR stage IN
        SELECT
          (stage_data->>'order')::INTEGER as stage_order
        FROM jsonb_array_elements(workflow_record.stages) as stage_data
        ORDER BY (stage_data->>'order')::INTEGER
      LOOP
        INSERT INTO mockup_stage_progress (
          mockup_id,
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

-- Trigger to auto-initialize stage progress
CREATE TRIGGER trigger_initialize_mockup_stage_progress
  AFTER INSERT OR UPDATE OF project_id ON card_mockups
  FOR EACH ROW
  EXECUTE FUNCTION initialize_mockup_stage_progress();

-- Function to advance to next stage (called after approval)
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
  SELECT stage_order INTO v_next_stage_order
  FROM mockup_stage_progress
  WHERE mockup_id = p_mockup_id
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
    WHERE mockup_id = p_mockup_id
      AND stage_order = v_next_stage_order;

    RETURN TRUE;
  ELSE
    -- No next stage, this was the last one
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to reset mockup to first stage (called when changes requested)
CREATE OR REPLACE FUNCTION reset_to_first_stage(
  p_mockup_id UUID
)
RETURNS VOID AS $$
BEGIN
  -- Reset all stages to pending
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
  WHERE mockup_id = p_mockup_id;

  -- Set stage 1 to in_review
  UPDATE mockup_stage_progress
  SET
    status = 'in_review',
    updated_at = NOW()
  WHERE mockup_id = p_mockup_id
    AND stage_order = 1;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE mockup_stage_progress ENABLE ROW LEVEL SECURITY;

-- Allow all for authenticated users (following same pattern as other tables)
-- Authentication is handled at API route level with Clerk
CREATE POLICY "Allow all for authenticated users in org"
  ON mockup_stage_progress FOR ALL
  USING (true);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE mockup_stage_progress IS 'Tracks each mockup''s progress through workflow approval stages. All access through API routes with Clerk authentication. RLS enabled but permissive - security enforced at API layer.';
COMMENT ON COLUMN mockup_stage_progress.status IS 'Current status of this stage: pending (not reached), in_review (awaiting approval), approved (stage passed), changes_requested (rejected)';
COMMENT ON FUNCTION advance_to_next_stage IS 'Advances a mockup to the next workflow stage after approval. Returns TRUE if there is a next stage, FALSE if this was the last stage.';
COMMENT ON FUNCTION reset_to_first_stage IS 'Resets a mockup back to stage 1 in_review when changes are requested at any stage. Clears all approval data.';
