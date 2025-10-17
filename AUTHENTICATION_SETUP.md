# Multi-Tenant Authentication Setup Guide

## Overview

This application now supports multi-tenant authentication with hierarchical user management. Organizations can sign up, manage users, and control access to resources.

## Features Implemented

### Core Authentication Features
- ✅ Email/password authentication
- ✅ Google OAuth authentication
- ✅ Password reset functionality
- ✅ Session management with JWT tokens
- ✅ Protected routes with middleware
- ✅ Row-level security in database

### Multi-Tenant Features
- ✅ Organization-based accounts
- ✅ User roles (Admin, Regular User)
- ✅ Segregated user libraries
- ✅ Company-wide asset management
- ✅ Selective content sharing

### Database Schema
- ✅ Organizations table
- ✅ User profiles linked to organizations
- ✅ Organization invitations system
- ✅ Organization assets management
- ✅ User activity logging
- ✅ Shared mockups repository

## Setup Instructions

### 1. Supabase Configuration

1. **Create a Supabase Project**
   - Go to [Supabase Dashboard](https://app.supabase.com)
   - Create a new project
   - Note your project URL and anon key

2. **Run Database Migrations**
   ```sql
   -- Run the contents of:
   -- supabase/migrations/001_multi_tenant_auth.sql
   -- supabase/migrations/002_row_level_security.sql
   ```

3. **Enable Authentication Providers**
   - Go to Authentication → Providers in Supabase
   - Enable Email provider
   - Enable Google provider (requires OAuth credentials)

4. **Configure Storage Buckets**
   - Ensure these buckets exist with proper policies:
     - `logos`
     - `card-templates`
     - `card-mockups`

### 2. Google OAuth Setup

1. **Create Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing

2. **Enable OAuth 2.0**
   - Navigate to APIs & Services → Credentials
   - Create OAuth 2.0 Client ID
   - Application type: Web application
   - Add authorized redirect URIs:
     - `http://localhost:3000/auth/callback` (development)
     - `https://your-domain.com/auth/callback` (production)
     - `https://your-project.supabase.co/auth/v1/callback` (Supabase)

3. **Configure in Supabase**
   - Add Google Client ID and Secret in Supabase Auth settings

### 3. Environment Variables

1. **Copy the example file**
   ```bash
   cp .env.example .env.local
   ```

2. **Fill in your credentials**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret

   BRANDFETCH_API_KEY=your-existing-key

   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

### 4. Stripe Setup (Optional - for billing)

1. **Create Stripe Account**
   - Sign up at [Stripe Dashboard](https://dashboard.stripe.com)
   - Get your API keys

2. **Configure Products/Prices**
   - Create subscription products for each tier
   - Note the price IDs

3. **Set up Webhooks**
   - Add webhook endpoint: `/api/stripe/webhook`
   - Listen for events:
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`

## User Flows

### Organization Registration
1. User signs up with email or Google
2. Creates organization (name, slug)
3. Becomes admin of organization
4. Can invite team members

### User Invitation Flow
1. Admin sends invitation via email
2. User receives email with invitation link
3. User signs up/logs in
4. Automatically joins organization

### Resource Access Hierarchy
```
Personal Resources (Private by default)
├── User's own logos
├── User's own templates
└── User's own mockups

Organization Resources
├── Company-approved logos (Admin-managed)
├── Company-approved templates (Admin-managed)
└── Shared mockups repository (User-contributed)
```

## Admin Capabilities

### User Management
- Invite users via email
- Remove users from organization
- Change user roles (admin/user)
- View user activity logs
- Set user quotas

### Content Control
- Approve/reject shared content
- Manage company-wide assets
- Delete any organization content
- Set visibility policies

### Billing & Analytics
- Manage subscription
- View usage statistics
- Export reports
- Handle payments

## Testing the Setup

### 1. Test Registration
```bash
npm run dev
# Navigate to http://localhost:3000/register
# Create a new account with organization
```

### 2. Test Login
```bash
# Navigate to http://localhost:3000/login
# Test email/password and Google login
```

### 3. Test Protected Routes
```bash
# Try accessing /dashboard without login
# Should redirect to /login
```

### 4. Test Database Policies
```sql
-- In Supabase SQL Editor, test RLS policies
SELECT * FROM logos; -- Should only see user's own + org shared
SELECT * FROM organizations; -- Should only see user's organization
```

## Deployment Considerations

### Production Environment Variables
- Use production Supabase project
- Update OAuth redirect URLs
- Set proper CORS origins
- Enable email verification

### Security Checklist
- [ ] Enable RLS on all tables
- [ ] Set up proper CORS policies
- [ ] Configure rate limiting
- [ ] Enable email verification
- [ ] Set up monitoring/logging
- [ ] Regular security audits
- [ ] Backup strategy

### Performance Optimization
- [ ] Database indexes created
- [ ] Caching strategy implemented
- [ ] CDN for static assets
- [ ] Optimized queries
- [ ] Connection pooling

## Troubleshooting

### Common Issues

1. **"Invalid authentication credentials"**
   - Check Supabase URL and keys
   - Ensure RLS policies are correct

2. **Google OAuth not working**
   - Verify redirect URIs match exactly
   - Check Google Client ID/Secret
   - Ensure cookies are enabled

3. **Middleware redirect loops**
   - Check middleware matcher config
   - Verify public routes list
   - Clear browser cookies

4. **Database permission errors**
   - Run migration scripts
   - Check RLS policies
   - Verify user roles

## Next Steps

1. **Complete Admin Dashboard**
   - User management interface
   - Analytics dashboard
   - Billing management

2. **Email Notifications**
   - Welcome emails
   - Invitation emails
   - Activity notifications

3. **Advanced Features**
   - Two-factor authentication
   - SSO for enterprise
   - API key management
   - Audit logs

## Support

For issues or questions:
- Check Supabase logs
- Review browser console
- Check Next.js server logs
- Contact support team