# Aiproval v3.4.0

> Multi-tenant SaaS for brand asset management and collaborative mockup review with AI-powered features and active approval workflows

A comprehensive platform for design teams, marketing departments, and agencies to search, organize, and collaborate on brand assets with AI-powered tagging and search, real-time visual annotation, multi-stage approval workflows, and project-based review management.

---

## 🎯 Overview

**Aiproval** is a full-featured brand asset management and collaboration platform that enables teams to:

- 🔍 **Search & Save** company logos via Brandfetch API with automatic metadata extraction
- 🤖 **AI-Powered Analysis** with automated tagging, color extraction, and accessibility checking
- 🔎 **Smart Search** using natural language to find mockups by visual similarity
- 📁 **Organize** brand assets in personal and shared folder hierarchies with AI-suggested folders
- 📋 **Manage Projects** with client-based organization and workflow assignments
- 🔄 **Standardize Workflows** with reusable multi-stage approval templates
- 🎨 **Design** professional mockups using an interactive canvas editor
- 👥 **Collaborate** with visual annotations, comments, and structured review workflows
- ✅ **Review & Approve** mockups with approval tracking and email notifications
- 📊 **Track** complete audit trail of edits, resolutions, and feedback history

Built for teams who need more than basic file storage—Aiproval provides context-aware collaboration with visual feedback directly on mockup designs, organized by client projects with customizable approval workflows.

---

## ✨ Key Features

### UI/UX Excellence ⭐️ NEW in v3.3
- **Gmail-style Three-Panel Layout** - Consistent navigation with collapsible context panels
- **Brand-Centric Interface** - Professional terminology focused on "brands" not "logos"
- **Smart Context Panels** - Collapsible side panels for stage reviewers and folder navigation
- **Full Name Display** - Shows complete user names for better identification
- **Intuitive Button Ordering** - Logical flow: View → Upload Brand → Upload Template
- **Responsive Navigation** - NavRail present on all pages with consistent behavior
- **Improved Scrolling** - Fixed overflow issues for seamless content browsing
- **Clear Visual Hierarchy** - Color legends positioned for maximum visibility

### Brand Asset Management
- **Brand Search** via Brandfetch API (search by domain or company name)
- **Brand Library** with brand-centric data model (multiple variants per brand)
- **Brand Variants** with format support (SVG, PNG, light/dark themes)
- **Color Palettes** automatically extracted from brand data
- **Font Information** captured and stored
- **Organization Scoping** for secure multi-tenant data isolation

### Project Management
- **Client Projects** - Organize mockups by client, campaign, or initiative
- **Project Status** - Active, Completed, or Archived status tracking
- **Color Coding** - Custom color labels for visual organization (8 preset colors)
- **Mockup Assignment** - Link mockups to projects for easy grouping
- **Project Detail Pages** - Dedicated views with mockup galleries and search
- **Thumbnail Previews** - Up to 4 mockup thumbnails on project cards
- **Permission Controls** - Only creator or admin can edit/delete projects

### Workflow Templates & Active Approval System ⭐️ NEW in v3.0
- **Reusable Workflows** - Create multi-stage approval templates (1-10 stages)
- **Color-Coded Stages** - 7 colors for visual workflow organization
- **Stage-Based Reviewers** - Assign specific reviewers to each workflow stage
- **Automatic Stage Initialization** - Progress tracking starts when mockup assigned to project
- **Sequential Progression** - Mockups advance stage-by-stage (1 → 2 → 3)
- **Approve or Request Changes** - Reviewers can approve or send back for revisions
- **Change Request Reset** - Sending back resets mockup to Stage 1 for revision
- **Email Notifications** - Auto-sent at every stage transition
- **Live Workflow Board** - Kanban-style view of mockups progressing through stages
- **Reviewer Dashboard** - Centralized "My Stage Reviews" page for pending approvals
- **Full Audit Trail** - Track who reviewed, when, and what they said
- **Default Workflows** - Auto-assign workflows to new projects
- **Admin Management** - Centralized workflow creation and editing (admin-only)
- **Workflow Archive** - Archive old workflows while preserving history

### Mockup Designer
- **Interactive Canvas** powered by Konva.js for precise control
- **Drag & Drop** logo placement with live preview
- **Position Controls** (arrow keys, presets, numeric input)
- **Size Controls** with aspect ratio lock
- **Grid Overlay** for alignment
- **Template Backgrounds** from custom library
- **High-Resolution Export** (2x pixel ratio, with/without annotations)
- **Zoom & Pan** (25%-400% zoom, mouse wheel + buttons)

### Collaboration System ⭐️
- **Visual Annotations** with 7 drawing tools:
  - 📍 Pin markers
  - ➡️ Arrows
  - ⭕ Circles
  - ▢ Rectangles
  - ✏️ Freehand drawing
  - 📝 Text annotations
  - 🖱️ Select tool (pan & move annotations)
- **Comments** linked to annotations with numbered badges
- **Hover Linking** - hover over comment to highlight annotation on canvas
- **Movable Annotations** - creators can reposition annotations after drawing
- **Color Picker** with vibrant preset palette (green default)
- **Adjustable Stroke Width** (1-20px, presets: 1, 3, 5, 8, 12)

### Review Workflow
- **Request Feedback** from organization members
- **Multi-Select Reviewers** with optional invitation message
- **Email Notifications** via SendGrid
- **Review Status Tracking** (pending → viewed → approved/changes_requested)
- **Approval/Rejection** with notes
- **Reviewer Dashboard** showing all pending reviews

### Resolution & Audit Trail
- **Comment Resolution** with resolution notes
- **Track Who Resolved** comments with timestamp
- **Hide Resolved Annotations** (hover to preview)
- **Reopen Resolved Comments** if needed
- **Edit History** tracked in JSONB with full audit trail
- **Soft Delete** for comments (never lose feedback history)
- **Original Text Preservation** for audit compliance

### Organization & Folders
- **Multi-Tenant Architecture** with complete data isolation
- **Clerk Organizations** for team management
- **Personal Folders** with up to 5 levels of nesting
- **Org-Shared Folders** for admin-created shared workspaces
- **Smart Unsorted Folder** for unorganized mockups
- **Folder Actions** (create, rename, delete, share)
- **Move Mockups** between folders with inline selector
- **Real-Time Counts** on folders
- **Search Within Folders** for scoped discovery

### AI-Powered Features ⭐️ NEW in v3.2
- **Automated Visual Tagging** - AI extracts visual elements, colors, composition, brands, and objects
- **Text Recognition (OCR)** - Automatically extract text from mockup images
- **Color Palette Extraction** - Identify dominant, accent, and complete color schemes
- **Accessibility Analysis** - WCAG compliance checking with contrast ratios and readability scores
- **Natural Language Search** - Find mockups using plain English queries
- **Visual Similarity Search** - Discover mockups with similar visual characteristics
- **Folder Suggestions** - AI recommends best folders for organizing mockups
- **Interactive Onboarding** - Spotlight tour to introduce AI features to new users
- **Confidence Scoring** - All AI predictions include confidence levels
- **Feedback Loop** - Thumbs up/down to improve AI suggestions over time

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15.5.5 (App Router + Turbopack)
- **UI Library**: React 19.1.0
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Canvas**: Konva.js 10.0.2 + React-Konva 19.0.10
- **Icons**: Lucide React 0.546.0

### Backend & Services
- **Authentication**: Clerk 6.33.7 (multi-tenant organizations)
- **Database**: Supabase PostgreSQL 2.75.0 with pgvector extension
- **Storage**: Supabase Storage (3 buckets: logos, templates, mockups)
- **Realtime**: Supabase Realtime (for collaboration updates)
- **Email**: SendGrid 8.1.0 (review notifications)
- **External APIs**:
  - Brandfetch (logo search)
  - OpenAI (text embeddings for semantic search)
  - Google Vision API (image analysis and OCR)

### Infrastructure
- **Build Tool**: Turbopack (Next.js 15)
- **Deployment**: Vercel-ready
- **Node Version**: 18+

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier works)
- Clerk account (free tier works)
- Brandfetch API key
- SendGrid API key (optional, for email notifications)
- OpenAI API key (for AI features)
- Google Cloud account with Vision API enabled (for AI features)

### Installation

```bash
# Clone the repository
git clone https://github.com/jay-chalkstep/contentpackage.git
cd contentpackage

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Fill in your environment variables (see below)
# Then run database migrations (see Database Setup section)

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

---

## ⚙️ Environment Variables

Create `.env.local` in the project root with the following variables:

```bash
# Clerk Authentication (get from https://dashboard.clerk.com)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Supabase (get from https://supabase.com/dashboard)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci... # For API routes

# Brandfetch API (get from https://brandfetch.com)
NEXT_PUBLIC_BRANDFETCH_API_KEY=your_brandfetch_key

# SendGrid (optional, for email notifications)
SENDGRID_API_KEY=SG.your_sendgrid_key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com

# AI Features (required for AI-powered features in v3.2.0+)
OPENAI_API_KEY=sk-proj-...
GOOGLE_VISION_API_KEY=AIza...
```

---

## 🤖 Using AI Features

### Getting Started with AI

Once deployed with the required API keys, AI features are available on mockup detail pages:

#### 1. **Analyzing a Mockup**
- Navigate to any mockup detail page (`/mockups/[id]`)
- Click the **"Analyze with AI"** button (purple gradient with ✨ icon) in the top-right corner
- Wait for analysis (typically 5-10 seconds)
- View results in the **"AI Insights"** tab in the right sidebar

#### 2. **AI Insights Panel**
The AI Insights tab displays comprehensive analysis:

- **📍 Visual Tags**: Categorized tags for visual elements, composition, brands, and objects
- **🎨 Color Palette**: Dominant, accent, and neutral colors with hex values
- **📝 Extracted Text**: Any text found in the mockup via OCR
- **♿ Accessibility Score**:
  - WCAG compliance level (AAA, AA, A, or Fail)
  - Contrast ratio analysis
  - Readability score (0-100)
  - Issues and improvement suggestions
- **📊 Confidence Score**: How confident the AI is about its analysis

#### 3. **Finding Similar Mockups**
- In the AI Insights tab, click the **eye icon** at the bottom
- A panel opens showing visually similar mockups
- Adjust the similarity threshold (50-100%) to filter results
- Click any mockup to navigate to it

#### 4. **Semantic Search** (Coming Soon)
- Use natural language queries to find mockups
- Example: "Find mockups with blue backgrounds and modern typography"
- Access via Cmd+K shortcut or search bar

#### 5. **Folder Suggestions** (Coming Soon)
- AI recommends the best folder for organizing new mockups
- Provides confidence scores and explanations
- Give feedback with thumbs up/down to improve suggestions

### AI Onboarding Tour

New users will see an interactive spotlight tour introducing AI features:
- 7-step guided walkthrough
- Highlights each AI feature with explanations
- Can be skipped or revisited later
- Progress is saved per user

### Prerequisites for AI Features

1. **Required API Keys**:
   - OpenAI API key for embeddings and semantic search
   - Google Vision API key for image analysis and OCR

2. **Database Setup**:
   - Run migration `11_ai_features.sql`
   - Ensure pgvector extension is enabled
   - IVFFlat index created for fast similarity search

3. **Minimum Requirements**:
   - Mockup must have an image uploaded
   - Organization must be active
   - User must have access to the mockup

---

## 🗄️ Database Setup

Run these migrations **in order** in your Supabase SQL Editor:

### Migration Order

1. **`supabase/01_initial_schema.sql`**
   - Creates base tables: brands, logo_variants, card_templates, card_mockups
   - Sets up Row-Level Security (RLS) policies
   - Creates initial indexes

2. **`supabase/02_brand_centric.sql`**
   - Migrates to brand-centric data model
   - Adds brand_colors and brand_fonts tables
   - Updates relationships and constraints

3. **`supabase/03_storage_setup.sql`**
   - Configures storage buckets (logos, card-templates, card-mockups)
   - Sets up storage RLS policies
   - Enables public access for read operations

4. **`supabase/04_folder_organization.sql`**
   - Creates folders table with hierarchy support
   - Adds folder_id to card_mockups
   - Adds created_by to mockups, templates, brands
   - Creates folder depth validation (max 5 levels)

5. **`supabase/05_collaboration.sql`**
   - Creates mockup_comments table
   - Creates mockup_reviewers table
   - Sets up collaboration RLS policies
   - Enables Realtime for collaboration

6. **`supabase/06_comment_audit_trail.sql`**
   - Adds resolution tracking (resolved_by, resolved_at, resolution_note)
   - Adds soft delete fields (deleted_at, deleted_by)
   - Adds edit_history JSONB column
   - Adds original_comment_text for audit trail
   - Creates performance indexes

7. **`supabase/07_projects.sql`**
   - Creates projects table with status enum
   - Adds project_id to card_mockups
   - Creates project status tracking (active, completed, archived)
   - Sets up color customization and client metadata
   - Creates performance indexes for project queries

8. **`supabase/08_workflows.sql`**
   - Creates workflow_stage_color enum
   - Creates workflows table with JSONB stages
   - Creates project_stage_reviewers table
   - Adds workflow_id to projects
   - Sets up multi-stage approval workflow system
   - Creates unique constraints for stage reviewers

9. **`supabase/09_stage_progress.sql`** ⭐️ NEW in v3.0
   - Creates stage_status enum (pending, in_review, approved, changes_requested)
   - Creates mockup_stage_progress table
   - Auto-initialization trigger when mockup assigned to workflow project
   - Helper functions: advance_to_next_stage(), reset_to_first_stage()
   - Performance indexes for stage tracking
   - Email notification tracking

10. **`supabase/10_reviewer_dashboard.sql`**
   - Creates view for pending reviews dashboard
   - Adds reviewer performance indexes
   - Optimizes stage progress queries

11. **`supabase/11_ai_features.sql`** ⭐️ NEW in v3.2
   - Enables pgvector extension for vector embeddings
   - Adds ai_metadata JSONB column to card_mockups
   - Adds ai_tags array for quick filtering
   - Adds search_vector for full-text search
   - Adds embedding vector[1536] for semantic similarity
   - Creates IVFFlat index for fast vector search
   - Creates RPC functions for hybrid search and similarity queries
   - Adds last_analyzed_at timestamp

### Storage Buckets

Create these buckets in Supabase Dashboard → Storage:

- **`logos`** (public) - Logo image files
- **`card-templates`** (public) - Template background images
- **`card-mockups`** (public) - Generated mockup exports

Then run the policies from `03_storage_setup.sql` to secure them.

---

## 🎨 Collaboration Features Deep Dive

Asset Studio's collaboration system is designed for **visual feedback directly on mockup designs**.

### How It Works

1. **Create Mockup** in the designer
2. **Request Feedback** by inviting organization members
3. **Reviewers Receive Email** with link to mockup
4. **Visual Annotations** drawn directly on the mockup canvas
5. **Comments Linked** to annotations with numbered badges (1, 2, 3...)
6. **Hover to Highlight** - hover comment to see annotation location
7. **Approve or Request Changes** with notes
8. **Resolve Comments** when feedback is addressed
9. **Track History** - full audit trail of all edits and resolutions

### Annotation Tools

- **Pin (📍)**: Click to place a marker
- **Arrow (➡️)**: Drag to draw directional arrow
- **Circle (⭕)**: Drag to draw circular highlight
- **Rectangle (▢)**: Drag to draw box around area
- **Freehand (✏️)**: Draw custom shapes freely
- **Text (📝)**: Click to add text label
- **Select (🖱️)**: Pan canvas when zoomed OR drag annotations to reposition

### Advanced Features

- **Movable Annotations**: Comment creators can reposition their annotations using select tool
- **Hide Resolved**: Resolved annotations auto-hide from canvas but reappear on hover
- **Color Coding**: 10 vibrant colors with green default for high visibility
- **Stroke Width Presets**: Quick access to 1px, 3px, 5px, 8px, 12px
- **Zoom Controls**: Integrated in toolbar (25%-400% with mouse wheel support)
- **Numbered Badges**: Annotations numbered 1, 2, 3... matching sidebar comments
- **Bi-Directional Hover**: Hover annotation → highlight comment OR hover comment → highlight annotation

### Resolution Workflow

1. Creator or reviewer marks comment as **Resolved**
2. Optional **resolution note** explains what was changed
3. **Annotation hides** from canvas (keeps it clean)
4. **Hover to preview** where the resolved feedback was
5. **Reopen if needed** - creator can unresolve comments
6. **Complete audit trail** tracks who resolved and when

---

## 📁 Project Structure

```
asset-studio/
├── app/                              # Next.js App Router
│   ├── (dashboard)/                  # Dashboard layout routes
│   │   ├── mockups/[id]/            # Mockup detail with collaboration
│   │   ├── mockup-library/          # Mockup grid with folders
│   │   ├── card-designer/           # Canvas mockup designer
│   │   ├── projects/                # Project management
│   │   │   ├── page.tsx            # Projects list
│   │   │   └── [id]/page.tsx       # Project detail with workflow board
│   │   ├── my-stage-reviews/        # ⭐️ NEW: Reviewer dashboard
│   │   ├── search/                  # Logo search (Brandfetch)
│   │   ├── library/                 # Saved logos library
│   │   ├── reviews/                 # My pending reviews
│   │   └── admin/                   # Admin settings
│   │       ├── workflows/           # Workflow template management
│   │       └── users/               # User management
│   ├── api/                          # API Routes
│   │   ├── comments/[id]/           # Comment CRUD + resolve/unresolve
│   │   ├── mockups/[id]/            # Mockup, comments, reviewers
│   │   │   └── stage-progress/     # ⭐️ NEW: Stage progress tracking
│   │   │       └── [stage_order]/  # ⭐️ NEW: Approve/request changes
│   │   ├── projects/                # Project CRUD
│   │   │   ├── [id]/               # Individual project operations
│   │   │   │   ├── mockups/        # Project mockups with progress
│   │   │   │   └── reviewers/      # Stage reviewer management
│   │   ├── reviews/                 # ⭐️ NEW: Review endpoints
│   │   │   └── my-stage-reviews/   # ⭐️ NEW: User's pending stage reviews
│   │   ├── workflows/               # Workflow CRUD (admin only)
│   │   │   └── [id]/               # Individual workflow operations
│   │   ├── folders/                 # Folder management
│   │   ├── org/members/             # Clerk organization members
│   │   ├── brandfetch/              # Brandfetch proxy
│   │   └── upload/                  # File upload handling
│   ├── sign-in/                     # Clerk auth pages
│   ├── sign-up/
│   └── page.tsx                     # Landing page
│
├── components/                       # React Components
│   ├── collaboration/               # Annotation & review components
│   │   ├── MockupCanvas.tsx        # Konva canvas with annotations
│   │   ├── AnnotationToolbar.tsx   # Drawing tools + zoom controls
│   │   ├── CommentsSidebar.tsx     # Comments & reviewers panel
│   │   ├── RequestFeedbackModal.tsx # Reviewer invitation
│   │   └── ResolveCommentModal.tsx  # Resolution note modal
│   ├── projects/                    # Project management components
│   │   ├── ProjectCard.tsx         # Project card display
│   │   ├── ProjectSelector.tsx     # Project assignment dropdown
│   │   ├── NewProjectModal.tsx     # Project creation dialog
│   │   ├── WorkflowBoard.tsx       # ⭐️ NEW: Kanban workflow board
│   │   ├── StageStatusPill.tsx     # ⭐️ NEW: Stage status indicators
│   │   └── StageActionModal.tsx    # ⭐️ NEW: Approve/request changes
│   ├── workflows/                   # Workflow components
│   │   ├── StageBuilder.tsx        # Interactive stage editor
│   │   └── WorkflowModal.tsx       # Workflow creation/editing dialog
│   ├── folders/                     # Folder organization components
│   ├── DashboardLayout.tsx          # Main layout wrapper
│   ├── SidebarSimple.tsx            # Collapsible navigation sidebar
│   └── Toast.tsx                    # Notification system
│
├── lib/                              # Utilities & Config
│   ├── supabase/                    # Supabase clients
│   │   ├── client.ts               # Browser client
│   │   └── server.ts               # Server client (service role)
│   ├── email/                       # Email integration
│   │   ├── sendgrid.ts             # SendGrid config
│   │   ├── collaboration.ts         # Collaboration email templates
│   │   └── stage-notifications.ts   # ⭐️ NEW: Stage workflow emails
│   └── hooks/                       # Custom React hooks
│
├── supabase/                         # Database Migrations
│   ├── 01_initial_schema.sql
│   ├── 02_brand_centric.sql
│   ├── 03_storage_setup.sql
│   ├── 04_folder_organization.sql
│   ├── 05_collaboration.sql
│   ├── 06_comment_audit_trail.sql
│   ├── 07_projects.sql
│   ├── 08_workflows.sql
│   └── 09_stage_progress.sql        # ⭐️ NEW: Active approval workflow
│
├── documentation/                    # Project Documentation
│   ├── CHANGELOG.md                 # Version history
│   ├── COLLABORATION_SPEC.md        # Collaboration design spec
│   └── COLLABORATION_IMPLEMENTATION.md # Implementation notes
│
└── public/                          # Static Assets
```

---

## 🤖 For AI Coding Assistants

**Context for AI Partners**: This project was built collaboratively with Claude Code and is designed to be AI-assistant-friendly.

### Key Architectural Decisions

1. **Clerk Auth over Supabase Auth**
   - Better multi-tenant organization support
   - Simpler role management (admin vs member)
   - RLS policies rely on Clerk user IDs passed via API routes

2. **API Routes for Data Access**
   - Direct Supabase client queries blocked by RLS (Clerk JWT format mismatch)
   - All data access routed through Next.js API routes
   - API routes use `supabaseServer` with service role key to bypass RLS

3. **Gmail-style Three-Panel Layout**
   - Consistent GmailLayout component across all pages
   - Collapsible context panels for better space utilization
   - NavRail navigation always present for easy access

4. **Konva.js for Canvas**
   - Needed precise control over annotation positioning
   - Export functionality requires access to stage as image data
   - React-Konva provides React component interface

5. **JSONB for Annotation Data**
   - Konva shape JSON stored directly in database
   - Flexible schema for different annotation types
   - Position stored separately as percentage coordinates

### Common Gotchas

- **Next.js 15 Async Params**: All route params must be awaited (`const { id } = await context.params`)
- **RLS Policies**: Never query Supabase directly from client - always use API routes
- **Realtime Subscriptions**: RLS blocks them with Clerk auth - use polling or API webhooks instead
- **Image Exports**: Must temporarily reset zoom/pan before exporting Konva stage

### Where to Find Specs

- **Collaboration System**: `documentation/COLLABORATION_SPEC.md` (original design)
- **Implementation Details**: `documentation/COLLABORATION_IMPLEMENTATION.md`
- **Version History**: `documentation/CHANGELOG.md` (all features by version)

---

## 💻 Development

### Running Locally

```bash
npm run dev        # Start dev server with Turbopack
npm run build      # Build for production
npm run start      # Start production server
npm run lint       # Run ESLint
```

### Making Changes

1. **Database Changes**: Create new migration in `supabase/` folder
2. **New Features**: Update CHANGELOG.md with details
3. **Version Bump**: Follow semantic versioning in `package.json`
4. **Commit Messages**: Use conventional commits format

### Testing Collaboration Features

1. Create a test organization in Clerk
2. Invite multiple test users
3. Create a mockup and request feedback
4. Test annotation tools, comments, and resolution workflow
5. Verify email notifications (if SendGrid configured)

---

## 🚀 Deployment

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/jay-chalkstep/contentpackage)

#### Step 1: Connect Repository
1. Click the deploy button above
2. Connect your GitHub repository to Vercel
3. Select the branch to deploy (main or feature branch)

#### Step 2: Configure Environment Variables

**⚠️ IMPORTANT for Vercel**: Environment variables must be configured for the correct environment scope:

1. Go to **Settings → Environment Variables** in your Vercel project
2. Add each variable and **enable for the appropriate environments**:
   - ✅ **Production** - For main/master branch deployments
   - ✅ **Preview** - For feature branch deployments (REQUIRED if using branches!)
   - ✅ **Development** - For local development with Vercel CLI

**Required Variables**:
```
# Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Database
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY

# APIs
NEXT_PUBLIC_BRANDFETCH_API_KEY

# AI Features (v3.2.0+)
OPENAI_API_KEY
GOOGLE_VISION_API_KEY

# Email (optional)
SENDGRID_API_KEY
SENDGRID_FROM_EMAIL
```

#### Step 3: Deploy
- Vercel will automatically build and deploy your application
- Build typically takes 2-3 minutes
- Check build logs for any errors

### Troubleshooting Vercel Deployments

#### Common Issues and Solutions

**1. "supabaseUrl is required" Build Error**
- **Cause**: Environment variables not available during build
- **Solution**: Already fixed in v3.2.1 with lazy initialization

**2. Runtime Error: "NEXT_PUBLIC_SUPABASE_URL is not set"**
- **Cause**: Environment variables not configured in Vercel
- **Solution**: Add all variables in Vercel dashboard and enable for correct environment

**3. Feature Branch Not Working**
- **Cause**: Environment variables only set for "Production" environment
- **Solution**: Edit each variable and enable "Preview" environment

**4. "AI Provider not found within an AIProvider" Error**
- **Cause**: AIContext not initialized
- **Solution**: Already fixed in v3.2.1 with AIProvider wrapper

**5. AI Features Not Showing**
- **Cause**: Missing OpenAI or Google Vision API keys
- **Solution**: Add `OPENAI_API_KEY` and `GOOGLE_VISION_API_KEY` to environment variables

### Post-Deployment Checklist

#### Database Setup
- [ ] Run all 11 database migrations in Supabase (in order!)
- [ ] Enable pgvector extension for AI features
- [ ] Create 3 storage buckets (logos, card-templates, card-mockups)
- [ ] Set up storage policies

#### Core Features Testing
- [ ] Test sign-in/sign-up flow
- [ ] Create test organization
- [ ] Upload logo and template
- [ ] Create mockup in designer

#### Workflow Testing
- [ ] Create workflow template with 3+ stages
- [ ] Create test project and assign workflow
- [ ] Assign stage reviewers to project
- [ ] Test mockup workflow progression
- [ ] Verify email notifications work

#### AI Features Testing (v3.2.0+)
- [ ] Click "Analyze with AI" on a mockup
- [ ] Verify AI Insights tab shows results
- [ ] Test "Find Similar Mockups" feature
- [ ] Check accessibility scoring
- [ ] Verify color palette extraction

#### Collaboration Testing
- [ ] Add visual annotations
- [ ] Post comments
- [ ] Test comment resolution
- [ ] Verify real-time updates

---

## 📚 Version History

See [CHANGELOG.md](./documentation/CHANGELOG.md) for detailed version history.

### Recent Versions

- **v3.4.0** (2025-10-27) - 🎨 **Project List UX** - Client-centric display, cleaner layout, improved column alignment, "Add Assets" button
- **v3.3.0** (2025-10-26) - 🎨 **UI/UX Excellence** - Gmail-style layout, brand-centric terminology, improved navigation and context panels
- **v3.2.1** (2025-10-25) - 🐛 **Critical Fixes** - Fixed Vercel deployment issues, lazy initialization for Supabase clients, AIProvider context initialization
- **v3.2.0** (2025-10-25) - 🤖 **AI Features Release** - Phase 1 AI integration with visual tagging, accessibility analysis, semantic search
- **v3.1.8** (2025-10-25) - 🎨 UX improvement - Stage reviewers default to collapsed state
- **v3.1.7** (2025-01-25) - 🎨 Workflow board optimization - Compact cards, collapsible reviewers, removed redundant grid
- **v3.1.6** (2025-01-25) - 🎨 Compact UI redesign - Project detail page header and stage reviewers (~40% space reduction)
- **v3.1.5** (2025-01-25) - Bugfix: Reviewer display after assignment
- **v3.1.1-3.1.4** (2025-01-25) - Workflow data display fixes and stage reviewer assignment UI
- **v3.1.0** (2025-01-25) - Navigation redesign with grouped structure, removed redundant ad-hoc review system
- **v3.0.0** (2025-01-25) - 🎉 **MAJOR RELEASE** - Active approval workflow system (Phase 3)
- **v2.4.0** (2025-01-25) - Workflow templates system (Phase 2), mockup-project assignment, bug fixes
- **v2.3.0** (2025-01-24) - Projects feature (Phase 1), client organization system

---

## 🔗 Links & Resources

- **Repository**: [https://github.com/jay-chalkstep/contentpackage](https://github.com/jay-chalkstep/contentpackage)
- **Issue Tracker**: [GitHub Issues](https://github.com/jay-chalkstep/contentpackage/issues)
- **Documentation**: [./documentation](./documentation)
- **Changelog**: [CHANGELOG.md](./documentation/CHANGELOG.md)

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🙏 Acknowledgments

Built with:
- [Next.js](https://nextjs.org/) by Vercel
- [Clerk](https://clerk.com/) for authentication
- [Supabase](https://supabase.com/) for database & storage
- [Konva.js](https://konvajs.org/) for canvas rendering
- [Brandfetch](https://brandfetch.com/) for logo data
- [SendGrid](https://sendgrid.com/) for email delivery
- [Claude Code](https://claude.com/claude-code) as AI development partner

---

**Aiproval** - Professional brand asset management and collaborative mockup review platform
