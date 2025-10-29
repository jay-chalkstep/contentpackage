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

-- Fix workflow functions
ALTER FUNCTION IF EXISTS update_updated_at_column() SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS reset_to_first_stage(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS advance_to_next_stage(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS initialize_mockup_stage_progress(uuid, uuid) SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS validate_workflow_stages(jsonb) SET search_path = public, pg_temp;

-- Fix folder functions
ALTER FUNCTION IF EXISTS check_folder_depth() SET search_path = public, pg_temp;

COMMENT ON FUNCTION card_mockups_insert IS 'INSTEAD OF INSERT trigger for card_mockups view. Search path secured.';
COMMENT ON FUNCTION card_mockups_update IS 'INSTEAD OF UPDATE trigger for card_mockups view. Search path secured.';
COMMENT ON FUNCTION card_mockups_delete IS 'INSTEAD OF DELETE trigger for card_mockups view. Search path secured.';
COMMENT ON FUNCTION card_templates_insert IS 'INSTEAD OF INSERT trigger for card_templates view. Search path secured.';
COMMENT ON FUNCTION card_templates_update IS 'INSTEAD OF UPDATE trigger for card_templates view. Search path secured.';
COMMENT ON FUNCTION card_templates_delete IS 'INSTEAD OF DELETE trigger for card_templates view. Search path secured.';
