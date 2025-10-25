# Changelog

All notable changes to **Aiproval** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [3.1.1] - 2025-01-25

### 🎨 **Stage Reviewer Assignment UI**

This release completes the workflow system by adding the missing user interface for assigning reviewers to workflow stages at the project level. The backend API existed since v3.0.0, but there was no way for users to actually assign reviewers through the UI.

### Added

#### Stage Reviewer Management Components
- **ProjectStageReviewers Component** - Visual stage reviewer management interface
  - Grid layout showing all workflow stages with color coding
  - Display assigned reviewers per stage with avatars
  - Add/remove reviewer buttons per stage
  - Empty states for stages without reviewers
  - Real-time updates after reviewer changes
- **AddStageReviewerModal Component** - Modal for assigning reviewers to stages
  - Organization member selector dropdown
  - Stage context display (name, color, order)
  - Member preview with avatar and email
  - Validation and error handling
  - Loading states during submission

#### Integration
- **Project Detail Page Enhancement** - Added stage reviewer management section
  - Displays above workflow board when project has workflow
  - Shows all stages with assigned reviewers
  - Provides clear interface for team assignment
  - Refreshes project data after reviewer updates

### Changed
- **Project Detail Page** (`app/(dashboard)/projects/[id]/page.tsx`)
  - Now includes ProjectStageReviewers component
  - Better visual hierarchy (reviewers → workflow board → mockups)

### Technical

#### New Components
- `components/projects/ProjectStageReviewers.tsx` - Main reviewer management component
- `components/projects/AddStageReviewerModal.tsx` - Reviewer assignment modal

#### API Integration
- Uses existing `/api/projects/[id]/reviewers` endpoints:
  - GET - Fetch stage reviewers
  - POST - Add reviewer to stage
  - DELETE - Remove reviewer from stage
- Uses existing `/api/org/members` endpoint for organization member list

#### Features
- Stage color consistency throughout UI
- Organization member fetching from Clerk
- Optimistic UI updates
- Toast-style notifications
- Proper loading and error states

### Benefits
- ✅ **Complete Workflow Feature** - Users can now assign reviewers to stages (missing piece from v3.0.0)
- ✅ **Visual Stage Management** - Clear color-coded interface for each stage
- ✅ **Team Collaboration** - Easy assignment of organization members to review stages
- ✅ **Intuitive UX** - Add/remove reviewers directly from project detail page
- ✅ **Better Discoverability** - Reviewers visible and manageable alongside workflow board

---

## [3.1.0] - 2025-01-25

### 🎯 **Navigation Redesign & System Simplification**

This release removes the redundant ad-hoc reviewer system and introduces a completely redesigned navigation with improved information architecture and clearer grouping.

### Removed

#### Legacy Review System
- **Old Ad-Hoc Reviewer System** - Removed entire legacy review invitation system
  - Deleted `/reviews` page (old "My Reviews" dashboard)
  - Deleted reviewer invitation modal and API routes
  - Removed `mockup_reviewers` database table
  - Removed collaboration email templates for old system
  - Cleaned up mockup detail page (removed reviewer tab and invitation buttons)
  - Removed reviewer functionality from CommentsSidebar
- **Reason**: Redundant with new stage-based workflow approval system introduced in v3.0.0

### Changed

#### Navigation Redesign
- **Grouped Navigation Structure** - Complete sidebar redesign with logical hierarchy:
  - **Brand Assets** group
    - Logo Library (was "Search & Library")
    - Upload Logo
    - Template Library (was "Card Library")
    - Upload Template
  - **Mockups** group
    - Designer (was "Asset Designer")
    - Library (was "Mockup Library")
    - Projects
  - **Approvals** group
    - My Reviews (now points to `/my-stage-reviews` - stage-based workflow reviews only)
  - **Admin** group (unchanged)
    - Workflows
    - User Management
- **Collapsible Groups** - Each navigation group can be expanded/collapsed independently
- **Simplified Labels** - Shorter, clearer navigation labels (context provided by grouping)
- **Better Information Architecture** - Logical workflow progression: Assets → Mockups → Approvals

#### UI Improvements
- **CommentsSidebar** - Now comments-only (removed redundant reviewer tab)
- **Mockup Detail Page** - Cleaned up UI (removed old review request button)
- **Cleaner Icon Usage** - Removed unused icon imports throughout

### Technical

#### Database Migration
- **Migration 10** (`10_remove_old_review_system.sql`)
  - Drops `mockup_reviewers` table
  - Preserves `mockup_comments` table (still used for annotations)
  - Preserves `mockup_stage_progress` table (new workflow system)
  - Preserves `project_stage_reviewers` table (workflow stage assignments)

#### Files Deleted
- `app/(dashboard)/reviews/page.tsx`
- `app/api/mockups/[id]/reviewers/route.ts`
- `app/api/mockups/[id]/reviewers/[reviewerId]/route.ts`
- `components/collaboration/RequestFeedbackModal.tsx`
- `lib/email/collaboration.ts`

#### Files Modified
- `components/SidebarSimple.tsx` - Complete rewrite with grouped navigation
- `components/collaboration/CommentsSidebar.tsx` - Removed reviewer tab and related code
- `app/(dashboard)/mockups/[id]/page.tsx` - Removed reviewer state and invitation UI

### Benefits
- ✅ **Single Review System** - Only workflow-based stage reviews (no confusion)
- ✅ **Clearer Navigation** - Logical grouping makes features easier to find
- ✅ **Better UX** - Shorter labels, better context, cleaner UI
- ✅ **Reduced Complexity** - Removed redundant systems and code
- ✅ **Improved Workflow** - Natural progression through feature groups

---

## [3.0.0] - 2025-01-25

### 🎉 **MAJOR RELEASE - Active Approval Workflow System (Phase 3)**

This release transforms workflow templates from static configurations into a fully functional approval pipeline. Mockups now progress through multi-stage workflows with automatic tracking, reviewer assignments, and email notifications at every step.

### Added

#### Core Workflow Features
- **Stage Progress Tracking** - Automatic initialization when mockup assigned to workflow project
- **Sequential Stage Progression** - Mockups advance through stages (1 → 2 → 3...) sequentially
- **Approve/Request Changes Actions** - Reviewers can approve stages or send mockups back for revisions
- **Automatic Stage Advancement** - Approving a stage automatically moves to next stage and notifies reviewers
- **Change Request Reset** - Requesting changes resets mockup back to Stage 1 for revision
- **Stage Locking** - Only current `in_review` stage can be acted upon (prevents skipping stages)

#### UI Components
- **WorkflowBoard Component** - Kanban-style board showing mockups progressing through workflow stages
  - Color-coded columns per stage
  - Real-time status indicators
  - Mockup cards with thumbnails and stage progress
  - Empty states for stages with no mockups
- **StageStatusPill Component** - Visual status indicators with 4 states:
  - `pending` (gray) - Not yet reached
  - `in_review` (yellow) - Awaiting review
  - `approved` (green) - Stage completed
  - `changes_requested` (red) - Revisions needed
- **StageActionModal Component** - Two-tab modal for reviewers:
  - Approve tab with optional notes
  - Request Changes tab with required feedback
  - Warning about reset behavior on changes
- **Stage Action Banner** - Added to mockup detail page showing:
  - Current stage name and status
  - Approve/Request Changes buttons (for assigned reviewers)
  - Approved by badge (when stage completed)
  - Reviewer notes display

#### Pages & Routes
- **My Stage Reviews Dashboard** (`/my-stage-reviews`)
  - Centralized view of all pending stage reviews
  - Grouped by project
  - Stage badges with color coding
  - Direct links to review mockups
  - Empty state: "No pending reviews! 🎉"
- **Enhanced Project Detail Page**
  - Displays WorkflowBoard for projects with workflows
  - Shows mockup progress through stages
  - Live updates after stage actions

#### API Endpoints
- `GET /api/mockups/[id]/stage-progress` - Fetch stage progress with workflow details
- `POST /api/mockups/[id]/stage-progress/[stage_order]` - Approve or request changes
  - Validates reviewer permissions
  - Advances to next stage or resets to stage 1
  - Sends email notifications
- `GET /api/projects/[id]/mockups` - Enhanced to include stage progress data
  - Calculates `current_stage` and `overall_status` per mockup
  - Returns progress array with status for each stage
- `GET /api/reviews/my-stage-reviews` - Fetch pending reviews for current user
  - Returns projects with mockups awaiting review at user's assigned stages

#### Email Notifications
- **Stage Review Notification** - Sent when mockup reaches a reviewer's stage
  - Includes mockup name, project, stage details
  - CTA: "Review Now" button
- **Changes Requested Notification** - Sent to creator when changes requested
  - Includes reviewer feedback notes
  - Explains reset to Stage 1
- **All Stages Approved Notification** - Celebration email when final stage approved
  - Confirms completion through all stages
  - CTA: "View Approved Mockup"

#### Database
- **Migration 09** (`supabase/09_stage_progress.sql`)
  - `stage_status` enum: pending, in_review, approved, changes_requested
  - `mockup_stage_progress` table with full tracking
  - Auto-initialization trigger on mockup-project assignment
  - Helper functions:
    - `advance_to_next_stage(mockup_id, current_stage_order)` - Moves forward
    - `reset_to_first_stage(mockup_id)` - Resets on changes requested
  - Performance indexes on mockup_id, project_id, stage_order, status
  - Email notification tracking (sent timestamps)

#### TypeScript Types
- `StageStatus` type (pending | in_review | approved | changes_requested)
- `MockupStageProgress` interface
- `MockupWithProgress` helper type (extends CardMockup with progress data)
- `MockupStageProgressWithDetails` (includes workflow stage names/colors)

### Changed
- **Project Detail Page** - Now displays WorkflowBoard when project has workflow
- **Mockup Detail Page** - Shows stage action banner when mockup in workflow project
- **Sidebar Navigation** - Added "Stage Reviews" link for reviewer dashboard
- **Project Mockups API** - Enhanced to return stage progress with mockups

### Technical Details
- All stage transitions tracked with reviewer info, timestamps, and notes
- Stage progress auto-creates when mockup assigned to workflow project (via trigger)
- First stage set to `in_review`, others set to `pending`
- Email notifications queued but don't block API responses
- Optimistic UI updates for better UX
- Full audit trail preserved in database

### Performance Improvements
- Indexed queries on stage progress (mockup_id, project_id, stage_order)
- Batch email sending to avoid blocking
- Efficient JOIN queries for mockup + progress data

### Files Added
- `supabase/09_stage_progress.sql`
- `lib/email/stage-notifications.ts`
- `app/api/mockups/[id]/stage-progress/route.ts`
- `app/api/mockups/[id]/stage-progress/[stage_order]/route.ts`
- `app/api/reviews/my-stage-reviews/route.ts`
- `components/projects/StageStatusPill.tsx`
- `components/projects/StageActionModal.tsx`
- `components/projects/WorkflowBoard.tsx`
- `app/(dashboard)/my-stage-reviews/page.tsx`

### Files Modified
- `lib/supabase.ts` (added stage progress types)
- `app/api/projects/[id]/mockups/route.ts` (added progress tracking)
- `app/(dashboard)/projects/[id]/page.tsx` (added WorkflowBoard)
- `app/(dashboard)/mockups/[id]/page.tsx` (added stage banner)
- `components/SidebarSimple.tsx` (added Stage Reviews nav)
- `README.md` (documented v3.0 features)
- `package.json` (version bump to 3.0.0)

---

## [2.4.0] - 2025-01-25

### Added
- **Workflow Templates System** (Phase 2)
  - Create reusable multi-stage approval workflows
  - Color-coded stages (7 colors: yellow, green, blue, purple, orange, red, gray)
  - Assign stage-based reviewers to projects
  - Set default workflows for auto-assignment
  - Admin-only workflow management interface
  - Archive workflows while preserving history
- **Mockup-to-Project Assignment**
  - Assign mockups to projects from mockup library
  - ProjectSelector component for quick assignment
  - Mockup count tracking per project
- **Project Stage Reviewers Management**
  - API endpoints for adding/removing stage reviewers
  - Unique constraint prevents duplicate reviewer assignments
  - Cached user info (name, avatar) for display

### Changed
- Enhanced project detail page with mockup assignment
- Updated project creation flow to include workflow selection
- Improved project card display with workflow indicators

### Fixed
- Project deletion cascades to stage reviewer assignments
- Workflow deletion sets project workflow_id to NULL (preserves projects)

### Technical
- Migration 08: Workflows table with JSONB stages array
- `project_stage_reviewers` table with stage-based assignments
- Stage validation function (1-10 stages, valid structure)
- Performance indexes on workflow and reviewer queries

---

## [2.3.0] - 2025-01-24

### Added
- **Projects Feature** (Phase 1)
  - Client-based project organization for mockups
  - Project status tracking: Active, Completed, Archived
  - Color-coded projects (8 preset hex colors)
  - Project detail pages with mockup galleries
  - Search within project mockups
  - Thumbnail previews (up to 4) on project cards
  - Permission controls (creator/admin only)
- **Project API Routes**
  - `GET/POST /api/projects` - List and create projects
  - `GET/PATCH/DELETE /api/projects/[id]` - Individual project operations
  - `GET /api/projects/[id]/mockups` - Project mockup listing
- **Project Components**
  - `ProjectCard.tsx` - Display component
  - `NewProjectModal.tsx` - Creation dialog with color picker
  - Project detail page with mockup grid

### Changed
- Added `project_id` column to `card_mockups` table
- Updated mockup library to show project assignments
- Enhanced mockup detail page to display project info

### Technical
- Migration 07: Projects table with status enum
- Indexes for project queries and mockup-project relationships
- RLS policies follow Clerk auth pattern

---

## [2.2.0] - 2025-01-24

### Added
- **Collapsible Sidebar** with expand/collapse functionality
- Sidebar state persistence using React Context
- Mobile-responsive navigation with slide-out behavior
- **Aiproval Rebranding**
  - Updated app name throughout codebase
  - Refreshed color scheme and branding
  - Updated email templates with new branding

### Changed
- Sidebar now collapsible on desktop (16px collapsed, 264px expanded)
- Improved mobile menu with overlay and animations
- Better icon-only view when collapsed
- Streamlined navigation layout

### Fixed
- Sidebar state sync between header toggle and sidebar toggle
- Mobile menu close behavior
- Icon alignment in collapsed state

---

## [2.1.0] - 2025-01-23

### Added
- **Zoom Controls** in annotation toolbar
  - Zoom in/out buttons (25%-400% range)
  - Reset to 100% button
  - Mouse wheel zoom support
  - Visual zoom percentage display
- **Visual Linking** between comments and annotations
  - Bi-directional hover highlighting
  - Hover comment → highlight annotation on canvas
  - Hover annotation → highlight comment in sidebar
  - Improved UX for tracking feedback
- **Resolution Tracking Enhancements**
  - Show resolved by user name and timestamp
  - Better visual indicators for resolved state
  - Improved resolution notes display

### Changed
- Enhanced annotation toolbar with integrated zoom controls
- Improved comment sidebar layout for better readability
- Updated hover states for clearer visual feedback

---

## [2.0.0] - 2025-01-22

### Added
- **Folder Organization System**
  - Personal folders with up to 5 levels of nesting
  - Org-shared folders (admin-created)
  - Smart "Unsorted" folder for unorganized mockups
  - Folder CRUD operations (create, rename, delete, share)
  - Move mockups between folders
  - Real-time mockup counts per folder
  - Search within folders
- **Next.js 15 Upgrade**
  - Migrated to Next.js 15.5.5 with App Router
  - Turbopack for faster development builds
  - React 19.1.0 upgrade
  - Updated all dependencies
- **Mobile UX Improvements**
  - Responsive folder tree
  - Touch-optimized interactions
  - Mobile-friendly mockup grid

### Changed
- **BREAKING**: Route params now async (Next.js 15 requirement)
- Folder hierarchy replaces flat library structure
- Updated all route handlers for async params
- Improved mockup library layout

### Technical
- Migration 04: Folders table with self-referencing hierarchy
- Added `folder_id` to `card_mockups`
- Added `created_by` to mockups, templates, brands
- Folder depth validation (max 5 levels)
- Performance indexes for folder queries

---

## [1.1.0] - 2024-10-21

### Added
- **Organization Scoping** for true multi-tenancy
  - All data scoped by Clerk organization_id
  - Complete data isolation between organizations
  - Organization switcher in UI
- **Clerk Organizations** integration
  - Team management via Clerk
  - Role-based access (admin vs member)
  - Organization member listing API

### Changed
- All database tables include `organization_id`
- All API routes filter by organization
- Updated RLS policies for organization isolation

---

## [1.0.0] - 2024-10-18

### Added
- **Brand Asset Management**
  - Logo search via Brandfetch API
  - Brand-centric data model
  - Multiple logo variants per brand
  - Color palette extraction
  - Font information storage
- **Mockup Designer**
  - Interactive Konva.js canvas
  - Drag & drop logo placement
  - Template backgrounds
  - High-resolution export (2x pixel ratio)
  - Position and size controls
- **Collaboration System**
  - 7 annotation tools (pin, arrow, circle, rect, freehand, text, select)
  - Numbered comments linked to annotations
  - Color picker and stroke width controls
  - Review request workflow
  - Email notifications via SendGrid
- **Review Workflow**
  - Request feedback from organization members
  - Review status tracking
  - Approve/request changes with notes
  - Reviewer dashboard
- **Resolution & Audit Trail**
  - Comment resolution tracking
  - Edit history in JSONB
  - Soft delete for compliance
  - Original text preservation
- **Authentication**
  - Clerk integration
  - Multi-tenant support
  - Role-based access control

### Technical
- Next.js 15 App Router
- TypeScript throughout
- Tailwind CSS 4
- Supabase PostgreSQL + Storage
- Konva.js for canvas rendering
- SendGrid for emails
- 6 initial database migrations

---

## Legend

- **Added** - New features
- **Changed** - Changes in existing functionality
- **Deprecated** - Soon-to-be removed features
- **Removed** - Removed features
- **Fixed** - Bug fixes
- **Security** - Vulnerability fixes

---

For more information, see [README.md](README.md) or visit the [GitHub repository](https://github.com/jay-chalkstep/contentpackage).
