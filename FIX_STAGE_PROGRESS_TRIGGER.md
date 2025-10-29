# Fix Stage Progress Trigger

## The Problem
Migration 13 renamed the `mockup_id` column to `asset_id` in the `mockup_stage_progress` table, but the trigger function `initialize_mockup_stage_progress()` still references the old column name `mockup_id`.

When you try to save a mockup/asset, the trigger fires and tries to insert using `mockup_id`, which no longer exists, causing the error:
```
column "mockup_id" does not exist
```

## The Fix
Run migration `17_fix_stage_progress_trigger.sql` to update the trigger functions to use `asset_id`.

## Steps to Apply the Fix

### Option 1: Via Supabase Dashboard (Recommended)
1. Go to https://supabase.com/dashboard/project/ejsxxxudheaarxwyttcf/sql/new
2. Copy the entire contents of `supabase/17_fix_stage_progress_trigger.sql`
3. Paste into the SQL editor
4. Click "Run" to execute the migration

### Option 2: Via Supabase CLI
```bash
cd "/Users/jaygrinde/Content Package/logo-finder"
supabase db push
```

## What This Does
Updates three functions to use `asset_id` instead of `mockup_id`:
1. `initialize_mockup_stage_progress()` - trigger that fires when inserting mockups
2. `advance_to_next_stage()` - moves mockup to next workflow stage
3. `reset_to_first_stage()` - resets mockup back to stage 1

## Verify the Fix
After running the migration, try saving an asset in the designer - it should work now.
