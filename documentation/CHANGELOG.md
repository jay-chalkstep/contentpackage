# Changelog

All notable changes to Aiproval will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.3.0] - 2025-01-24

### 📁 Projects Feature (Phase 1)

This release introduces **Projects** - a new organizational layer for managing mockups by client engagement. Projects act as containers to group related mockups together, making it easier to organize work by client, campaign, or initiative.

### ✨ Added

#### Project Management System
- **Create Projects**: New project creation with name, client name, description, status, and custom color
- **Project Status Types**: Three status options for workflow management
  - **Active**: Currently in progress projects
  - **Completed**: Finished projects
  - **Archived**: Historical projects for reference
- **Color Customization**: Choose from 8 preset colors for visual organization
  - Blue (#3B82F6), Purple (#A855F7), Pink (#EC4899), Green (#10B981)
  - Orange (#F59E0B), Red (#EF4444), Indigo (#6366F1), Teal (#14B8A6)
- **Visual Mockup Previews**: Project cards display up to 4 thumbnail previews
- **Mockup Count Badges**: Real-time count of mockups per project

#### Projects List Page (`/projects`)
- **Grid Layout**: Clean card-based layout showing all projects
- **Search Functionality**: Search projects by name, client name, or description
- **Status Filtering**: Filter projects by Active, Completed, or Archived status
- **Quick Actions**: Edit and delete projects from card menu
- **Empty States**: Helpful guidance when no projects exist or no results found

#### Project Detail Page (`/projects/[id]`)
- **Project Overview**: Header with name, client, description, status, and color indicator
- **Mockup Gallery**: Grid view of all mockups assigned to the project
- **Mockup Search**: Search within project mockups
- **Mockup Actions**: View, download, and delete mockups directly from project view
- **Back Navigation**: Easy return to projects list

#### Database Schema
- **New Table**: `projects` with full metadata support
- **Status Enum**: `project_status` type ('active', 'completed', 'archived')
- **Mockup Association**: `project_id` column added to `card_mockups` table
- **Cascade Handling**: ON DELETE SET NULL ensures mockups preserved when project deleted
- **Performance Indexes**: Optimized queries for organization_id, status, and project_id
- **RLS Policies**: Secure access through API routes only

#### API Routes
- `GET /api/projects` - List all projects with mockup counts and previews
- `POST /api/projects` - Create new project with validation
- `GET /api/projects/[id]` - Get single project with full details
- `PATCH /api/projects/[id]` - Update project (name, client, description, status, color)
- `DELETE /api/projects/[id]` - Delete project (mockups preserved, unassigned)
- `GET /api/projects/[id]/mockups` - List all mockups for a project
- `PATCH /api/mockups/[id]` - Updated to support project_id assignment

#### UI Components
- **NewProjectModal**: Full-featured modal for creating projects
  - Required project name field (max 100 characters)
  - Optional client name and description
  - Status dropdown (defaults to 'active')
  - Color picker with 8 preset colors
  - Form validation and error handling
- **ProjectCard**: Reusable project card component
  - Color indicator bar on left edge
  - Project name and client name display
  - Status badge with color coding
  - Up to 4 mockup thumbnail previews
  - Mockup count and creation date
  - Action menu for edit/delete

### 🔧 Changed

- **Sidebar Navigation**: Added "Projects" item with Briefcase icon
- **Mockup API**: Extended to support project assignment via `project_id` field
- **TypeScript Types**: Added `Project`, `ProjectStatus` interfaces to `lib/supabase.ts`

### 📝 Technical Details

**New Files**:
- `supabase/07_projects.sql` - Database migration for projects feature
- `lib/supabase.ts` - Added Project and ProjectStatus TypeScript types
- `app/api/projects/route.ts` - Projects list and create API
- `app/api/projects/[id]/route.ts` - Individual project CRUD API
- `app/api/projects/[id]/mockups/route.ts` - Project mockups listing API
- `components/projects/NewProjectModal.tsx` - Project creation modal
- `components/projects/ProjectCard.tsx` - Project card component
- `app/(dashboard)/projects/page.tsx` - Projects list page
- `app/(dashboard)/projects/[id]/page.tsx` - Project detail page

**Modified Files**:
- `app/api/mockups/[id]/route.ts` - Added project_id support for assignment
- `components/SidebarSimple.tsx` - Added Projects navigation link

**Database Changes**:
- New enum type: `project_status`
- New table: `projects` with 10 fields
- New column: `card_mockups.project_id` (nullable UUID)
- New indexes: 5 performance indexes for projects and mockup queries
- New trigger: `update_projects_updated_at` for timestamp management

**Key Features**:
- Organization-scoped: All projects isolated by `organization_id`
- Permission-based: Only project creator or org admin can edit/delete
- Backward compatible: Existing mockups work without projects
- Nullable association: Mockups can exist without project assignment
- Soft delete: Deleting project unassigns mockups (doesn't delete them)

### 🔄 Database Migration Required

**Before using this version**, you must run the database migration:

1. Open Supabase SQL Editor
2. Execute `supabase/07_projects.sql`
3. Verify tables and columns created successfully

The migration is **backward compatible** - all existing data will continue to work.

### 🎯 What's Next (Phase 2 Roadmap)

Future enhancements planned for Projects:
- **Multi-column Kanban Layout**: Drag-and-drop between project status columns
- **Bulk Operations**: Assign multiple mockups to a project at once
- **Project Selector in Mockup Library**: Quick-assign dropdown in mockup cards
- **Project Editing Modal**: In-place editing without navigation
- **Advanced Filtering**: Filter by date range, creator, mockup count
- **Project Templates**: Save project configurations as templates
- **Project Analytics**: Time tracking, completion rates, mockup velocity
- **Project Sharing**: Share project URLs with clients for review
- **Export Project**: Download all mockups as ZIP archive

---

## [2.2.0] - 2025-01-24

### 🎨 UI Enhancements & Rebranding

This release introduces a collapsible sidebar for maximum canvas space and rebrands the platform to **Aiproval** with an emphasis on collaboration and validation workflows.

### ✨ Added

#### Collapsible Icon Sidebar
- **Toggle Functionality**: Collapse sidebar to 64px (icon-only) or expand to 256px (full labels)
- **Extra Canvas Space**: Gain ~200px horizontal space when collapsed
- **Icon Tooltips**: Hover tooltips on navigation icons when collapsed
- **Persistent State**: User preference saved in localStorage across sessions
- **Smooth Animations**: 300ms transitions following modern design tool patterns (Figma, Linear, VS Code)
- **SidebarContext**: New React Context for managing sidebar collapse state globally
- **Dynamic Layouts**: Dashboard and root layouts adjust margins based on sidebar state
- **Default Collapsed**: Sidebar defaults to collapsed for maximum canvas space

#### Rebranding to Aiproval
- **New Name**: Rebranded from "Asset Studio" to "Aiproval"
- **New Tagline**: "Collaborate and Validate"
- **Clickable Branding**: Header and sidebar branding link to homepage
- **Updated Copy**: Emphasis on collaboration and validation workflows
- **Hover Effects**: Interactive visual feedback on branding elements

### 🔧 Changed

- **Sidebar Width**: Dynamic width based on collapsed state (64px ↔ 256px)
- **Main Content Margin**: Adjusts dynamically (ml-16 ↔ ml-64) for smooth transitions
- **Navigation Display**: Icons-only mode with tooltips when collapsed
- **Accordion Behavior**: Auto-collapses when sidebar is collapsed
- **Organization Switcher**: Adapts to icon-only mode in collapsed state

### 📝 Technical Details

**New Files**:
- `lib/contexts/SidebarContext.tsx` - Sidebar state management with localStorage

**Modified Files**:
- `components/Header.tsx` - Aiproval branding + clickable homepage link
- `components/SidebarSimple.tsx` - Collapsible UI logic + tooltips
- `app/layout.tsx` - SidebarProvider wrapper
- `app/(dashboard)/layout.tsx` - Dynamic margin logic based on sidebar state
- `app/page.tsx` - Updated homepage branding and tagline
- `documentation/README.md` - Updated branding throughout
- `documentation/CHANGELOG.md` - Updated project name

**Key Features**:
- Default state: Collapsed (prioritize canvas space)
- localStorage key: `asset-studio-sidebar-collapsed`
- Transition duration: 300ms
- Mobile behavior: Unchanged (slide in/out)

---

## [2.1.0] - 2025-01-23

### 🎨 Enhanced Collaboration Features

This release completes the visual collaboration system with zoom controls, visual annotation linking, and real-time updates.

### ✨ Added

#### Zoom and Pan Controls
- **Zoom Range**: 25% to 400% with 25% increments
- **Mouse Wheel Zoom**: Scroll to zoom in/out, centered on cursor position
- **Zoom Buttons**: In-canvas UI controls for zoom in, zoom out, reset, and fit to screen
- **Live Zoom Percentage**: Real-time display of current zoom level
- **Pan with Select Tool**: Click-drag to pan around canvas when zoomed in
- **Smart Cursor**: Changes to grab/grabbing icons when panning

#### Visual Annotation-Comment Linking
- **Numbered Badges**: Sequential numbers (1, 2, 3...) on canvas annotations
- **Matching Comment Numbers**: Same numbers displayed in sidebar comments
- **Hover Highlighting**: Hover over comment → highlights annotation on canvas
- **Reverse Hover**: Hover over annotation → highlights comment in sidebar
- **Visual Feedback**: Thicker strokes, pulsing circles, background colors on hover
- **Color Coordination**: Badge colors match annotation colors

#### Real-Time Updates
- **Immediate Comment Display**: New comments appear instantly without page refresh
- **Auto-Refresh**: Comments refetch automatically after creation

### 🐛 Fixed

- **Rounded Corners**: Card templates now render with proper rounded corners (2.5% radius)
- **Comments Not Persisting**: Fixed RLS policy blocking by routing through API endpoints
- **Annotations Not Displaying**: Changed from direct Supabase queries to API route calls
- **Export Scale**: Zoom level no longer affects exported mockup resolution

### 🔧 Changed

- **Removed Realtime Subscriptions**: Replaced with polling for better reliability with Clerk Auth
- **API-First Architecture**: All comment/reviewer queries now use API routes instead of direct Supabase client
- **Canvas Coordinate System**: Annotations now support zoom transformations

### 📝 Technical Details

**Files Modified**:
- `components/collaboration/MockupCanvas.tsx` - Zoom controls, numbered badges, hover handlers
- `components/collaboration/CommentsSidebar.tsx` - Comment numbers, hover highlighting
- `app/(dashboard)/mockups/[id]/page.tsx` - Hover state management, refetch logic
- `components/KonvaCanvas.tsx` - Rounded corner rendering

**Database**: No schema changes (fully compatible with v2.0.0)

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

**Aiproval** (formerly Asset Studio / Logo Finder) is a comprehensive collaboration and validation platform for design review and approval workflows. Built for design teams, marketing departments, and agencies who need to:

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

- **v2.3.0** (2025-01-24) - Projects Feature (Phase 1) - Client Engagement Organization
- **v2.2.0** (2025-01-24) - Collapsible Sidebar UI, Aiproval Rebranding
- **v2.1.0** (2025-01-23) - Collaboration Enhancements, Visual Linking
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

*Maintained by the Aiproval team*
