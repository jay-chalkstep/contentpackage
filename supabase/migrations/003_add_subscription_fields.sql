-- ============================================================================
-- ADD SUBSCRIPTION FIELDS TO ORGANIZATIONS TABLE
-- For Stripe subscription management
-- ============================================================================

-- First, update any existing rows to use the new valid values
UPDATE organizations
SET subscription_tier = 'starter'
WHERE subscription_tier NOT IN ('starter', 'professional', 'enterprise');

UPDATE organizations
SET subscription_status = 'active'
WHERE subscription_status NOT IN ('active', 'canceled', 'past_due', 'unpaid', 'trialing');

-- Add subscription-related columns that don't exist yet
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'starter';

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active';

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMPTZ;

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMPTZ;

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS logo_url TEXT;

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS brand_color TEXT DEFAULT '#374151';

-- Drop old constraints if they exist
ALTER TABLE organizations DROP CONSTRAINT IF EXISTS organizations_subscription_tier_check;
ALTER TABLE organizations DROP CONSTRAINT IF EXISTS organizations_subscription_status_check;

-- Add check constraints for subscription tier
ALTER TABLE organizations
ADD CONSTRAINT organizations_subscription_tier_check
CHECK (subscription_tier IN ('starter', 'professional', 'enterprise'));

-- Add check constraint for subscription status
ALTER TABLE organizations
ADD CONSTRAINT organizations_subscription_status_check
CHECK (subscription_status IN ('active', 'canceled', 'past_due', 'unpaid', 'trialing'));

-- Make stripe IDs unique (drop first if exists)
DROP INDEX IF EXISTS idx_organizations_stripe_customer_unique;
DROP INDEX IF EXISTS idx_organizations_stripe_subscription_unique;

CREATE UNIQUE INDEX idx_organizations_stripe_customer_unique
ON organizations(stripe_customer_id)
WHERE stripe_customer_id IS NOT NULL;

CREATE UNIQUE INDEX idx_organizations_stripe_subscription_unique
ON organizations(stripe_subscription_id)
WHERE stripe_subscription_id IS NOT NULL;

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_organizations_stripe_customer ON organizations(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_organizations_stripe_subscription ON organizations(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_organizations_subscription_status ON organizations(subscription_status);

-- Add notification preferences to user_profiles
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"on_invite": true, "on_review": true, "weekly_digest": false}'::jsonb;

-- Add comments
COMMENT ON COLUMN organizations.subscription_tier IS 'Current subscription plan: starter, professional, or enterprise';
COMMENT ON COLUMN organizations.subscription_status IS 'Stripe subscription status';
COMMENT ON COLUMN organizations.stripe_customer_id IS 'Stripe customer ID for billing';
COMMENT ON COLUMN organizations.stripe_subscription_id IS 'Stripe subscription ID';
COMMENT ON COLUMN organizations.logo_url IS 'Organization logo URL';
COMMENT ON COLUMN organizations.brand_color IS 'Organization brand color (hex)';
COMMENT ON COLUMN user_profiles.notification_preferences IS 'User email notification preferences';
