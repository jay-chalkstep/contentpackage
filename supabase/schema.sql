-- ============================================================================
-- APPROVAL ORBIT - DATABASE SCHEMA FOR REVIEW & APPROVAL WORKFLOWS
-- Version: 1.1.0
-- Phase 2: Asset Reviews, Annotations, Workflows, and Approvals
-- ============================================================================

-- ============================================================================
-- TABLE: asset_reviews
-- Purpose: Track review sessions for assets (prepaid cards, checks, emails)
-- ============================================================================
CREATE TABLE IF NOT EXISTS asset_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Asset Information
  asset_type TEXT NOT NULL CHECK (asset_type IN ('prepaid_card', 'check', 'email_template', 'other')),
  asset_name TEXT NOT NULL,
  asset_url TEXT NOT NULL, -- URL to the asset image/file in Supabase Storage
  thumbnail_url TEXT, -- Thumbnail for quick preview

  -- Version Control
  version_number INTEGER NOT NULL DEFAULT 1,
  parent_review_id UUID REFERENCES asset_reviews(id) ON DELETE SET NULL, -- Links to previous version

  -- Review Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_review', 'approved', 'rejected', 'archived')),

  -- Metadata
  description TEXT,
  metadata JSONB DEFAULT '{}', -- Additional flexible data

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  review_started_at TIMESTAMPTZ,
  review_completed_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT version_positive CHECK (version_number > 0)
);

-- Indexes for asset_reviews
CREATE INDEX idx_asset_reviews_org ON asset_reviews(organization_id);
CREATE INDEX idx_asset_reviews_created_by ON asset_reviews(created_by);
CREATE INDEX idx_asset_reviews_status ON asset_reviews(status);
CREATE INDEX idx_asset_reviews_parent ON asset_reviews(parent_review_id);
CREATE INDEX idx_asset_reviews_created_at ON asset_reviews(created_at DESC);

-- Updated timestamp trigger for asset_reviews
CREATE TRIGGER update_asset_reviews_updated_at
  BEFORE UPDATE ON asset_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABLE: review_annotations
-- Purpose: Store markup annotations (comments, drawings, arrows, shapes)
-- ============================================================================
CREATE TABLE IF NOT EXISTS review_annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES asset_reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Annotation Type
  annotation_type TEXT NOT NULL CHECK (annotation_type IN (
    'comment',      -- Text comment pinned to location
    'arrow',        -- Directional arrow
    'rectangle',    -- Rectangle shape
    'circle',       -- Circle/ellipse shape
    'freehand',     -- Free-form drawing
    'highlight',    -- Highlighted area
    'text_overlay'  -- Text placed on image
  )),

  -- Position & Size Data (JSON for flexibility)
  position_data JSONB NOT NULL DEFAULT '{}',
  -- Example: {"x": 100, "y": 200, "width": 50, "height": 30, "rotation": 0}

  -- Content
  content TEXT, -- Text content for comments and text overlays

  -- Styling
  color TEXT DEFAULT '#374151', -- Hex color code
  stroke_width INTEGER DEFAULT 2,
  opacity REAL DEFAULT 1.0 CHECK (opacity >= 0 AND opacity <= 1),

  -- Status
  resolved BOOLEAN DEFAULT false, -- For comment threads
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for review_annotations
CREATE INDEX idx_review_annotations_review ON review_annotations(review_id);
CREATE INDEX idx_review_annotations_user ON review_annotations(user_id);
CREATE INDEX idx_review_annotations_type ON review_annotations(annotation_type);
CREATE INDEX idx_review_annotations_resolved ON review_annotations(resolved);
CREATE INDEX idx_review_annotations_created_at ON review_annotations(created_at DESC);

-- Updated timestamp trigger for review_annotations
CREATE TRIGGER update_review_annotations_updated_at
  BEFORE UPDATE ON review_annotations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABLE: annotation_replies
-- Purpose: Support threaded conversations on annotations
-- ============================================================================
CREATE TABLE IF NOT EXISTS annotation_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  annotation_id UUID NOT NULL REFERENCES review_annotations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Content
  content TEXT NOT NULL,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for annotation_replies
CREATE INDEX idx_annotation_replies_annotation ON annotation_replies(annotation_id);
CREATE INDEX idx_annotation_replies_user ON annotation_replies(user_id);
CREATE INDEX idx_annotation_replies_created_at ON annotation_replies(created_at ASC);

-- Updated timestamp trigger for annotation_replies
CREATE TRIGGER update_annotation_replies_updated_at
  BEFORE UPDATE ON annotation_replies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABLE: approval_workflows
-- Purpose: Define approval workflow templates for organizations
-- ============================================================================
CREATE TABLE IF NOT EXISTS approval_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Workflow Definition
  name TEXT NOT NULL,
  description TEXT,
  asset_type TEXT CHECK (asset_type IN ('prepaid_card', 'check', 'email_template', 'other', 'all')),

  -- Stages Configuration (JSON array)
  stages JSONB NOT NULL DEFAULT '[]',
  -- Example: [
  --   {"order": 1, "name": "Client Review", "role": "user", "required": true},
  --   {"order": 2, "name": "Legal Review", "role": "admin", "required": true},
  --   {"order": 3, "name": "Final Approval", "role": "admin", "required": true}
  -- ]

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false, -- Default workflow for this asset type

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for approval_workflows
CREATE INDEX idx_approval_workflows_org ON approval_workflows(organization_id);
CREATE INDEX idx_approval_workflows_active ON approval_workflows(is_active);
CREATE INDEX idx_approval_workflows_asset_type ON approval_workflows(asset_type);

-- Partial unique index to ensure only one default workflow per asset type per organization
CREATE UNIQUE INDEX idx_unique_default_workflow
  ON approval_workflows(organization_id, asset_type)
  WHERE is_default = true;

-- Updated timestamp trigger for approval_workflows
CREATE TRIGGER update_approval_workflows_updated_at
  BEFORE UPDATE ON approval_workflows
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABLE: approval_requests
-- Purpose: Track individual approval requests at each workflow stage
-- ============================================================================
CREATE TABLE IF NOT EXISTS approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES asset_reviews(id) ON DELETE CASCADE,
  workflow_id UUID NOT NULL REFERENCES approval_workflows(id) ON DELETE CASCADE,

  -- Stage Information
  stage_order INTEGER NOT NULL,
  stage_name TEXT NOT NULL,

  -- Approver
  approver_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'skipped')),

  -- Decision Details
  decision_date TIMESTAMPTZ,
  comments TEXT,
  signature_data TEXT, -- Base64 encoded signature image or typed name

  -- Conditional Approval
  conditions TEXT, -- Any conditions attached to the approval

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notified_at TIMESTAMPTZ, -- When approver was notified

  -- Constraints
  CONSTRAINT stage_order_positive CHECK (stage_order > 0)
);

-- Indexes for approval_requests
CREATE INDEX idx_approval_requests_review ON approval_requests(review_id);
CREATE INDEX idx_approval_requests_workflow ON approval_requests(workflow_id);
CREATE INDEX idx_approval_requests_approver ON approval_requests(approver_user_id);
CREATE INDEX idx_approval_requests_status ON approval_requests(status);
CREATE INDEX idx_approval_requests_stage ON approval_requests(stage_order);
CREATE INDEX idx_approval_requests_created_at ON approval_requests(created_at DESC);

-- Updated timestamp trigger for approval_requests
CREATE TRIGGER update_approval_requests_updated_at
  BEFORE UPDATE ON approval_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABLE: approval_certificates
-- Purpose: Store generated approval certificates for compliance
-- ============================================================================
CREATE TABLE IF NOT EXISTS approval_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES asset_reviews(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Certificate Details
  certificate_number TEXT UNIQUE NOT NULL, -- Auto-generated unique identifier
  certificate_url TEXT NOT NULL, -- URL to PDF in Supabase Storage

  -- Approval Summary
  total_approvers INTEGER NOT NULL DEFAULT 0,
  approval_chain JSONB NOT NULL DEFAULT '[]', -- Array of all approver details
  -- Example: [
  --   {"stage": 1, "approver": "John Doe", "date": "2025-01-01T12:00:00Z", "signature": "..."},
  --   {"stage": 2, "approver": "Jane Smith", "date": "2025-01-02T14:30:00Z", "signature": "..."}
  -- ]

  -- Audit Trail
  audit_trail JSONB NOT NULL DEFAULT '[]', -- Complete history of all actions

  -- Timestamps
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for approval_certificates
CREATE INDEX idx_approval_certificates_review ON approval_certificates(review_id);
CREATE INDEX idx_approval_certificates_org ON approval_certificates(organization_id);
CREATE INDEX idx_approval_certificates_number ON approval_certificates(certificate_number);
CREATE INDEX idx_approval_certificates_generated_at ON approval_certificates(generated_at DESC);

-- ============================================================================
-- FUNCTION: Generate Certificate Number
-- Purpose: Auto-generate unique certificate numbers
-- ============================================================================
CREATE OR REPLACE FUNCTION generate_certificate_number()
RETURNS TEXT AS $$
DECLARE
  cert_number TEXT;
  year_prefix TEXT;
BEGIN
  year_prefix := TO_CHAR(CURRENT_DATE, 'YYYY');
  cert_number := year_prefix || '-' || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0');

  -- Ensure uniqueness
  WHILE EXISTS (SELECT 1 FROM approval_certificates WHERE certificate_number = cert_number) LOOP
    cert_number := year_prefix || '-' || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0');
  END LOOP;

  RETURN cert_number;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE asset_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE annotation_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_certificates ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES: asset_reviews
-- ============================================================================

-- Users can view reviews in their organization
CREATE POLICY "Users can view reviews in their organization"
  ON asset_reviews FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- Users can create reviews in their organization
CREATE POLICY "Users can create reviews in their organization"
  ON asset_reviews FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
    AND created_by = auth.uid()
  );

-- Users can update their own reviews or if they're admin
CREATE POLICY "Users can update reviews they created or admins can update any"
  ON asset_reviews FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
    AND (
      created_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid()
        AND role = 'admin'
        AND organization_id = asset_reviews.organization_id
      )
    )
  );

-- Only admins can delete reviews
CREATE POLICY "Only admins can delete reviews"
  ON asset_reviews FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'admin'
      AND organization_id = asset_reviews.organization_id
    )
  );

-- ============================================================================
-- RLS POLICIES: review_annotations
-- ============================================================================

-- Users can view annotations on reviews in their organization
CREATE POLICY "Users can view annotations in their organization"
  ON review_annotations FOR SELECT
  USING (
    review_id IN (
      SELECT id FROM asset_reviews
      WHERE organization_id IN (
        SELECT organization_id FROM user_profiles WHERE id = auth.uid()
      )
    )
  );

-- Users can create annotations on reviews in their organization
CREATE POLICY "Users can create annotations"
  ON review_annotations FOR INSERT
  WITH CHECK (
    review_id IN (
      SELECT id FROM asset_reviews
      WHERE organization_id IN (
        SELECT organization_id FROM user_profiles WHERE id = auth.uid()
      )
    )
    AND user_id = auth.uid()
  );

-- Users can update their own annotations
CREATE POLICY "Users can update their own annotations"
  ON review_annotations FOR UPDATE
  USING (user_id = auth.uid());

-- Users can delete their own annotations
CREATE POLICY "Users can delete their own annotations"
  ON review_annotations FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================================
-- RLS POLICIES: annotation_replies
-- ============================================================================

-- Users can view replies to annotations they can access
CREATE POLICY "Users can view annotation replies in their organization"
  ON annotation_replies FOR SELECT
  USING (
    annotation_id IN (
      SELECT id FROM review_annotations
      WHERE review_id IN (
        SELECT id FROM asset_reviews
        WHERE organization_id IN (
          SELECT organization_id FROM user_profiles WHERE id = auth.uid()
        )
      )
    )
  );

-- Users can create replies
CREATE POLICY "Users can create annotation replies"
  ON annotation_replies FOR INSERT
  WITH CHECK (
    annotation_id IN (
      SELECT id FROM review_annotations
      WHERE review_id IN (
        SELECT id FROM asset_reviews
        WHERE organization_id IN (
          SELECT organization_id FROM user_profiles WHERE id = auth.uid()
        )
      )
    )
    AND user_id = auth.uid()
  );

-- Users can update their own replies
CREATE POLICY "Users can update their own replies"
  ON annotation_replies FOR UPDATE
  USING (user_id = auth.uid());

-- Users can delete their own replies
CREATE POLICY "Users can delete their own replies"
  ON annotation_replies FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================================
-- RLS POLICIES: approval_workflows
-- ============================================================================

-- Users can view workflows in their organization
CREATE POLICY "Users can view workflows in their organization"
  ON approval_workflows FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- Only admins can create workflows
CREATE POLICY "Only admins can create workflows"
  ON approval_workflows FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'admin'
      AND organization_id = approval_workflows.organization_id
    )
    AND created_by = auth.uid()
  );

-- Only admins can update workflows
CREATE POLICY "Only admins can update workflows"
  ON approval_workflows FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'admin'
      AND organization_id = approval_workflows.organization_id
    )
  );

-- Only admins can delete workflows
CREATE POLICY "Only admins can delete workflows"
  ON approval_workflows FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'admin'
      AND organization_id = approval_workflows.organization_id
    )
  );

-- ============================================================================
-- RLS POLICIES: approval_requests
-- ============================================================================

-- Users can view approval requests in their organization or assigned to them
CREATE POLICY "Users can view approval requests in their organization"
  ON approval_requests FOR SELECT
  USING (
    review_id IN (
      SELECT id FROM asset_reviews
      WHERE organization_id IN (
        SELECT organization_id FROM user_profiles WHERE id = auth.uid()
      )
    )
  );

-- System/admins can create approval requests
CREATE POLICY "Admins can create approval requests"
  ON approval_requests FOR INSERT
  WITH CHECK (
    review_id IN (
      SELECT id FROM asset_reviews
      WHERE organization_id IN (
        SELECT organization_id FROM user_profiles
        WHERE id = auth.uid()
        AND role = 'admin'
      )
    )
  );

-- Approvers can update their own approval requests
CREATE POLICY "Approvers can update their approval requests"
  ON approval_requests FOR UPDATE
  USING (
    approver_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'admin'
      AND organization_id IN (
        SELECT organization_id FROM asset_reviews WHERE id = approval_requests.review_id
      )
    )
  );

-- Only admins can delete approval requests
CREATE POLICY "Only admins can delete approval requests"
  ON approval_requests FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'admin'
      AND organization_id IN (
        SELECT organization_id FROM asset_reviews WHERE id = approval_requests.review_id
      )
    )
  );

-- ============================================================================
-- RLS POLICIES: approval_certificates
-- ============================================================================

-- Users can view certificates in their organization
CREATE POLICY "Users can view certificates in their organization"
  ON approval_certificates FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- Only system can insert certificates (typically via backend function)
CREATE POLICY "System can create certificates"
  ON approval_certificates FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- Admins can update certificates (e.g., regenerate)
CREATE POLICY "Admins can update certificates"
  ON approval_certificates FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'admin'
      AND organization_id = approval_certificates.organization_id
    )
  );

-- Only admins can delete certificates
CREATE POLICY "Only admins can delete certificates"
  ON approval_certificates FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'admin'
      AND organization_id = approval_certificates.organization_id
    )
  );

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE asset_reviews IS 'Tracks review sessions for visual assets (prepaid cards, checks, email templates)';
COMMENT ON TABLE review_annotations IS 'Stores markup annotations including comments, drawings, arrows, and shapes';
COMMENT ON TABLE annotation_replies IS 'Supports threaded conversations on annotations';
COMMENT ON TABLE approval_workflows IS 'Defines reusable approval workflow templates with sequential stages';
COMMENT ON TABLE approval_requests IS 'Tracks individual approval requests at each workflow stage';
COMMENT ON TABLE approval_certificates IS 'Stores generated approval certificates for compliance and audit';

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
