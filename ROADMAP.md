# Approval Orbit - Project Roadmap

**Version:** 1.2.0
**Last Updated:** October 17, 2025
**Status:** Phase 1 - Asset Creation (100% COMPLETE ✅)

---

## 🎯 Project Vision

**Approval Orbit** is a collaborative platform for creating, reviewing, and approving visual assets (prepaid cards, checks, email templates). It streamlines the entire lifecycle from initial design to final approval with built-in compliance features.

### Target Users
- Prepaid card companies
- Financial institutions
- Marketing teams requiring approval workflows
- Design agencies managing client feedback

### Core Value Proposition
A single platform that combines design tools, collaborative feedback, and formal approval workflows with compliance tracking—eliminating the need for separate tools like Figma + email + DocuSign.

---

## 📋 Three-Phase Implementation Plan

### **Phase 1: Asset Creation** ✅ COMPLETE - 100%

Build core design and asset management functionality.

#### ✅ Completed Features
- [x] **Logo Search & Library** - Brandfetch API integration for logo discovery
  - Search by domain/company name
  - Save logos to library
  - View saved logos in grid layout
- [x] **Asset Designer** - Interactive canvas for creating mockups
  - Drag-and-drop logo placement on templates
  - Scale, rotate, position controls
  - Preset position options
  - Grid overlay for alignment
  - Export to PNG with 2x resolution
- [x] **Template Library** - Upload and manage card templates
  - Upload card template images
  - View templates in grid
  - Download/delete templates
- [x] **Mockup Library** - Save and manage designed assets
  - Save designed mockups to database
  - View all saved mockups
  - Duplicate existing mockups
  - Export/download mockups
- [x] **Upload Functionality** - File upload for logos and templates
  - Drag-and-drop file uploads
  - Image preview before upload
  - Supabase Storage integration
- [x] **Authentication System** - Supabase-based auth
  - Email magic link authentication
  - User profiles with roles (admin/user)
  - Protected routes
  - Row-level security policies
- [x] **Navigation & Layout** - Persistent, flash-free navigation
  - Route group pattern for persistent layout
  - Collapsible sidebar sections with localStorage
  - Role-based menu items (admin section)
  - Smooth page transitions without remounting
- [x] **Admin Section** - Administrative pages (UI complete)
  - User management page
  - Analytics dashboard page
  - Settings pages (organization & profile)

#### ✅ Completed in This Session (Oct 17, 2025)
- [x] **User Management Backend** ✅
  - SendGrid email integration for invitations
  - Reminder emails with professional templates
  - Role assignment functionality (existing)
  - User activation/deactivation (existing)
  - Organization member management (existing)
- [x] **Analytics Dashboard** ✅
  - Real-time usage metrics tracking
  - Asset creation trends with charts
  - User activity timeline
  - Storage usage statistics
  - Date range filtering (7/30/90 days)
  - Automatic activity logging with triggers
- [x] **Settings Implementation** ✅
  - Organization branding customization (logo, colors)
  - User profile editing with avatar upload
  - Email notification preferences
  - Reusable image upload component
- [x] **Billing/Subscription** ✅
  - Complete Stripe integration
  - 3 subscription tiers (Starter, Professional, Enterprise)
  - Stripe Checkout for upgrades
  - Customer Portal for management
  - Webhook handling for events
  - Usage tracking (users, storage)

**Phase 1 Status:** ✅ COMPLETE - Ready for Phase 2!

---

### **Phase 2: Markup & Collaboration** 📅 Planned - 0% Complete

Enable client feedback with powerful annotation tools.

#### 🔲 Planned Features
- [ ] **Review Dashboard**
  - Create new asset reviews
  - List all reviews with filtering
  - Status tracking (draft, in_review, approved, rejected)
  - Search and filter reviews
- [ ] **Annotation Tools**
  - Comment bubbles with threaded discussions
  - Arrow annotations for pointing
  - Rectangle/circle highlights
  - Freehand drawing
  - Text overlay
  - Color picker for annotations
- [ ] **Real-time Collaboration**
  - Live cursor tracking
  - Presence indicators (who's viewing)
  - Live annotation updates
  - Real-time comment notifications
- [ ] **Version Control**
  - Asset version history
  - Version comparison view
  - Revert to previous versions
  - Branch from any version
- [ ] **Discussion Features**
  - Reply to annotations
  - Mention users in comments
  - Resolve/unresolve threads
  - Email notifications for mentions

#### 📊 Database Schema
**Status:** Designed, not deployed
**Location:** `supabase/schema.sql` (lines for reviews section)
**TypeScript Types:** `lib/types/reviews.ts` (complete)

**Tables to Deploy:**
- `asset_reviews` - Main review records with version control
- `review_annotations` - Annotation data with position/styling
- `annotation_replies` - Threaded discussion support

---

### **Phase 3: Approval Management** 📅 Planned - 0% Complete

Formal approval workflows with compliance features.

#### 🔲 Planned Features
- [ ] **Workflow Engine**
  - Create approval workflows
  - Multi-stage sequential approvals
  - Role-based approval stages
  - Conditional approval paths
  - Workflow templates by asset type
- [ ] **Approval Interface**
  - Pending approvals dashboard
  - Side-by-side asset comparison
  - Approve/reject with comments
  - Digital signature capture (touch/mouse)
  - Conditional approval option
- [ ] **Certificate Generation**
  - Automated PDF certificate creation
  - Approval chain visualization
  - Complete audit trail
  - Digital signatures embedded
  - Certificate numbering system
- [ ] **Compliance Features**
  - Full audit trail for all actions
  - Immutable approval records
  - Certificate archive
  - Compliance reporting
  - Export audit logs

#### 📊 Database Schema
**Status:** Designed, not deployed
**Location:** `supabase/schema.sql` (lines for approval section)
**TypeScript Types:** `lib/types/reviews.ts` (complete)

**Tables to Deploy:**
- `approval_workflows` - Workflow definitions
- `approval_requests` - Individual approval requests
- `approval_certificates` - Generated compliance certificates

---

## 📍 Current Status (as of Oct 17, 2025)

### 🎉 Recently Completed (This Session - Phase 1 Completion)
1. ✅ **SendGrid Email Integration** - Real email delivery for invitations and reminders
2. ✅ **Analytics Dashboard** - Complete with metrics, charts, and activity tracking
3. ✅ **Organization Settings** - Logo upload, brand colors, name editing
4. ✅ **Profile Settings** - Avatar upload, notification preferences
5. ✅ **Billing & Subscription** - Full Stripe integration with 3 tiers
6. ✅ **Database Migrations** - Analytics tables and subscription fields
7. ✅ **Email Templates** - Professional HTML emails with branding

### ✨ Working Features (Production Ready)
- **Logo Management:** Full CRUD operations with Brandfetch integration
- **Asset Designer:** Production-ready canvas tool with Konva
- **Template System:** Complete upload/download/manage workflow
- **Mockup Library:** Save, view, duplicate, export functionality
- **Authentication:** Magic link auth with RLS policies
- **Navigation:** Smooth, persistent navigation with state management
- **Storage:** Supabase Storage configured with proper buckets
- **User Management:** Email invitations, reminders, role management
- **Analytics:** Real-time metrics, charts, activity timeline
- **Settings:** Organization branding, user profiles, notifications
- **Billing:** Stripe subscriptions, usage tracking, customer portal

### 🚧 In Progress
- Nothing currently in progress - Phase 1 is COMPLETE!

### 🐛 Known Issues
- None currently tracked

### 📝 Technical Debt
- None - Phase 1 is complete!
- Ready to deploy Phase 2 schema (Review/Approval tables)

---

## 🏗️ Architecture & Key Decisions

### Technology Stack

**Frontend:**
- Next.js 15.5.5 (App Router with Turbopack)
- React 19
- TypeScript 5.x
- Tailwind CSS 3.x
- Lucide React (icons)

**Canvas/Graphics:**
- Konva.js - Interactive design canvas
- React-Konva - React bindings for Konva

**Backend:**
- Supabase (PostgreSQL 15)
- Supabase Auth (magic link)
- Supabase Storage
- Row-level Security (RLS)

**External APIs:**
- Brandfetch API - Logo search and retrieval

**Deployment:**
- Ready for Vercel deployment
- Environment variables configured

### Key Design Decisions

#### 1. Route Groups Pattern
**Decision:** Use `(dashboard)` route group for all authenticated pages
**Rationale:** Enables persistent layout without affecting URLs, prevents sidebar remounting
**File:** `app/(dashboard)/layout.tsx`

#### 2. Server vs Client Components
**Decision:** Layout is Server Component, interactive features are Client Components
**Rationale:** Optimal performance and SEO while maintaining interactivity where needed
**Examples:**
- Server: `app/(dashboard)/layout.tsx`
- Client: `components/SidebarAuth.tsx`, `components/KonvaCanvas.tsx`

#### 3. localStorage for UI State
**Decision:** Use localStorage for sidebar collapse state and cached role
**Rationale:** Instant UI restoration on page load, prevents flash of wrong state
**Implementation:** Load in `useEffect` after mount to avoid hydration mismatches

#### 4. Toast Notifications Pattern
**Decision:** Use React Fragments to wrap page content + Toast arrays
**Rationale:** React requires single parent element, Fragments avoid extra DOM nodes
**Pattern:**
```tsx
return (
  <>
    <div>{/* main content */}</div>
    {toasts.map(toast => <Toast {...toast} />)}
  </>
)
```

#### 5. Konva Canvas Architecture
**Decision:** Dynamic import with SSR disabled for Konva components
**Rationale:** Konva requires browser APIs, must avoid server-side rendering
**File:** `app/(dashboard)/card-designer/page.tsx` (lines 26-37)

#### 6. Type Safety Strategy
**Decision:** Comprehensive TypeScript types for all features, including future ones
**Rationale:** Enables confident refactoring, self-documenting code
**Files:**
- `lib/types/reviews.ts` - Review & approval types
- `lib/supabase.ts` - Core data types

#### 7. Color Theme
**Decision:** Charcoal theme with `#374151` as primary color
**Rationale:** Professional, modern look appropriate for financial/compliance software
**Usage:** Consistent across buttons, sidebar, headers

---

## 💾 Database Schema Status

### Deployed Tables (Supabase)
✅ **Core Tables:**
- `logos` - Logo storage and metadata
- `card_templates` - Card template storage
- `card_mockups` - Saved mockup designs
- `user_profiles` - Extended user information
- `organizations` - Organization/tenant data
- `organization_invitations` - User invitation system

### Designed but Not Deployed
📋 **Review System** (Phase 2):
- `asset_reviews` - Asset review records
- `review_annotations` - Markup annotations
- `annotation_replies` - Comment threads

📋 **Approval System** (Phase 3):
- `approval_workflows` - Workflow definitions
- `approval_requests` - Approval tracking
- `approval_certificates` - Compliance certificates

**Schema File:** `supabase/schema.sql`
**Action Needed:** Run SQL migrations when starting Phase 2

---

## 🗂️ Project Structure

```
approval-orbit/
├── app/
│   ├── (dashboard)/              # Route group - persistent layout
│   │   ├── layout.tsx            # Persistent Server Component layout
│   │   ├── search/               # Logo search
│   │   ├── library/              # Logo library
│   │   ├── upload/               # Logo upload
│   │   ├── card-designer/        # Asset designer canvas
│   │   ├── card-library/         # Template library
│   │   ├── card-upload/          # Template upload
│   │   ├── mockup-library/       # Saved mockups
│   │   ├── reviews/              # Phase 2 - Review pages (placeholder)
│   │   ├── approvals/            # Phase 3 - Approval pages (placeholder)
│   │   ├── admin/                # Admin section
│   │   └── settings/             # Settings pages
│   ├── api/                      # API routes
│   ├── login/                    # Auth pages
│   └── page.tsx                  # Home/dashboard
├── components/
│   ├── SidebarAuth.tsx           # Authenticated navigation sidebar
│   ├── KonvaCanvas.tsx           # Canvas wrapper component
│   ├── Toast.tsx                 # Notification component
│   └── ComingSoon.tsx            # Placeholder component
├── lib/
│   ├── auth/                     # Authentication utilities
│   ├── types/                    # TypeScript type definitions
│   └── supabase.ts               # Supabase client & types
├── supabase/
│   └── schema.sql                # Complete database schema
├── ROADMAP.md                    # This file
└── README.md                     # Standard Next.js readme
```

---

## 🚀 Next Session Checklist

### Quick Start
1. Review this ROADMAP.md for context
2. Check "Current Status" section above
3. Review "Next Steps" below
4. Run `npm run dev` to start development server

### Next Steps (Priority Order)

#### Immediate (Finish Phase 1)
1. **User Management Backend**
   - Implement invite user API endpoint
   - Add role assignment functionality
   - Build user list with real data
   - Add user activation/deactivation

2. **Analytics Dashboard**
   - Design metrics to track
   - Implement database queries
   - Build visualization components
   - Add date range filtering

3. **Settings Pages**
   - Organization settings form
   - User profile editing
   - File uploads for org logo
   - Notification preferences

4. **Billing Page**
   - Choose payment provider (Stripe?)
   - Design subscription tiers
   - Implement payment flow
   - Invoice generation

#### Near Term (Start Phase 2)
5. **Deploy Review Schema**
   - Run migrations in Supabase
   - Test RLS policies
   - Verify types match schema

6. **Review Creation Flow**
   - Asset upload interface
   - Create review form
   - Associate with workflow
   - Start review action

7. **Annotation Canvas**
   - Choose library (Fabric.js vs Konva layer)
   - Implement comment tool
   - Add arrow tool
   - Shape tools (rectangle, circle)

---

## 📊 Progress Tracking

### Overall Project Completion: ~33%
- Phase 1: 100% complete ✅ (All 10 major features done)
- Phase 2: 0% complete (ready to start)
- Phase 3: 0% complete (not started)

### Phase 1 Completion: 100% ✅
```
████████████████████████████████  100%
```
- ✅ Core Design Tools: 100%
- ✅ Authentication: 100%
- ✅ Navigation: 100%
- ✅ Admin Features: 100% (Complete with SendGrid, Analytics, Settings, Billing)

### Phase 2 Completion: 0%
```
░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  0%
```

### Phase 3 Completion: 0%
```
░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  0%
```

---

## 📝 Session History

### Session 1-3 (Oct 14-16, 2025)
- Initial project setup and basic structure
- Logo search and library implementation
- Asset designer with Konva canvas
- Template and mockup libraries
- Authentication system
- Initial sidebar and navigation

### Session 4 (Oct 17, 2025 - Morning)
- **Focus:** Navigation improvements and bug fixes
- Fixed navigation flashing with route group pattern
- Resolved React hydration errors
- Fixed JSX parsing errors in 6 pages
- Implemented localStorage caching for instant role detection
- Migrated all pages to persistent layout structure
- Removed 19 DashboardLayout wrapper components
- Created comprehensive project roadmap (this file)
- **Commit:** `50239ed` - "Fix navigation flashing and JSX parsing errors"

### Session 5 (Oct 17, 2025 - Afternoon) ⭐️
- **Focus:** Complete Phase 1 (100%)
- **Feature 1: SendGrid Email Integration** ✅
  - Installed @sendgrid/mail package
  - Created professional HTML email templates
  - Integrated with invite and reminder APIs
  - Removed manual link copying flow
- **Feature 2: Analytics Dashboard** ✅
  - Created analytics database schema with triggers
  - Built real-time metrics queries
  - Developed chart components with Recharts
  - Implemented activity timeline
  - Added date range filtering
- **Feature 3: Settings Pages** ✅
  - Built Organization Settings (logo, brand color, name)
  - Built Profile Settings (avatar, notifications)
  - Created reusable ImageUpload component
  - Implemented API routes for both
- **Feature 4: Billing & Subscription** ✅
  - Full Stripe integration (checkout, portal, webhooks)
  - Defined 3 subscription tiers
  - Created PlanCard component
  - Built usage tracking display
  - Webhook handling for subscription events
- **Documentation:**
  - Created SETUP_GUIDE.md with complete instructions
  - Updated ROADMAP.md to reflect 100% Phase 1 completion
  - Created .env.local.example
  - Database migrations for analytics and billing
- **Stats:** 9/9 tasks completed, ~120 minutes, 30+ files created/modified
- **Status:** Phase 1 is 100% COMPLETE! Ready for Phase 2! 🎉

---

## 🔗 Important File References

### Key Configuration Files
- `next.config.ts` - Next.js configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `.env.local` - Environment variables (not in git)
- `tsconfig.json` - TypeScript configuration

### Core Application Files
- `app/(dashboard)/layout.tsx` - Persistent layout (157 lines)
- `components/SidebarAuth.tsx` - Navigation sidebar (311 lines)
- `app/(dashboard)/card-designer/page.tsx` - Main designer (686 lines)
- `lib/types/reviews.ts` - Complete type definitions (345 lines)
- `supabase/schema.sql` - Full database schema (610 lines)

### Authentication
- `lib/auth/config.ts` - Supabase client configuration
- `lib/auth/server.ts` - Server-side auth utilities
- `middleware.ts` - Route protection middleware

---

## 💡 Notes & Context

### Why "Approval Orbit"?
The name reflects the circular flow of assets through creation, review, and approval stages, always orbiting back to refinement until final approval.

### Multi-Tenancy Strategy
Using `organization_id` foreign keys with RLS policies for complete data isolation between organizations. Each user belongs to one organization.

### Future Considerations
- **Mobile app?** Consider React Native version
- **Email notifications?** Resend or SendGrid integration
- **File storage limits?** Implement quotas per plan
- **Webhooks?** Allow external integrations
- **API access?** Consider public API for power users

### Questions to Address
- What should happen to assets when a user leaves an organization?
- How long should we retain archived reviews?
- Should we support external reviewer invites (non-users)?
- What's the pricing model? (per-user? per-approval? per-organization?)

---

## 📞 Support & Resources

### Documentation Links
- [Next.js 15 Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Konva.js Docs](https://konvajs.org/docs/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

### Development Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Environment Variables Required
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
BRANDFETCH_API_KEY=
```

---

**Remember:** Update this file at the end of each session to maintain continuity! 🚀
