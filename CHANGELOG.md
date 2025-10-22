# Changelog

All notable changes to Asset Studio will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.0.0] - 2025-01-22

### 🎉 Major Release: Folder Organization System

This major release introduces a comprehensive folder-based organization system for mockups, along with significant improvements to multi-tenancy, mobile experience, and Next.js 15 compatibility.

### ✨ New Features

#### Folder Organization System
**The headline feature of v2.0.0** - A complete workspace organization system for managing mockups.

- **Personal Folders**: Users can create their own folder hierarchy to organize mockups
- **Nested Folders**: Support for up to 5 levels of folder nesting with automatic depth validation
- **Org-Shared Folders**: Admin users can create organization-wide shared folders
- **Two-Panel Library Layout**: New sidebar + grid layout for intuitive folder navigation
- **Smart Unsorted Folder**: Virtual folder automatically shows mockups not in any folder
- **Folder Actions**: Right-click context menus for create, rename, delete, and share operations
- **Move Mockups**: Inline folder selector to move mockups between folders
- **Folder Counts**: Real-time mockup count badges on folders
- **Search Within Folders**: Search functionality scoped to selected folder

**Database Changes**:
- New migration: `04_folder_organization.sql`
- New table: `folders` with support for hierarchy and org sharing
- Added `created_by` (Clerk user ID) to `card_mockups`, `card_templates`, `brands`
- Added `folder_id` reference to `card_mockups`
- Full backward compatibility - existing mockups work without migration

**UI Components**:
- `FolderTree`: Hierarchical folder navigator with expand/collapse
- `CreateFolderModal`: Folder creation with validation
- `RenameFolderModal`: Rename folders with duplicate checking
- `DeleteFolderModal`: Delete with cascade warnings and mockup preservation
- `FolderSelector`: Dropdown selector for assigning folders

**API Routes**:
- `GET /api/folders` - List user's folders (personal + shared)
- `POST /api/folders` - Create new folder
- `PATCH /api/folders/[id]` - Rename folder or toggle org sharing
- `DELETE /api/folders/[id]` - Delete folder (mockups moved to unsorted)
- `PATCH /api/mockups/[id]` - Move mockup to folder
- `DELETE /api/mockups/[id]` - Delete mockup with storage cleanup

#### Organization-Scoped Data Isolation
- **Multi-Tenant Architecture**: Complete data isolation between organizations
- **Organization Filtering**: All queries automatically filtered by `organization_id`
- **Organization Switcher**: Clerk's OrganizationSwitcher integrated in sidebar
- **Admin Role Support**: Organization admin vs member role enforcement
- **Secure RLS Policies**: Row-level security at database level

### 🔧 Improvements

#### Next.js 15 Compatibility
- Updated all API routes to support Next.js 15's async `params`
- Fixed async `auth()` calls throughout the application
- Resolved Lucide React icon prop compatibility issues
- Successfully compiling with Next.js 15.5.5 and Turbopack

#### Mobile Responsiveness
- **Comprehensive Mobile UI**: Full responsive design for all screens
- **Fixed Sidebar**: Desktop sidebar stays fixed, mobile slides in/out
- **Hamburger Menu**: Relocated to header for better mobile UX
- **Overflow Fixes**: Resolved horizontal scroll issues on mobile
- **Touch-Friendly**: Larger touch targets and spacing for mobile users
- **Sticky Header**: Improved header behavior with user name display

#### User Experience
- **Auto-Navigation**: After logo upload, automatically redirects to library view
- **Collapsible Navigation**: Accordion-style navigation in sidebar
- **Authentication Pages**: Clean auth pages without sidebar/header
- **User Profile**: Display user name and photo in header
- **Toast Notifications**: Consistent success/error feedback

### 🐛 Bug Fixes

- Fixed Brandfetch logo save to include `organization_id` in brands and variants
- Fixed 404 errors in upload redirects (now correctly points to `/search`)
- Fixed duplicate "Organization Settings" page in admin section
- Fixed admin page authentication for Next.js 15
- Fixed hamburger button z-index for proper mobile visibility
- Fixed various admin page import and async issues

### 📦 Dependencies

- **Next.js**: 15.5.5 (with Turbopack)
- **React**: 19.1.0
- **@clerk/nextjs**: ^6.33.7 (for authentication)
- **@clerk/themes**: ^2.4.28 (dark theme support)
- **@supabase/supabase-js**: ^2.75.0
- **konva**: ^10.0.2 (canvas mockup editor)
- **react-konva**: ^19.0.10
- **lucide-react**: ^0.546.0 (icons)
- **Tailwind CSS**: ^4

### 🗄️ Database Migrations

**Required for v2.0.0**:
```sql
-- Run in Supabase SQL Editor:
-- 1. supabase/01_initial_schema.sql (if not already run)
-- 2. supabase/02_brand_centric.sql (if not already run)
-- 3. supabase/03_storage_setup.sql (if not already run)
-- 4. supabase/04_folder_organization.sql (NEW in v2.0.0)
```

**Migration 04 adds**:
- `folders` table with hierarchy support
- `created_by` field to existing tables
- `folder_id` link from mockups to folders
- Indexes for performance
- Folder depth validation (max 5 levels)
- Helper view for mockup counts

**⚠️ Important**: Migration 04 is **backward compatible**. Existing mockups without `folder_id` appear in the "Unsorted" folder. No data loss or breaking changes.

### 🔄 Upgrade Instructions

1. **Pull latest code**:
   ```bash
   git pull origin main
   git checkout v2.0.0
   npm install
   ```

2. **Run database migration**:
   - Open Supabase SQL Editor
   - Execute `supabase/04_folder_organization.sql`

3. **Build and deploy**:
   ```bash
   npm run build
   # Deploy to your hosting platform
   ```

4. **Test new features**:
   - Create folders in Mockup Library
   - Save new mockups to folders
   - Move existing mockups to organize them

### 📝 Breaking Changes

**None!** This release is fully backward compatible. All existing mockups, templates, and brands continue to work exactly as before.

### 🎯 What's Next (v2.1.0 Roadmap)

Potential features for the next release:
- Drag-and-drop mockup organization
- Bulk mockup operations (move, delete)
- Folder color coding
- Export folder as ZIP
- Mockup version history
- Folder templates
- Enhanced search across folders

---

## [1.1.0] - 2024-10-21

### Added
- Organization-scoped data features
- Multi-tenant support with Clerk Organizations
- Initial folder structure planning

### Changed
- Improved organization switcher UI
- Enhanced admin permission handling

---

## [1.0.1] - 2024-10-19

### Fixed
- Brand-centric data model migration issues
- Storage bucket policy refinements

---

## [1.0.0] - 2024-10-18

### 🎉 Initial Stable Release

**Asset Studio** - Logo search, brand asset management, and mockup creation tool.

#### Core Features

**Logo Search & Management**:
- Brandfetch API integration for company logo search
- Search by domain name or company name
- Multiple logo variants (SVG, PNG, light/dark themes)
- Brand color palette extraction
- Font information capture
- Save logos to personal library

**Brand Library**:
- Personal brand collection
- Brand-centric data model (one brand → multiple logo variants)
- Logo variant management
- Brand colors and fonts storage
- Organization-based data isolation

**Mockup Designer**:
- Interactive canvas-based designer using Konva.js
- Drag-and-drop logo placement
- Position controls (arrows, presets, numeric input)
- Size controls with aspect ratio lock
- Grid overlay for precise alignment
- High-resolution export (2x pixel ratio)
- Template background selection

**Template Management**:
- Upload custom templates
- Template library with organization filtering
- Card template support (business cards, badges, etc.)

**Authentication & Multi-Tenancy**:
- Clerk authentication integration
- Organization support with role-based access
- Admin vs user permissions
- Organization switcher
- Secure sign-in/sign-up flows

**Database & Storage**:
- Supabase PostgreSQL database
- Supabase Storage for file hosting
- Row-level security (RLS) policies
- Three storage buckets: logos, card-templates, card-mockups
- Brand-centric schema with proper relationships

**User Interface**:
- Modern, clean design with Tailwind CSS
- Responsive layout (desktop-first)
- Sidebar navigation
- Toast notifications for user feedback
- Modal-based workflows

#### Database Schema (v1.0.0)

**Tables**:
- `brands` - Company/brand information
- `logo_variants` - Multiple logo files per brand
- `brand_colors` - Color palettes
- `brand_fonts` - Typography information
- `card_templates` - Design templates
- `card_mockups` - Generated mockup data

**Migrations**:
1. `01_initial_schema.sql` - Base tables and RLS
2. `02_brand_centric.sql` - Brand-centric restructuring
3. `03_storage_setup.sql` - Storage bucket policies

---

## Project Overview

**Asset Studio** (formerly Logo Finder) is a comprehensive SaaS application for managing brand assets and creating professional mockups. Built for design teams, marketing departments, and agencies who need to:

- **Search & Save**: Find company logos via Brandfetch API and save to personal library
- **Organize**: Manage brand assets with full color and font metadata
- **Create**: Design mockups using an interactive canvas editor
- **Collaborate**: Share assets within organizations with role-based access
- **Scale**: Multi-tenant architecture supporting unlimited organizations

**Technology Stack**:
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Canvas**: Konva.js + React-Konva
- **Auth**: Clerk (with organization support)
- **Database**: Supabase (PostgreSQL + Storage)
- **Build**: Turbopack
- **Deployment**: Vercel-ready

**Key Differentiators**:
- Brand-centric data model (not just individual logos)
- Organization-based multi-tenancy
- Folder organization for workspace management
- Interactive mockup designer with live preview
- Automatic asset metadata extraction
- Full backward compatibility across versions

---

## Version History Summary

- **v2.0.0** (2025-01-22) - Folder Organization System, Next.js 15, Mobile UX
- **v1.1.0** (2024-10-21) - Organization-scoped data, multi-tenancy
- **v1.0.1** (2024-10-19) - Bug fixes and schema improvements
- **v1.0.0** (2024-10-18) - Initial stable release

---

## Contributing

When submitting changes:
1. Update this CHANGELOG.md
2. Bump version in package.json (follow semantic versioning)
3. Create git tag for releases
4. Document any database migrations required

---

## Links

- **Repository**: https://github.com/jay-chalkstep/contentpackage
- **Issue Tracker**: https://github.com/jay-chalkstep/contentpackage/issues
- **Documentation**: See README.md and SETUP_GUIDE.md

---

*Maintained by the Asset Studio team*
