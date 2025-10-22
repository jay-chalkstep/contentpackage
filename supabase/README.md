# Supabase Database Setup

This directory contains the SQL migration files needed to set up your Logo Finder database.

## Quick Start

### 1. Create a Supabase Project
1. Go to https://supabase.com
2. Create a new project
3. Wait for the database to initialize

### 2. Run Migrations (IN ORDER!)

Open the Supabase SQL Editor and run each file in this exact order:

#### Step 1: Initial Schema
**File:** `01_initial_schema.sql`

Creates the foundational database tables:
- `logos` - Logo storage table
- `brand_colors` - Brand color palettes
- `brand_fonts` - Brand typography
- `card_templates` - Design templates
- `card_mockups` - Generated mockups
- Indexes, triggers, and RLS policies

#### Step 2: Brand-Centric Migration
**File:** `02_brand_centric.sql`

Restructures the database to use a brand-centric model:
- Creates `brands` table for company information
- Migrates `logos` → `logo_variants` (multiple logos per brand)
- Updates foreign key relationships
- Links colors and fonts to brands instead of individual logos

#### Step 3: Storage Setup
**File:** `03_storage_setup.sql`

Sets up file storage buckets and access policies:
- Instructions for creating storage buckets
- RLS policies for file access
- Public read, authenticated write access

#### Step 4: Folder Organization (Optional)
**File:** `04_folder_organization.sql`

Adds folder-based organization and user-level tracking:
- Creates `folders` table for mockup organization
- Adds `created_by` tracking to mockups, templates, and brands
- Links mockups to folders for personal workspace organization
- Supports hybrid user/org folder model
- **Backward compatible** - existing mockups continue to work

### 3. Create Storage Buckets

After running the SQL migrations, create these buckets in the Supabase Dashboard (Storage section):

| Bucket Name | Public | Description |
|------------|--------|-------------|
| `logos` | Yes | Logo image files |
| `card-templates` | Yes | Card template images |
| `card-mockups` | Yes | Generated mockup images |

Then run the storage policies from `03_storage_setup.sql`.

### 4. Get Your Credentials

Go to Settings > API in your Supabase project and copy:
- Project URL → `NEXT_PUBLIC_SUPABASE_URL`
- Anon/Public Key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Add these to your `.env.local` file.

## Data Model Overview

```
brands (company information)
  ├─→ logo_variants (multiple logo files per brand)
  ├─→ brand_colors (color palette)
  └─→ brand_fonts (typography)

card_templates (design templates)

folders (organization structure) [OPTIONAL - if 04 migration applied]
  ├─→ parent_folder_id (self-reference for nesting)
  └─→ created_by (user ownership)

card_mockups (generated mockups)
  ├─→ links to: logo_variants
  ├─→ links to: card_templates
  └─→ links to: folders (optional) [if 04 migration applied]
```

## Troubleshooting

### Migration Errors

**Error:** "relation already exists"
- **Solution:** The migration has already been run. Skip to the next file.

**Error:** "column already exists"
- **Solution:** The migration has been partially run. Review what's completed and continue from there.

**Error:** "foreign key violation"
- **Solution:** Make sure you run migrations in order (01 → 02 → 03).

### Storage Issues

**Uploads failing**
- Ensure buckets are created and set to "public"
- Check that storage policies are applied
- Verify bucket names match exactly: `logos`, `card-templates`, `card-mockups`

**Images not displaying**
- Check that buckets are public
- Verify the public URL format is correct
- Check browser console for CORS errors

### RLS (Row Level Security) Issues

**Error:** "new row violates row-level security policy"
- **Solution:** The RLS policies in the migrations allow all operations for authenticated users
- Make sure you're logged in when testing
- For a single-user app, RLS is enabled but permissive

## Development vs Production

### Development
- Use the Supabase SQL Editor to run migrations manually
- Test each migration before moving to the next
- Check the Tables and Storage sections to verify changes

### Production
- Run all migrations in a fresh Supabase project
- Use Supabase CLI for automated migrations:
  ```bash
  supabase db push
  ```
- Always backup your database before running migrations

## Support

For issues with:
- **Supabase:** https://supabase.com/docs
- **This app:** Check the main README.md or open an issue

## File Reference

| File | Purpose | Run When |
|------|---------|----------|
| `01_initial_schema.sql` | Create base tables | First time setup |
| `02_brand_centric.sql` | Migrate to brand model | After 01 |
| `03_storage_setup.sql` | Storage buckets & policies | After 02 |
| `04_folder_organization.sql` | Folder system & user tracking (optional) | After 03 |

**Total setup time:** ~5-10 minutes (or ~8-12 with optional folder migration)
