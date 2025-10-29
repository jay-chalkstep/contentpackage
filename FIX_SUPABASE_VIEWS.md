# Fix Supabase Security Definer Views

## The Problem
The views `card_mockups`, `card_templates`, and `folder_mockup_counts` were created with implicit SECURITY DEFINER, which means they run with the permissions of the view creator rather than the caller. This blocks the service role from accessing them.

## The Fix
Run the migration script to recreate these views with SECURITY INVOKER.

## Steps to Apply the Fix

### Option 1: Via Supabase Dashboard (Recommended)
1. Go to https://supabase.com/dashboard/project/ejsxxxudheaarxwyttcf/sql/new
2. Copy the entire contents of `supabase/14_fix_security_definer_views.sql`
3. Paste into the SQL editor
4. Click "Run" to execute the migration
5. Verify the errors are gone in the Database → Advisors section

### Option 2: Via Supabase CLI
```bash
cd "/Users/jaygrinde/Content Package/logo-finder"
supabase db push
```

## What This Does
- Drops the old security definer views
- Recreates them with `WITH (security_invoker = true)`
- This makes the views run with the **caller's permissions** (service role) instead of the creator's
- Fixes the folder_mockup_counts view to use the new `assets` table name

## Verify the Fix
After running the migration:
1. Go to Database → Advisors in Supabase dashboard
2. The 4 errors should be gone
3. Refresh your app and template upload should work
