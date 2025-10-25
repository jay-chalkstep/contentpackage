# Aiproval v2.4.0

> Multi-tenant SaaS for brand asset management and collaborative mockup review

A comprehensive platform for design teams, marketing departments, and agencies to search, organize, and collaborate on brand assets with real-time visual annotation, structured workflows, and project-based review management.

---

## 🎯 Overview

**Aiproval** is a full-featured brand asset management and collaboration platform that enables teams to:

- 🔍 **Search & Save** company logos via Brandfetch API with automatic metadata extraction
- 📁 **Organize** brand assets in personal and shared folder hierarchies
- 📋 **Manage Projects** with client-based organization and workflow assignments
- 🔄 **Standardize Workflows** with reusable multi-stage approval templates
- 🎨 **Design** professional mockups using an interactive canvas editor
- 👥 **Collaborate** with visual annotations, comments, and structured review workflows
- ✅ **Review & Approve** mockups with approval tracking and email notifications
- 📊 **Track** complete audit trail of edits, resolutions, and feedback history

Built for teams who need more than basic file storage—Aiproval provides context-aware collaboration with visual feedback directly on mockup designs, organized by client projects with customizable approval workflows.

---

## ✨ Key Features

### Brand Asset Management
- **Logo Search** via Brandfetch API (search by domain or company name)
- **Brand Library** with brand-centric data model (multiple variants per brand)
- **Logo Variants** with format support (SVG, PNG, light/dark themes)
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

### Workflow Templates
- **Reusable Workflows** - Create multi-stage approval templates
- **Color-Coded Stages** - 7 colors for visual workflow organization
- **Stage-Based Reviewers** - Assign specific reviewers to each workflow stage
- **Default Workflows** - Auto-assign workflows to new projects
- **Admin Management** - Centralized workflow creation and editing (admin-only)
- **Workflow Archive** - Archive old workflows while preserving history
- **Project Integration** - Assign workflows when creating projects

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
- **Database**: Supabase PostgreSQL 2.75.0
- **Storage**: Supabase Storage (3 buckets: logos, templates, mockups)
- **Realtime**: Supabase Realtime (for collaboration updates)
- **Email**: SendGrid 8.1.0 (review notifications)
- **External API**: Brandfetch (logo search)

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
```

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
│   │   │   └── [id]/page.tsx       # Project detail with mockups
│   │   ├── search/                  # Logo search (Brandfetch)
│   │   ├── library/                 # Saved logos library
│   │   ├── reviews/                 # My pending reviews
│   │   └── admin/                   # Admin settings
│   │       ├── workflows/           # Workflow template management
│   │       └── users/               # User management
│   ├── api/                          # API Routes
│   │   ├── comments/[id]/           # Comment CRUD + resolve/unresolve
│   │   ├── mockups/[id]/            # Mockup, comments, reviewers
│   │   ├── projects/                # Project CRUD
│   │   │   ├── [id]/               # Individual project operations
│   │   │   │   ├── mockups/        # Project mockups listing
│   │   │   │   └── reviewers/      # Stage reviewer management
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
│   │   └── NewProjectModal.tsx     # Project creation dialog
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
│   │   └── collaboration.ts         # Email templates
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
│   └── 08_workflows.sql
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

3. **Konva.js for Canvas**
   - Needed precise control over annotation positioning
   - Export functionality requires access to stage as image data
   - React-Konva provides React component interface

4. **JSONB for Annotation Data**
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

1. Connect your GitHub repository to Vercel
2. Add all environment variables in Vercel dashboard
3. Deploy!

### Environment Variables in Production

Ensure these are set in Vercel:
- All Clerk keys (publishable + secret)
- All Supabase keys (URL + anon + service role)
- Brandfetch API key
- SendGrid API key (if using emails)

### Post-Deployment Checklist

- [ ] Run all 8 database migrations in Supabase
- [ ] Create 3 storage buckets in Supabase
- [ ] Test sign-in/sign-up flow
- [ ] Create test organization
- [ ] Create test project with workflow
- [ ] Test mockup creation and project assignment
- [ ] Test collaboration and visual annotations
- [ ] Verify email notifications work

---

## 📚 Version History

See [CHANGELOG.md](./documentation/CHANGELOG.md) for detailed version history.

### Recent Versions

- **v2.4.0** (2025-01-25) - Workflow templates system (Phase 2), mockup-project assignment, bug fixes
- **v2.3.0** (2025-01-24) - Projects feature (Phase 1), client organization system
- **v2.2.0** (2025-01-24) - Collapsible sidebar UI, Aiproval rebranding
- **v2.1.0** (2025-01-23) - Collaboration enhancements: zoom controls, visual linking, resolution tracking
- **v2.0.0** (2025-01-22) - Folder organization system, Next.js 15 upgrade, mobile UX
- **v1.1.0** (2024-10-21) - Organization-scoped data, multi-tenancy
- **v1.0.0** (2024-10-18) - Initial stable release

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
