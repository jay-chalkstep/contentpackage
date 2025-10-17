-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  domain VARCHAR(255),
  subscription_status VARCHAR(50) DEFAULT 'trial',
  subscription_tier VARCHAR(50) DEFAULT 'free',
  subscription_end_date TIMESTAMP WITH TIME ZONE,
  max_users INTEGER DEFAULT 5,
  max_storage_mb INTEGER DEFAULT 1000,
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  avatar_url TEXT,
  role VARCHAR(50) DEFAULT 'user', -- 'admin', 'user'
  department VARCHAR(255),
  job_title VARCHAR(255),
  phone VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  storage_used_mb INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Organization invitations table
CREATE TABLE IF NOT EXISTS organization_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  invited_by UUID REFERENCES user_profiles(id),
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Organization assets (company-wide approved logos and templates)
CREATE TABLE IF NOT EXISTS organization_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  asset_type VARCHAR(50) NOT NULL, -- 'logo', 'template'
  asset_name VARCHAR(255) NOT NULL,
  asset_url TEXT NOT NULL,
  file_type VARCHAR(50),
  file_size_kb INTEGER,
  metadata JSONB,
  approved_by UUID REFERENCES user_profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User activity logs
CREATE TABLE IF NOT EXISTS user_activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  action VARCHAR(255) NOT NULL,
  resource_type VARCHAR(100),
  resource_id UUID,
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shared mockups repository
CREATE TABLE IF NOT EXISTS shared_mockups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mockup_id UUID NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  shared_by UUID REFERENCES user_profiles(id),
  title VARCHAR(255),
  description TEXT,
  tags TEXT[],
  is_featured BOOLEAN DEFAULT false,
  featured_by UUID REFERENCES user_profiles(id),
  view_count INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Organization settings
CREATE TABLE IF NOT EXISTS organization_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  allow_google_sso BOOLEAN DEFAULT true,
  allow_email_signup BOOLEAN DEFAULT true,
  require_email_verification BOOLEAN DEFAULT true,
  default_user_role VARCHAR(50) DEFAULT 'user',
  branding_logo_url TEXT,
  branding_primary_color VARCHAR(7),
  branding_secondary_color VARCHAR(7),
  auto_approve_mockups BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update existing logos table
ALTER TABLE logos ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES user_profiles(id);
ALTER TABLE logos ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE logos ADD COLUMN IF NOT EXISTS visibility VARCHAR(50) DEFAULT 'private'; -- 'private', 'organization'

-- Update existing card_templates table
ALTER TABLE card_templates ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES user_profiles(id);
ALTER TABLE card_templates ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE card_templates ADD COLUMN IF NOT EXISTS visibility VARCHAR(50) DEFAULT 'private';

-- Update existing card_mockups table
ALTER TABLE card_mockups ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES user_profiles(id);
ALTER TABLE card_mockups ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE card_mockups ADD COLUMN IF NOT EXISTS visibility VARCHAR(50) DEFAULT 'private';
ALTER TABLE card_mockups ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT false;

-- Create indexes for better performance
CREATE INDEX idx_user_profiles_organization ON user_profiles(organization_id);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_organization_invitations_token ON organization_invitations(token);
CREATE INDEX idx_organization_invitations_email ON organization_invitations(email);
CREATE INDEX idx_organization_assets_org ON organization_assets(organization_id);
CREATE INDEX idx_user_activity_logs_user ON user_activity_logs(user_id);
CREATE INDEX idx_user_activity_logs_org ON user_activity_logs(organization_id);
CREATE INDEX idx_shared_mockups_org ON shared_mockups(organization_id);
CREATE INDEX idx_logos_user ON logos(user_id);
CREATE INDEX idx_logos_org ON logos(organization_id);
CREATE INDEX idx_card_templates_user ON card_templates(user_id);
CREATE INDEX idx_card_templates_org ON card_templates(organization_id);
CREATE INDEX idx_card_mockups_user ON card_mockups(user_id);
CREATE INDEX idx_card_mockups_org ON card_mockups(organization_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at columns
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organization_assets_updated_at BEFORE UPDATE ON organization_assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organization_settings_updated_at BEFORE UPDATE ON organization_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();