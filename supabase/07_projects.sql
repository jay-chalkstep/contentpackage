-- ============================================================================
-- MIGRATION 07: PROJECTS
-- Adds project-based organization for client engagements
-- ============================================================================

-- Create enum for project status
CREATE TYPE project_status AS ENUM ('active', 'completed', 'archived');

-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id TEXT NOT NULL,
  name TEXT NOT NULL,
  client_name TEXT,
  description TEXT,
  status project_status DEFAULT 'active',
  color TEXT DEFAULT '#3B82F6', -- For UI customization (blue default)
  created_by TEXT NOT NULL, -- Clerk user ID
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add project reference to mockups (nullable - mockups can exist without projects)
ALTER TABLE card_mockups
ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

-- Performance indexes
CREATE INDEX idx_projects_org ON projects(organization_id);
CREATE INDEX idx_projects_org_status ON projects(organization_id, status);
CREATE INDEX idx_projects_created_by ON projects(created_by);
CREATE INDEX idx_mockups_project ON card_mockups(project_id);
CREATE INDEX idx_mockups_project_org ON card_mockups(project_id, organization_id);

-- Updated_at trigger (follows existing pattern from folders)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies (Note: With Clerk auth, all access via API routes, but add for safety)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Default deny all direct access (force through API routes)
CREATE POLICY "No direct access to projects"
  ON projects FOR ALL
  USING (false);

-- Comment explaining why RLS is restrictive
COMMENT ON TABLE projects IS 'All access must go through API routes due to Clerk authentication pattern';
