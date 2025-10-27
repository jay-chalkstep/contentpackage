# Changelog

All notable changes to **Aiproval** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [3.4.0] - 2025-10-27

### 🎨 **Project List UX Improvements**

Minor UI refinements to improve project list readability and provide better project management workflow.

### Added
- **"Add Assets" button on project detail page** - Blue CTA button in header to navigate to mockup library for easy asset assignment

### Changed

#### Project List Display
- **Client-centric display** - Client name now shown as primary (bold) text with project name as secondary detail
- **Cleaner list layout** - Removed asset count and project icons from list rows for more compact, focused display
- **Improved column alignment** - Fixed header alignment for STATUS and ACTIONS columns
  - STATUS column: Added fixed `w-24` width
  - ACTIONS column: Added fixed `w-[120px]` width and removed right-align
  - Perfect vertical alignment between headers and content

### Technical
- Modified `components/lists/ProjectListItem.tsx` - Client name display, removed icon, fixed column widths
- Modified `components/lists/ListToolbar.tsx` - Column header alignment, removed icon space
- Modified `app/(dashboard)/projects/[id]/page.tsx` - Added "Add Assets" button

---

## [3.3.0] - 2025-10-26

### 🎨 **Major UI/UX Improvements Release**

Comprehensive UI refinements focusing on navigation consistency, improved user experience, and brand-focused terminology.

### Added

#### Navigation & Layout Improvements
- **GmailLayout integration across all pages** - Consistent three-panel layout throughout the app
- **NavRail on project detail pages** - Fixed missing navigation on project detail views
- **Context panel for Stage Reviewers** - Moved stage reviewers to collapsible side panel for better space usage
- **User full name display** - Shows first and last name in header for better user context
- **Brand Library quick access** - Added "View Library" button to mockup library context panel

#### UI Refinements
- **Workflow color legend repositioned** - Moved to top of workflow board for better visibility
- **Vertical stage reviewer layout** - Changed from horizontal to vertical stacking for better space efficiency
- **Search bar labeling** - Added "Filter or add:" label to project mockup search
- **Button consistency improvements** - Standardized button naming and ordering in context panels

### Changed

#### Terminology Updates
- **"Logo" → "Brand" throughout UI** - Comprehensive terminology change for consistency:
  - "Search Logos" → "Search Brands"
  - "Logo Library" → "Brand Library"
  - "Upload Logo" → "Upload Brand"
  - "logo variants" → "brand variants"
  - All related UI text updated to brand-centric language

### Fixed
- **Scrolling issues** - Fixed inability to scroll on search and project detail pages
- **Missing Library icon import** - Added missing import in mockup-library page
- **Duplicate UserButton** - Removed duplicate Clerk button from NavRail
- **Context panel positioning** - Fixed gap between NavRail and context panel

---

## [3.2.1] - 2025-10-25

### 🐛 **Critical Deployment & Runtime Fixes**

Fixed multiple deployment and runtime issues that prevented AI features from working in production on Vercel.

### Fixed

#### Deployment & Build Issues
- **Lazy initialization for Supabase clients** - Fixed "supabaseUrl is required" build errors
  - Both `/lib/supabase.ts` and `/lib/supabase-server.ts` now use lazy initialization
  - Prevents environment variable validation during build phase
  - Clients are only created when first accessed at runtime
  - Uses JavaScript Proxy pattern for backward compatibility

#### Runtime Errors
- **AIProvider context initialization** - Fixed "AI Provider not found within an AIProvider" error
  - Added AIProvider wrapper to dashboard layout
  - All AI components can now properly use the `useAI()` hook
  - Enables AI features on mockup detail pages

#### UI Component Fixes
- **Badge onClick functionality** - Wrapped Badge in button for proper click handling
- **ColorPalette null checks** - Added safety checks in TagDisplay component
- **Missing dependencies** - Added date-fns package for time formatting
- **Function name corrections** - Fixed incorrect function names from AIContext

### Vercel-Specific Fixes
- **Environment variable scoping** - Documentation for Production vs Preview environments
  - Vercel requires enabling variables for "Preview" scope for branch deployments
  - Fixed issue where feature branches couldn't access production-only variables
  - Clear instructions for Vercel dashboard configuration

### Technical Details
- Uses Proxy pattern to defer Supabase client initialization
- Maintains 100% backward compatibility with existing code
- No changes needed in API routes or components
- Build succeeds even without environment variables present

---

## [3.2.0] - 2025-10-25

### 🚀 **AI-Powered Features - Phase 1 Release**

Major release introducing comprehensive AI capabilities for intelligent mockup management, powered by OpenAI and Google Vision APIs.

### Added

#### Core AI Features

##### 🏷️ **Automated Visual Tagging**
- Google Vision API integration for automatic tag generation
- Extracts visual elements, composition, brands, and objects
- Confidence scoring (0-1 scale) for tag reliability
- Categories: Visual, Colors, Composition, Brands, Objects

##### 📝 **Text Recognition (OCR)**
- Automatic text extraction from mockup images
- Google Vision API-powered OCR
- Searchable extracted text stored in database

##### 🎨 **Color Palette Extraction**
- Identifies dominant, accent, and neutral colors
- Provides hex values and percentage distribution
- Visual color swatches in UI

##### ♿ **Accessibility Analysis**
- WCAG compliance level detection (A, AA, AAA)
- Contrast ratio analysis for text readability
- Readability scoring (0-100 scale)
- Issue severity classification (error/warning/info)
- Actionable improvement suggestions

##### 🔍 **Semantic Search**
- Natural language query understanding
- OpenAI text-embedding-3-small (1536-dimensional vectors)
- Hybrid search combining vector similarity and full-text search
- Search modes: AI (semantic), Exact (traditional), Visual (similarity)
- Keyboard shortcut: Cmd+K for quick access

##### 👁️ **Visual Similarity Search**
- Find mockups with similar visual characteristics
- Adjustable similarity threshold (50-100%)
- Real-time similarity percentage display
- "Find Similar" button on mockup detail pages

##### 📁 **Intelligent Folder Suggestions**
- AI-powered folder recommendations based on content
- Confidence scoring with explanations
- User feedback system (thumbs up/down)
- Learning from user decisions

##### 🎯 **Interactive Onboarding**
- Spotlight tour for new AI features
- 7-step guided introduction
- Skip option for experienced users
- Persistent completion tracking

#### Technical Infrastructure

##### Database Enhancements
- **pgvector extension** for vector similarity search
- **New tables**:
  - `mockup_ai_metadata` - Stores AI analysis results
  - `folder_suggestions` - Tracks AI recommendations
  - `search_queries` - Analytics and learning
- **IVFFlat index** for fast similarity search (lists=10)
- **RPC functions** for complex vector operations

##### API Endpoints
- `/api/ai/analyze` - Visual analysis and tagging
- `/api/ai/search` - Semantic search
- `/api/ai/similar` - Visual similarity search
- `/api/ai/suggest-folder` - Folder recommendations

##### UI Components
- **AISearchBar** - Advanced search with mode toggle
- **TagDisplay** - Visual tag presentation
- **AccessibilityScore** - WCAG compliance visualization
- **SimilarMockupsModal** - Similar mockup browser
- **ColorSwatch** - Color palette display
- **ConfidenceBar** - Confidence score visualization
- **AIOnboardingTour** - Feature introduction

#### Configuration
- AI models configurable via `/lib/ai/config.ts`
- Retry logic with exponential backoff
- Error handling and fallbacks
- Rate limiting awareness

### Environment Variables Required
```env
# AI Features (Required for v3.2.0+)
OPENAI_API_KEY=sk-proj-...
GOOGLE_VISION_API_KEY=AIza...
```

### Database Migration
- Run migration `11_ai_features.sql`
- Enables pgvector extension
- Creates AI-related tables and indexes
- Adds vector similarity RPC functions

### Performance
- Async processing for non-blocking UI
- Optimized vector indexing (IVFFlat)
- Caching for repeated searches
- Lazy loading of AI components

---

## [3.1.8] - 2025-10-25

### 🎨 **UX Improvement - Stage Reviewers Default Collapsed**

Improved project detail page initial load by collapsing the Stage Reviewers section by default to save vertical space.

### Changed

#### Stage Reviewers Component
- **Default state changed to collapsed** - Section now starts collapsed instead of expanded
  - Changed `useState(true)` → `useState(false)` on line 42
  - Saves additional vertical space on project detail page load
  - Users can still expand when needed by clicking the header
  - Aligns with v3.1.7's compact UI optimization goals

### Benefits
- ✅ **Cleaner initial view** - More focus on workflow board at first glance
- ✅ **Space savings** - Collapsed by default saves ~120px of vertical space
- ✅ **Progressive disclosure** - Show reviewer management only when needed
- ✅ **Consistent with optimization** - Continues the compact UI improvements from v3.1.6-3.1.7

---

## [3.1.7] - 2025-01-25

### 🎨 **Workflow Board Optimization & UI Cleanup**

Streamlined the project detail page by making workflow board cards more compact and removing redundant mockup listing.

### Changed

#### Workflow Board - Compact Cards
- **Reduced card width** - 320px (w-80) → 224px (w-56) for ~30% space savings
- **Smaller thumbnails** - Proportionally reduced while maintaining aspect-[3/2] ratio
- **Tighter spacing throughout**
  - Stage headers: px-4 py-3 → px-3 py-2
  - Card content: p-3 → p-2
  - Text sizes reduced to xs for better density
- **More mockups visible** - Can see more workflow stages and cards per screen

#### Stage Reviewers - Collapsible Section
- **Added chevron toggle** - ChevronDown/ChevronUp icons in header
- **Clickable header** - Entire header acts as collapse/expand button
- **Smooth transitions** - Stage cards show/hide with clean animation
- **Default expanded** - Opens expanded for easy access
- **Hover state** - Visual feedback on header for better UX

#### Project Detail Page - Removed Redundant Grid
- **Deleted mockup grid section** - No longer shows duplicate mockup listing at bottom
- **Cleaner page structure** - Only shows: Header → Stage Reviewers → Workflow Board
- **Code cleanup**
  - Removed unused state: `filteredMockups`
  - Removed unused functions: `handleDeleteMockup`, search filter effect
  - Removed unused imports: Download, Trash2, ExternalLink, Edit2, Calendar
- **Simple empty state** - Shows only when project has no workflow and no mockups
- **Bundle size reduction** - Project detail page: 6.86 kB → 6.38 kB

### Benefits
- ✅ **30% smaller workflow cards** - More content visible without scrolling
- ✅ **Collapsible reviewers** - Save space when not actively managing assignments
- ✅ **Eliminated redundancy** - Workflow board is now the single source of truth
- ✅ **Cleaner codebase** - Removed ~90 lines of unused code
- ✅ **Better focus** - Page dedicated to workflow progress, not general mockup browsing

---

## [3.1.6] - 2025-01-25

### 🎨 **Compact UI Redesign - Project Detail Page**

Major UX improvement that reduces header area by ~40% while improving information density and readability.

### Changed

#### Project Header - Very Compact Layout
- **Reduced vertical height** from ~120px to ~80px
- **Single-line project identity**
  - Compact title (text-xl instead of text-3xl)
  - Inline client name, workflow badge, status pill, and metadata
  - All key information visible without scrolling
- **Smart progress stats** - Auto-calculated from mockup data
  - "3 in review • 2 approved • 1 changes" display
  - Real-time aggregation of mockup workflow status
  - Only shows relevant stats (hides zeros)
- **Workflow badge** - Purple pill showing assigned workflow name
- **Compact date format** - "Oct 25" instead of "Created October 25, 2025"
- **Inline search** - Search input moved to same line as description
- **Better responsive behavior** - Wraps gracefully on smaller screens

#### Stage Reviewers - Horizontal Compact View
- **Reduced vertical height** from ~300px to ~120px
- **Compact header** - Single line (14px height) instead of multi-line section
- **Horizontal scrollable layout** - Stages in row instead of grid
- **Compact stage cards** - 224px width with minimal padding
- **Avatar stack display** - First 3 reviewers visible with "+N" badge
- **Smaller stage headers** - Reduced from medium to xs/sm text sizes
- **Efficient reviewer list** - Scrollable area within each card
- **Tighter spacing** - Reduced padding throughout (p-3 instead of p-6)

### Technical

#### Files Modified
- `app/(dashboard)/projects/[id]/page.tsx`
  - Added `progressStats` calculation (lines 155-175)
  - Added `formatCompactDate()` helper function
  - Redesigned header layout (lines 184-280)
  - Reduced padding: py-6 → py-3
  - Reduced title: text-3xl → text-xl
  - Inline metadata display with flex-wrap
- `components/projects/ProjectStageReviewers.tsx`
  - Compact header (lines 127-134)
  - Horizontal scrollable stage cards (lines 136-251)
  - Avatar stack implementation
  - Reduced card width: responsive grid → fixed 224px
  - Reduced text sizes: text-lg/text-sm → text-xs

### Benefits
- ✅ **~220px vertical space saved** - More content visible without scrolling
- ✅ **Better information density** - All key metrics at a glance
- ✅ **Improved workflow visibility** - Workflow name and progress stats prominent
- ✅ **Cleaner visual hierarchy** - Related items grouped inline
- ✅ **Faster comprehension** - Less eye movement, more efficient scanning
- ✅ **Responsive design** - Maintains usability on different screen sizes

---

## [3.1.5] - 2025-01-25

### 🐛 **Bugfix - Reviewer Display After Assignment**

Critical bugfix that fixes assigned reviewers not appearing in the UI due to API response property name mismatch.

### Fixed

#### Reviewer Data Fetching
- **ProjectStageReviewers Component** - Fixed property name mismatch in reviewer fetch
  - API returns: `{reviewers: [...]}`
  - Component was looking for: `{stage_reviewers: [...]}`
  - Changed component to use correct property name
  - Assigned reviewers now display immediately after assignment

#### Workflow Array Handling in POST
- **Add Reviewer Validation** - Fixed workflow data handling in POST endpoint
  - Added same array/object detection logic for workflows in POST endpoint
  - Prevents validation errors when adding reviewers
  - Ensures stage validation works correctly

### Technical

#### Root Cause
- GET `/api/projects/[id]/reviewers` returns `{reviewers: groupedReviewers}`
- Component `fetchStageReviewers()` was accessing `data.stage_reviewers`
- Property mismatch caused reviewers to never populate after fetch
- Reviewers were being saved to database but not displayed in UI

#### Solution
- Changed line 54 in ProjectStageReviewers.tsx: `data.stage_reviewers` → `data.reviewers`
- Added workflow array handling in POST endpoint (lines 146-147)

### Impact
- ✅ **Reviewers Display Correctly** - Assigned reviewers now show up in stage cards
- ✅ **Real-time Updates** - Reviewers appear immediately after assignment
- ✅ **Proper Validation** - Stage validation works when adding reviewers
- ✅ **Complete Feature** - Reviewer assignment now fully functional end-to-end

---

## [3.1.4] - 2025-01-25

### 🐛 **Bugfix - Organization Member Display**

Critical bugfix that fixes "undefined undefined" appearing in the reviewer selection dropdown by correcting the data structure mismatch between the API and UI component.

### Fixed

#### Member Data Structure
- **AddStageReviewerModal Interface** - Fixed mismatch between API response and component expectations
  - API returns: `{name, email, avatar, role}`
  - Component was expecting: `{firstName, lastName, emailAddresses[], imageUrl}`
  - Updated component to use correct property names from API
  - Reviewer names now display correctly in dropdown

### Technical

#### Root Cause
- The `/api/org/members` endpoint returns transformed member data
- The `AddStageReviewerModal` component was using Clerk's raw data structure
- Property name mismatches caused undefined values:
  - `firstName`/`lastName` → should be `name`
  - `emailAddresses[0].emailAddress` → should be `email`
  - `imageUrl` → should be `avatar`

#### Solution
- Updated `OrganizationMember` interface to match API response
- Updated all property references throughout the modal component
- Member dropdown now shows actual names instead of "undefined undefined"

### Impact
- ✅ **Reviewer Names Display** - Dropdown shows correct member names
- ✅ **Avatar Display** - Member avatars render properly in preview
- ✅ **Email Display** - Member emails show correctly in preview
- ✅ **Functional Reviewer Assignment** - Can now successfully assign reviewers to stages

---

## [3.1.3] - 2025-01-25

### 🐛 **Bugfix - Workflow Array Handling**

Critical bugfix that resolves `TypeError: Cannot read properties of undefined (reading '0')` when loading projects with workflows.

### Fixed

#### Workflow Data Type Handling
- **Array vs Object Handling** - Fixed Supabase JOIN returning workflow as array
  - Supabase `.select('*, workflows(*)')` can return data as array `[{...}]` or object `{...}`
  - Added logic to detect array and extract first element
  - Prevents undefined property access errors in UI
  - Now handles both array and object responses correctly

### Technical

#### Root Cause
- Supabase foreign key JOINs may return data as single-element array
- Previous fix assumed `workflows` would be an object
- UI tried to access `workflow.stages[0]` but workflow was actually `[{stages: [...]}]`
- This caused "Cannot read properties of undefined (reading '0')" errors

#### Solution
```typescript
const workflowData = Array.isArray(workflows) ? workflows[0] : workflows;
```

### Impact
- ✅ **Eliminates Console Errors** - No more TypeError when viewing projects
- ✅ **Workflow UI Renders** - ProjectStageReviewers and WorkflowBoard display correctly
- ✅ **Robust Data Handling** - Works regardless of Supabase response format

---

## [3.1.2] - 2025-01-25

### 🐛 **Bugfix - Workflow Data Display**

Critical bugfix that resolves workflow data not being visible in the UI due to a property naming mismatch between the API and frontend.

### Fixed

#### Workflow Data Loading
- **API Property Naming** - Fixed mismatch between API response and UI expectations
  - Supabase JOIN returned workflow data as `workflows` (table name)
  - TypeScript interface and UI expected `workflow` (singular)
  - API now properly renames `workflows` → `workflow` in response
  - This fix enables ProjectStageReviewers and WorkflowBoard to render correctly

### Technical

#### Root Cause
- Supabase query `.select('*, workflows(*)')` returns JOIN data using table name
- TypeScript `Project` interface defined property as `workflow?: Workflow`
- UI conditional checks like `{project?.workflow && ...}` evaluated to undefined
- Components (ProjectStageReviewers, WorkflowBoard) failed to render

#### Solution
- Added property renaming in `/api/projects/[id]/route.ts` GET handler
- Destructure `workflows` from response and rename to `workflow`
- Ensures API response matches TypeScript interface expectations

### Impact
- ✅ **Workflow Board Now Visible** - Kanban board displays for projects with workflows
- ✅ **Stage Reviewers Now Accessible** - UI for assigning reviewers now renders
- ✅ **Complete v3.1.1 Feature** - Reviewer assignment functionality now fully functional

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
