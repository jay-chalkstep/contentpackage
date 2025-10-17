// ============================================================================
// TYPESCRIPT TYPES FOR REVIEW & APPROVAL WORKFLOWS
// Generated for Approval Orbit v1.1.0
// ============================================================================

// Asset Review Types
export type AssetType = 'prepaid_card' | 'check' | 'email_template' | 'other';
export type ReviewStatus = 'draft' | 'in_review' | 'approved' | 'rejected' | 'archived';

export interface AssetReview {
  id: string;
  organization_id: string;
  created_by: string;

  // Asset Information
  asset_type: AssetType;
  asset_name: string;
  asset_url: string;
  thumbnail_url?: string;

  // Version Control
  version_number: number;
  parent_review_id?: string;

  // Review Status
  status: ReviewStatus;

  // Metadata
  description?: string;
  metadata?: Record<string, any>;

  // Timestamps
  created_at: string;
  updated_at: string;
  review_started_at?: string;
  review_completed_at?: string;
}

// Annotation Types
export type AnnotationType =
  | 'comment'
  | 'arrow'
  | 'rectangle'
  | 'circle'
  | 'freehand'
  | 'highlight'
  | 'text_overlay';

export interface AnnotationPosition {
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotation?: number;
  points?: number[]; // For freehand drawings
}

export interface ReviewAnnotation {
  id: string;
  review_id: string;
  user_id: string;

  // Annotation Type
  annotation_type: AnnotationType;

  // Position & Size Data
  position_data: AnnotationPosition;

  // Content
  content?: string;

  // Styling
  color: string;
  stroke_width: number;
  opacity: number;

  // Status
  resolved: boolean;
  resolved_by?: string;
  resolved_at?: string;

  // Timestamps
  created_at: string;
  updated_at: string;
}

// Annotation Reply Types
export interface AnnotationReply {
  id: string;
  annotation_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

// Workflow Types
export interface WorkflowStage {
  order: number;
  name: string;
  role: 'user' | 'admin';
  required: boolean;
}

export interface ApprovalWorkflow {
  id: string;
  organization_id: string;
  created_by: string;

  // Workflow Definition
  name: string;
  description?: string;
  asset_type?: AssetType | 'all';

  // Stages Configuration
  stages: WorkflowStage[];

  // Status
  is_active: boolean;
  is_default: boolean;

  // Timestamps
  created_at: string;
  updated_at: string;
}

// Approval Request Types
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'skipped';

export interface ApprovalRequest {
  id: string;
  review_id: string;
  workflow_id: string;

  // Stage Information
  stage_order: number;
  stage_name: string;

  // Approver
  approver_user_id: string;

  // Status
  status: ApprovalStatus;

  // Decision Details
  decision_date?: string;
  comments?: string;
  signature_data?: string; // Base64 encoded signature

  // Conditional Approval
  conditions?: string;

  // Timestamps
  created_at: string;
  updated_at: string;
  notified_at?: string;
}

// Approval Certificate Types
export interface ApprovalChainItem {
  stage: number;
  approver: string;
  approver_id: string;
  date: string;
  signature?: string;
  comments?: string;
}

export interface AuditTrailItem {
  timestamp: string;
  user_id: string;
  user_name: string;
  action: string;
  details?: string;
}

export interface ApprovalCertificate {
  id: string;
  review_id: string;
  organization_id: string;

  // Certificate Details
  certificate_number: string;
  certificate_url: string;

  // Approval Summary
  total_approvers: number;
  approval_chain: ApprovalChainItem[];

  // Audit Trail
  audit_trail: AuditTrailItem[];

  // Timestamps
  generated_at: string;
  created_at: string;
}

// ============================================================================
// Extended Types with Relations (for queries with joins)
// ============================================================================

export interface AssetReviewWithCreator extends AssetReview {
  creator?: {
    id: string;
    full_name: string;
    email: string;
  };
}

export interface AssetReviewWithAnnotations extends AssetReview {
  annotations?: ReviewAnnotation[];
  annotation_count?: number;
}

export interface ReviewAnnotationWithUser extends ReviewAnnotation {
  user?: {
    id: string;
    full_name: string;
    email: string;
  };
  replies?: AnnotationReply[];
  reply_count?: number;
}

export interface ApprovalRequestWithApprover extends ApprovalRequest {
  approver?: {
    id: string;
    full_name: string;
    email: string;
  };
}

export interface AssetReviewWithApprovals extends AssetReview {
  approval_requests?: ApprovalRequestWithApprover[];
  current_stage?: number;
  pending_approvers?: string[];
}

// ============================================================================
// Form/Input Types (for creating/updating)
// ============================================================================

export interface CreateAssetReviewInput {
  asset_type: AssetType;
  asset_name: string;
  asset_url: string;
  thumbnail_url?: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface UpdateAssetReviewInput {
  asset_name?: string;
  description?: string;
  status?: ReviewStatus;
  metadata?: Record<string, any>;
}

export interface CreateAnnotationInput {
  review_id: string;
  annotation_type: AnnotationType;
  position_data: AnnotationPosition;
  content?: string;
  color?: string;
  stroke_width?: number;
  opacity?: number;
}

export interface UpdateAnnotationInput {
  position_data?: AnnotationPosition;
  content?: string;
  color?: string;
  stroke_width?: number;
  opacity?: number;
  resolved?: boolean;
}

export interface CreateWorkflowInput {
  name: string;
  description?: string;
  asset_type?: AssetType | 'all';
  stages: WorkflowStage[];
  is_default?: boolean;
}

export interface UpdateWorkflowInput {
  name?: string;
  description?: string;
  stages?: WorkflowStage[];
  is_active?: boolean;
  is_default?: boolean;
}

export interface SubmitApprovalInput {
  status: 'approved' | 'rejected';
  comments?: string;
  signature_data?: string;
  conditions?: string;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ReviewListResponse {
  reviews: AssetReviewWithCreator[];
  total: number;
  page: number;
  per_page: number;
}

export interface AnnotationListResponse {
  annotations: ReviewAnnotationWithUser[];
  total: number;
}

export interface ApprovalRequestListResponse {
  requests: ApprovalRequestWithApprover[];
  total: number;
}

// ============================================================================
// Filter/Query Types
// ============================================================================

export interface ReviewFilters {
  asset_type?: AssetType;
  status?: ReviewStatus;
  created_by?: string;
  search?: string;
  from_date?: string;
  to_date?: string;
}

export interface AnnotationFilters {
  annotation_type?: AnnotationType;
  resolved?: boolean;
  user_id?: string;
}

export interface ApprovalFilters {
  status?: ApprovalStatus;
  approver_user_id?: string;
  workflow_id?: string;
}
