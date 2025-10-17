-- ============================================================================
-- ADD SUBSCRIPTION FIELDS TO ORGANIZATIONS TABLE
-- For Stripe subscription management
-- ============================================================================

-- Add subscription-related columns to organizations table
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'starter',
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS brand_color TEXT DEFAULT '#374151';

-- Add check constraint for subscription tier
ALTER TABLE organizations
ADD CONSTRAINT organizations_subscription_tier_check
CHECK (subscription_tier IN ('starter', 'professional', 'enterprise'));

-- Add check constraint for subscription status
ALTER TABLE organizations
ADD CONSTRAINT organizations_subscription_status_check
CHECK (subscription_status IN ('active', 'canceled', 'past_due', 'unpaid', 'trialing'));

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_organizations_stripe_customer ON organizations(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_organizations_stripe_subscription ON organizations(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_organizations_subscription_status ON organizations(subscription_status);

-- Add notification preferences to user_profiles
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"on_invite": true, "on_review": true, "weekly_digest": false}'::jsonb;

COMMENT ON COLUMN organizations.subscription_tier IS 'Current subscription plan: starter, professional, or enterprise';
COMMENT ON COLUMN organizations.subscription_status IS 'Stripe subscription status';
COMMENT ON COLUMN organizations.stripe_customer_id IS 'Stripe customer ID for billing';
COMMENT ON COLUMN organizations.stripe_subscription_id IS 'Stripe subscription ID';
COMMENT ON COLUMN organizations.logo_url IS 'Organization logo URL';
COMMENT ON COLUMN organizations.brand_color IS 'Organization brand color (hex)';
COMMENT ON COLUMN user_profiles.notification_preferences IS 'User email notification preferences';
