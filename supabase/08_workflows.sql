-- ============================================================================
-- MIGRATION 08: WORKFLOWS
-- Adds reusable workflow templates with multi-stage approval sequences
-- ============================================================================

-- Create enum for workflow stage colors
CREATE TYPE workflow_stage_color AS ENUM (
  'yellow',   -- Design/Draft stages
  'green',    -- Approved/Ready stages
  'blue',     -- Review/In-Progress stages
  'purple',   -- Final/Stakeholder stages
  'orange',   -- Changes Requested stages
  'red',      -- Blocked/Rejected stages
  'gray'      -- Pending/Not Started stages
);

-- Workflows table - reusable templates for approval sequences
CREATE TABLE workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  stages JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of {order: number, name: string, color: workflow_stage_color}
  is_default BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  created_by TEXT NOT NULL, -- Clerk user ID
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Project stage reviewers - assigns users to specific workflow stages per project
CREATE TABLE project_stage_reviewers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  stage_order INTEGER NOT NULL, -- Which stage in the workflow (1, 2, 3...)
  user_id TEXT NOT NULL, -- Clerk user ID
  user_name TEXT NOT NULL, -- Cached for display
  user_image_url TEXT, -- Cached avatar URL
  added_by TEXT NOT NULL, -- Clerk user ID who assigned this reviewer
  created_at TIMESTAMP DEFAULT NOW(),

  -- Prevent duplicate reviewers in same stage
  UNIQUE(project_id, stage_order, user_id)
);

-- Add workflow reference to projects (nullable - projects can exist without workflows)
ALTER TABLE projects
ADD COLUMN workflow_id UUID REFERENCES workflows(id) ON DELETE SET NULL;

-- Performance indexes
CREATE INDEX idx_workflows_org ON workflows(organization_id);
CREATE INDEX idx_workflows_org_active ON workflows(organization_id, is_archived) WHERE is_archived = false;
CREATE INDEX idx_workflows_org_default ON workflows(organization_id, is_default) WHERE is_default = true;
CREATE INDEX idx_workflows_created_by ON workflows(created_by);

CREATE INDEX idx_project_reviewers_project ON project_stage_reviewers(project_id);
CREATE INDEX idx_project_reviewers_project_stage ON project_stage_reviewers(project_id, stage_order);
CREATE INDEX idx_project_reviewers_user ON project_stage_reviewers(user_id);

CREATE INDEX idx_projects_workflow ON projects(workflow_id);

-- Updated_at trigger for workflows (reuse existing function)
CREATE TRIGGER update_workflows_updated_at
  BEFORE UPDATE ON workflows
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies (Note: With Clerk auth, all access via API routes)
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_stage_reviewers ENABLE ROW LEVEL SECURITY;

-- Allow all for authenticated users (following same pattern as projects/folders)
-- Authentication is handled at API route level with Clerk
CREATE POLICY "Allow all for authenticated users in org"
  ON workflows FOR ALL
  USING (true);

CREATE POLICY "Allow all for authenticated users in org"
  ON project_stage_reviewers FOR ALL
  USING (true);

-- Comments explaining RLS pattern
COMMENT ON TABLE workflows IS 'Reusable multi-stage approval workflow templates. All access through API routes with Clerk authentication. RLS enabled but permissive - security enforced at API layer.';
COMMENT ON TABLE project_stage_reviewers IS 'Reviewer assignments for each stage of a project workflow. All access through API routes with Clerk authentication.';

-- Helper function to validate workflow stages JSONB structure
CREATE OR REPLACE FUNCTION validate_workflow_stages()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure stages is an array
  IF jsonb_typeof(NEW.stages) != 'array' THEN
    RAISE EXCEPTION 'stages must be a JSON array';
  END IF;

  -- Ensure at least one stage exists
  IF jsonb_array_length(NEW.stages) < 1 THEN
    RAISE EXCEPTION 'workflow must have at least one stage';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_workflow_stages_trigger
  BEFORE INSERT OR UPDATE ON workflows
  FOR EACH ROW
  EXECUTE FUNCTION validate_workflow_stages();
