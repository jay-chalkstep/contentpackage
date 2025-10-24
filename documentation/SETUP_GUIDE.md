# Setup Guide - Approval Orbit Phase 1

## 🎉 What We Built Today

We successfully completed **Phase 1** (100%) with these 4 major features:

### 1. SendGrid Email Integration ✅
- Professional HTML email templates for invitations and reminders
- Real email delivery (no more manual link sharing!)
- Graceful fallback handling if emails fail

### 2. Analytics Dashboard ✅
- Real-time metrics: users, assets, storage
- Interactive charts showing trends over time
- Activity timeline with recent actions
- Date range filtering (7/30/90 days)
- Database schema with automatic activity logging

### 3. Settings Pages ✅
- **Organization Settings**: Edit name, upload logo, set brand colors
- **Profile Settings**: Update name, avatar, notification preferences
- Reusable ImageUpload component with Supabase Storage
- Form validation and success/error handling

### 4. Billing & Subscription ✅
- Complete Stripe integration
- 3 subscription tiers: Starter ($29), Professional ($99), Enterprise ($299)
- Stripe Checkout for upgrades
- Customer Portal for subscription management
- Webhook handling for subscription events
- Usage tracking (users, storage)

---

## 🚀 Setup Instructions

### Step 1: Database Migrations

Run these SQL migrations in your Supabase SQL Editor (in order):

1. **Analytics Tables** (`supabase/migrations/002_add_analytics.sql`)
2. **Subscription Fields** (`supabase/migrations/003_add_subscription_fields.sql`)

```bash
# Or use Supabase CLI if you have it
supabase db push
```

### Step 2: Environment Variables

Update your `.env.local` file with the following:

#### SendGrid Setup
1. Go to https://sendgrid.com
2. Create an account (free tier available)
3. Navigate to Settings > API Keys
4. Create a new API key with "Mail Send" permission
5. Add to `.env.local`:
```bash
SENDGRID_API_KEY=SG.your_key_here
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_FROM_NAME=Approval Orbit
```

#### Supabase Service Role Key
1. Go to your Supabase project settings
2. Navigate to API section
3. Copy the `service_role` key (NOT the anon key)
4. Add to `.env.local`:
```bash
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

#### Stripe Setup
1. Go to https://stripe.com
2. Create account (test mode is fine)
3. Get your API keys from Dashboard > Developers > API keys
4. Add to `.env.local`:
```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_SECRET_KEY=sk_test_your_key_here
```

5. **Setup Stripe Webhook** (for local testing):
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3001/api/stripe/webhook

# Copy the webhook secret (starts with whsec_) to .env.local:
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

For production webhooks:
- Go to Stripe Dashboard > Developers > Webhooks
- Add endpoint: `https://yourdomain.com/api/stripe/webhook`
- Select these events:
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`

### Step 3: Supabase Storage Buckets

Create these storage buckets in Supabase:

1. Go to Storage in Supabase Dashboard
2. Create bucket: `assets` (public)
3. Set up RLS policies to allow authenticated users to upload

### Step 4: Test the Features

1. **Start the dev server:**
```bash
npm run dev
```

2. **Test SendGrid Emails:**
   - Go to User Management (/admin/users)
   - Click "Invite User"
   - Enter an email and send
   - Check the recipient's inbox

3. **Test Analytics:**
   - Go to Analytics (/admin/analytics)
   - Should see real metrics from your data
   - Try creating logos/mockups and watch activity appear

4. **Test Settings:**
   - Go to Organization Settings (/settings/organization)
   - Upload a logo, change name
   - Go to Profile Settings (/settings/profile)
   - Upload avatar, toggle notifications

5. **Test Billing (with test card):**
   - Go to Billing (/admin/billing)
   - Click on a plan
   - Use Stripe test card: `4242 4242 4242 4242`
   - Any future date, any CVC
   - Complete checkout and verify webhook updates database

---

## 📁 File Structure

### New Files Created

```
lib/
├── email/
│   ├── sendgrid.ts          # Email service
│   └── templates.ts         # Email templates
├── analytics/
│   └── queries.ts           # Analytics data queries
├── stripe/
│   ├── config.ts            # Stripe client setup
│   └── plans.ts             # Subscription plan definitions

components/
├── analytics/
│   ├── StatCard.tsx         # Metric display card
│   ├── ActivityTimeline.tsx # Activity feed
│   └── AssetChart.tsx       # Recharts line chart
├── settings/
│   └── ImageUpload.tsx      # Reusable image uploader
└── billing/
    └── PlanCard.tsx         # Subscription plan card

app/api/
├── invite/
│   ├── route.ts             # Updated with SendGrid
│   └── [id]/remind/route.ts # Updated with SendGrid
├── settings/
│   ├── organization/route.ts
│   └── profile/route.ts
└── stripe/
    ├── checkout/route.ts    # Create checkout session
    ├── portal/route.ts      # Customer portal access
    └── webhook/route.ts     # Handle Stripe events

supabase/migrations/
├── 002_add_analytics.sql    # Analytics tables & triggers
└── 003_add_subscription_fields.sql # Billing fields
```

### Updated Files

- `app/(dashboard)/admin/analytics/page.tsx` - Full dashboard
- `app/(dashboard)/admin/billing/page.tsx` - Stripe integration
- `app/(dashboard)/admin/users/page.tsx` - Removed invite link modal
- `app/(dashboard)/settings/organization/page.tsx` - Working settings
- `app/(dashboard)/settings/profile/page.tsx` - Working settings
- `package.json` - Added @sendgrid/mail

---

## 🧪 Testing Checklist

### SendGrid
- [ ] Invitation emails are received
- [ ] Reminder emails work
- [ ] Email templates display correctly in Gmail/Outlook
- [ ] Links in emails work correctly

### Analytics
- [ ] Dashboard loads with real data
- [ ] Charts render correctly
- [ ] Activity timeline shows recent events
- [ ] Date range filter updates data
- [ ] Creating assets updates analytics in real-time

### Settings
- [ ] Organization name saves
- [ ] Logo upload works and displays
- [ ] Brand color updates
- [ ] Profile name saves
- [ ] Avatar upload works
- [ ] Notification preferences save

### Billing
- [ ] Plan cards display correctly
- [ ] Stripe checkout opens
- [ ] Test payment completes
- [ ] Webhook updates database
- [ ] Current plan displays correctly
- [ ] Usage metrics show accurate data
- [ ] Customer portal link works

---

## 🐛 Troubleshooting

### SendGrid Emails Not Sending
- Check API key is correct
- Verify sender email is verified in SendGrid
- Check Supabase logs for errors
- Ensure `SENDGRID_FROM_EMAIL` matches verified sender

### Analytics Not Showing Data
- Run the migration: `002_add_analytics.sql`
- Check if triggers are created properly
- Verify RLS policies allow reading from analytics tables
- Check browser console for errors

### Image Upload Fails
- Verify `assets` bucket exists in Supabase Storage
- Check bucket is set to public
- Ensure RLS policies allow authenticated uploads
- Check file size is under limit (2MB for avatars, 5MB for org logos)

### Stripe Checkout Fails
- Verify Stripe keys are correct (test mode vs live mode)
- Check webhook is receiving events (stripe listen)
- Ensure webhook secret matches
- Check Supabase service role key is set (for webhooks)

### Database Errors
- Run migrations in correct order
- Check Supabase logs for SQL errors
- Verify all required columns exist
- Ensure RLS policies don't block operations

---

## 🔒 Security Notes

1. **Never commit** `.env.local` to git
2. **Use test mode** for Stripe during development
3. **Verify webhook signatures** (already implemented)
4. **RLS policies** control data access
5. **Service role key** should only be used server-side

---

## 📊 Phase 1 Status: 100% COMPLETE

- ✅ SendGrid Email Integration
- ✅ Analytics Dashboard
- ✅ Organization Settings
- ✅ Profile Settings
- ✅ Billing & Subscription

**Ready for Phase 2: Markup & Collaboration!**

---

## 🎯 Next Steps

### Immediate (to make everything work):
1. Apply database migrations
2. Add environment variables
3. Test each feature
4. Set up Stripe webhook

### Future Enhancements:
- Real Stripe product/price IDs (instead of inline price_data)
- Invoice history display
- Usage-based billing alerts
- Email template customization
- Analytics export functionality
- More detailed activity tracking

---

## 📞 Support

If you encounter issues:

1. Check the Troubleshooting section above
2. Review Supabase logs (Logs & Reports in dashboard)
3. Check browser console for client-side errors
4. Verify all environment variables are set correctly
5. Ensure migrations were applied successfully

---

**Built with:** Next.js 15, Supabase, SendGrid, Stripe, Recharts, Tailwind CSS

**Session completed:** October 17, 2025
