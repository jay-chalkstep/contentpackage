# Migration 12 Testing Guide

## How to Test the Multi-Tenancy Fix

### Step 1: Run the Migration in Supabase SQL Editor

1. Go to your Supabase Dashboard → SQL Editor
2. Copy and paste the entire contents of `12_fix_brands_multi_tenancy.sql`
3. Click "Run" to execute the migration

**Expected Output:**
- All statements should complete successfully
- You should see "Success. No rows returned" for most operations

### Step 2: Verify the Schema Changes

Run this query to confirm the changes:

```sql
-- Check that organization_id column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'brands'
ORDER BY ordinal_position;
```

**Expected Result:**
- You should see `organization_id` column with type `text` and `is_nullable = YES`

### Step 3: Verify the Unique Constraint

Run this query to confirm the constraint was updated:

```sql
-- Check unique constraints on brands table
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'brands' AND constraint_type = 'UNIQUE';
```

**Expected Result:**
- You should see `brands_domain_organization_key` (the new composite constraint)
- You should NOT see `brands_domain_key` (the old global constraint)

### Step 4: Check for Legacy Brands

Run this query to see if you have any brands without organization_id:

```sql
-- Count legacy brands that need cleanup
SELECT COUNT(*) as legacy_brands FROM brands WHERE organization_id IS NULL;
```

**If you have legacy brands:**
- Option A (Recommended for testing): Delete them with `DELETE FROM brands WHERE organization_id IS NULL;`
- Option B (Production): Manually reassign them to the correct organization

### Step 5: Test Multi-Tenant Brand Saving

**In the Application:**

1. **Open Organization 1** in your browser
2. Search for "Spotify" (or any brand)
3. Click "Save" to add it to your library
4. Note the success message

5. **Switch to Organization 2** using the Clerk organization switcher
6. Search for "Spotify" again
7. Click "Save" to add it to Organization 2's library
8. **This should now succeed** (previously it would fail with duplicate key error)

**Verify in Database:**

```sql
-- You should see TWO Spotify brands, one for each organization
SELECT
  id,
  company_name,
  domain,
  organization_id,
  created_at
FROM brands
WHERE domain = 'spotify.com'
ORDER BY created_at DESC;
```

**Expected Result:**
- Two rows, each with a different `organization_id`
- Both have `domain = 'spotify.com'`

### Step 6: Test Duplicate Prevention Within Same Org

1. **Stay in Organization 2**
2. Try to save "Spotify" again (search and click save)
3. **This should fail** with a duplicate error (as expected - same org cannot have duplicate brands)

**Verify in Console:**
- You should see an error about duplicate constraint

### Step 7: Verify Related Tables

Run this to ensure brand_colors, brand_fonts, and logo_variants have proper indexes:

```sql
-- Check indexes on related tables
SELECT tablename, indexname
FROM pg_indexes
WHERE tablename IN ('brand_colors', 'brand_fonts', 'logo_variants')
  AND indexname LIKE '%organization_id%';
```

**Expected Result:**
- Indexes exist for organization_id on all three tables

## Success Criteria

✅ Migration runs without errors
✅ `organization_id` column exists on brands table
✅ Composite unique constraint `brands_domain_organization_key` exists
✅ Old `brands_domain_key` constraint is gone
✅ Different organizations can save the same brand domain
✅ Same organization cannot save duplicate brand domains
✅ Legacy brands (if any) are identified and cleaned up

## Rollback (If Needed)

If something goes wrong, you can rollback with:

```sql
-- Rollback migration (CAUTION: Only use if migration failed)
ALTER TABLE brands DROP CONSTRAINT IF EXISTS brands_domain_organization_key;
ALTER TABLE brands ADD CONSTRAINT brands_domain_key UNIQUE (domain);
ALTER TABLE brands DROP COLUMN IF EXISTS organization_id;
DROP INDEX IF EXISTS idx_brands_organization_id;
DROP INDEX IF EXISTS idx_brand_colors_organization_id;
DROP INDEX IF EXISTS idx_brand_fonts_organization_id;
DROP INDEX IF EXISTS idx_logo_variants_organization_id;
```

## After Testing

Once you've confirmed everything works:
1. ✅ Mark test results in this file
2. ✅ Update CHANGELOG.md with version 3.4.1
3. ✅ Commit the migration file to version control
4. ✅ Deploy to production (run migration in production Supabase)

---

**Test Date:** _____________
**Tested By:** _____________
**Result:** ☐ Pass  ☐ Fail
**Notes:** _____________________________________________
