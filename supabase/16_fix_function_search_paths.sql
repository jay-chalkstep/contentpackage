-- ============================================================================
-- Fix Function Search Path Security Warnings
-- ============================================================================
-- Problem: Functions don't have explicit search_path, which is a security risk
-- Solution: Set explicit search_path on all functions
-- ============================================================================

-- Fix card_mockups trigger functions
ALTER FUNCTION card_mockups_insert() SET search_path = public, pg_temp;
ALTER FUNCTION card_mockups_update() SET search_path = public, pg_temp;
ALTER FUNCTION card_mockups_delete() SET search_path = public, pg_temp;

-- Fix card_templates trigger functions
ALTER FUNCTION card_templates_insert() SET search_path = public, pg_temp;
ALTER FUNCTION card_templates_update() SET search_path = public, pg_temp;
ALTER FUNCTION card_templates_delete() SET search_path = public, pg_temp;

-- Fix workflow functions (skip if function doesn't exist)
DO $$
BEGIN
  -- update_updated_at_column
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    ALTER FUNCTION update_updated_at_column() SET search_path = public, pg_temp;
  END IF;

  -- reset_to_first_stage
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'reset_to_first_stage') THEN
    ALTER FUNCTION reset_to_first_stage(uuid) SET search_path = public, pg_temp;
  END IF;

  -- advance_to_next_stage
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'advance_to_next_stage') THEN
    ALTER FUNCTION advance_to_next_stage(uuid) SET search_path = public, pg_temp;
  END IF;

  -- initialize_mockup_stage_progress
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'initialize_mockup_stage_progress') THEN
    ALTER FUNCTION initialize_mockup_stage_progress(uuid, uuid) SET search_path = public, pg_temp;
  END IF;

  -- validate_workflow_stages
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'validate_workflow_stages') THEN
    ALTER FUNCTION validate_workflow_stages(jsonb) SET search_path = public, pg_temp;
  END IF;

  -- check_folder_depth
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'check_folder_depth') THEN
    ALTER FUNCTION check_folder_depth() SET search_path = public, pg_temp;
  END IF;
END $$;

COMMENT ON FUNCTION card_mockups_insert IS 'INSTEAD OF INSERT trigger for card_mockups view. Search path secured.';
COMMENT ON FUNCTION card_mockups_update IS 'INSTEAD OF UPDATE trigger for card_mockups view. Search path secured.';
COMMENT ON FUNCTION card_mockups_delete IS 'INSTEAD OF DELETE trigger for card_mockups view. Search path secured.';
COMMENT ON FUNCTION card_templates_insert IS 'INSTEAD OF INSERT trigger for card_templates view. Search path secured.';
COMMENT ON FUNCTION card_templates_update IS 'INSTEAD OF UPDATE trigger for card_templates view. Search path secured.';
COMMENT ON FUNCTION card_templates_delete IS 'INSTEAD OF DELETE trigger for card_templates view. Search path secured.';
