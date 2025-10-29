'use client';

import { useState, useEffect } from 'react';
import { useOrganization, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { supabase, CardMockup } from '@/lib/supabase';
import {
  Download,
  Trash2,
  Loader2,
  Calendar,
  Sparkles,
  MessageSquare,
  Eye
} from 'lucide-react';
import Toast from '@/components/Toast';
import MockupCanvas from '@/components/collaboration/MockupCanvas';
import AnnotationToolbar from '@/components/collaboration/AnnotationToolbar';
import CommentsSidebar from '@/components/collaboration/CommentsSidebar';
import StageActionModal from '@/components/projects/StageActionModal';
import TagDisplay from '@/components/ai/TagDisplay';
import AccessibilityScore from '@/components/ai/AccessibilityScore';
import SimilarMockupsModal from '@/components/ai/SimilarMockupsModal';
import AIOnboardingTour from '@/components/ai/AIOnboardingTour';
import GmailLayout from '@/components/layout/GmailLayout';
import PreviewArea from '@/components/preview/PreviewArea';
import { usePanelContext } from '@/lib/contexts/PanelContext';
import ApprovalStatusBanner from '@/components/approvals/ApprovalStatusBanner';
import ApprovalTimelinePanel from '@/components/approvals/ApprovalTimelinePanel';
import FinalApprovalBanner from '@/components/approvals/FinalApprovalBanner';
import type { MockupStageProgressWithDetails, Project, Workflow, AssetApprovalSummary, ApprovalProgress } from '@/lib/supabase';
import type { AIMetadata } from '@/types/ai';

interface ToastMessage {
  message: string;
  type: 'success' | 'error';
  id: number;
}

export interface Comment {
  id: string;
  mockup_id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  user_avatar?: string;
  comment_text: string;
  annotation_data?: any; // Konva shape JSON
  position_x?: number;
  position_y?: number;
  annotation_type?: string;
  annotation_color?: string;
  is_resolved: boolean;
  parent_comment_id?: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
  // Audit trail fields
  resolved_by?: string;
  resolved_by_name?: string;
  resolved_at?: string;
  resolution_note?: string;
  deleted_at?: string;
  deleted_by?: string;
  deleted_by_name?: string;
  edit_history?: Array<{
    edited_at: string;
    edited_by: string;
    edited_by_name: string;
    old_text: string;
    new_text: string;
  }>;
  original_comment_text?: string;
}

export type AnnotationTool = 'select' | 'pin' | 'arrow' | 'circle' | 'rect' | 'freehand' | 'text';

export default function MockupDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { organization, isLoaded: orgLoaded } = useOrganization();
  const { user } = useUser();
  const { setActiveNav } = usePanelContext();

  // Core data
  const [mockup, setMockup] = useState<CardMockup | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  // Annotation tool state
  const [activeTool, setActiveTool] = useState<AnnotationTool>('select');
  const [strokeColor, setStrokeColor] = useState('#22C55E'); // Green default
  const [strokeWidth, setStrokeWidth] = useState(8); // 8px default

  // Zoom state
  const [scale, setScale] = useState(1.0);

  // Hover state for linking annotations to comments
  const [hoveredCommentId, setHoveredCommentId] = useState<string | null>(null);

  // Modal state
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showStageActionModal, setShowStageActionModal] = useState(false);

  // Stage progress state
  const [stageProgress, setStageProgress] = useState<MockupStageProgressWithDetails[]>([]);
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [project, setProject] = useState<Project | null>(null);

  // Toast notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // AI features state
  const [aiMetadata, setAiMetadata] = useState<AIMetadata | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [showSimilarModal, setShowSimilarModal] = useState(false);
  const [rightPanelTab, setRightPanelTab] = useState<'comments' | 'ai' | 'approvals'>('comments');

  // Approval state
  const [approvalSummary, setApprovalSummary] = useState<AssetApprovalSummary | null>(null);
  const [isCurrentUserReviewer, setIsCurrentUserReviewer] = useState(false);
  const [hasCurrentUserApproved, setHasCurrentUserApproved] = useState(false);
  const [isProcessingApproval, setIsProcessingApproval] = useState(false);

  const showToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now();
    setToasts(prev => [...prev, { message, type, id }]);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Zoom handlers
  const MIN_SCALE = 0.25;
  const MAX_SCALE = 4.0;
  const SCALE_STEP = 0.25;

  const handleZoomIn = () => {
    setScale(prevScale => Math.min(prevScale + SCALE_STEP, MAX_SCALE));
  };

  const handleZoomOut = () => {
    setScale(prevScale => Math.max(prevScale - SCALE_STEP, MIN_SCALE));
  };

  const handleZoomReset = () => {
    setScale(1.0);
  };

  // Check if current user is the creator
  const isCreator = mockup?.created_by === user?.id;

  // Stage workflow computed values
  const currentStageProgress = stageProgress.find(p => p.status === 'in_review');
  const isStageReviewer = currentStageProgress && project
    ? // Check if user is assigned as reviewer for current stage
      false // TODO: fetch stage reviewers and check
    : false;

  useEffect(() => {
    setActiveNav('mockups');
  }, [setActiveNav]);

  useEffect(() => {
    if (orgLoaded && organization?.id && user?.id) {
      fetchMockupData();
      fetchComments();
      fetchStageProgress();
      fetchAIMetadata();
      fetchApprovals();
      // Note: Realtime subscriptions removed due to RLS blocking with Clerk Auth
      // Using polling fallback instead
    }
  }, [params.id, orgLoaded, organization?.id, user?.id]);

  const fetchMockupData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('assets')
        .select(`
          *,
          logo:logo_variants(*),
          template:templates(*)
        `)
        .eq('id', params.id)
        .eq('organization_id', organization?.id)
        .single();

      if (error) throw error;

      if (!data) {
        showToast('Mockup not found', 'error');
        router.push('/gallery');
        return;
      }

      setMockup(data);
    } catch (error) {
      console.error('Error fetching mockup:', error);
      showToast('Failed to load mockup', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/mockups/${params.id}/comments`);
      if (!response.ok) throw new Error('Failed to fetch comments');
      const { comments } = await response.json();
      setComments(comments || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const fetchStageProgress = async () => {
    try {
      const response = await fetch(`/api/mockups/${params.id}/stage-progress`);
      if (!response.ok) throw new Error('Failed to fetch stage progress');
      const { progress, workflow: workflowData } = await response.json();
      setStageProgress(progress || []);
      setWorkflow(workflowData || null);

      // If mockup has project_id, fetch project data
      if (mockup?.project_id) {
        const projectResponse = await fetch(`/api/projects/${mockup.project_id}`);
        if (projectResponse.ok) {
          const { project: projectData } = await projectResponse.json();
          setProject(projectData);
        }
      }
    } catch (error) {
      console.error('Error fetching stage progress:', error);
    }
  };

  const fetchApprovals = async () => {
    try {
      const response = await fetch(`/api/mockups/${params.id}/approvals`);
      if (!response.ok) throw new Error('Failed to fetch approvals');
      const data: AssetApprovalSummary = await response.json();
      setApprovalSummary(data);

      // Check if current user is reviewer for current stage
      if (currentStageProgress && user?.id) {
        const currentStageApprovals = data.approvals_by_stage[currentStageProgress.stage_order] || [];
        const userApproval = currentStageApprovals.find(a => a.user_id === user.id);
        setHasCurrentUserApproved(!!userApproval && userApproval.action === 'approve');

        // Check if user is assigned reviewer by checking if they have any progress entry
        const progressForStage = data.progress_summary[currentStageProgress.stage_order];
        setIsCurrentUserReviewer(progressForStage?.approvals_required > 0);
      }
    } catch (error) {
      console.error('Error fetching approvals:', error);
    }
  };

  // Comment creation handler - refetches to update UI
  const handleCommentCreate = async () => {
    // Refetch comments after creation to show new comment immediately
    await fetchComments();
  };

  const handleApprove = async () => {
    if (!currentStageProgress) return;

    setIsProcessingApproval(true);
    try {
      const response = await fetch(`/api/mockups/${params.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: '' })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to approve');
      }

      const { message } = await response.json();
      showToast(message, 'success');

      // Refetch all data
      await Promise.all([
        fetchStageProgress(),
        fetchApprovals()
      ]);
    } catch (error) {
      console.error('Error approving:', error);
      showToast(error instanceof Error ? error.message : 'Failed to approve', 'error');
    } finally {
      setIsProcessingApproval(false);
    }
  };

  const handleRequestChanges = () => {
    // Open the existing StageActionModal for request changes
    setShowStageActionModal(true);
  };

  const handleFinalApprove = async (notes?: string) => {
    setIsProcessingApproval(true);
    try {
      const response = await fetch(`/api/mockups/${params.id}/final-approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: notes || '' })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to give final approval');
      }

      showToast('Final approval recorded successfully!', 'success');

      // Refetch all data
      await Promise.all([
        fetchMockupData(),
        fetchStageProgress(),
        fetchApprovals()
      ]);
    } catch (error) {
      console.error('Error giving final approval:', error);
      showToast(error instanceof Error ? error.message : 'Failed to give final approval', 'error');
    } finally {
      setIsProcessingApproval(false);
    }
  };

  // AI metadata handlers
  const fetchAIMetadata = async () => {
    try {
      const { data, error } = await supabase
        .from('assets')
        .select('ai_metadata')
        .eq('id', params.id)
        .single();

      if (error) throw error;

      if (data?.ai_metadata) {
        setAiMetadata(data.ai_metadata as AIMetadata);
      }
    } catch (error) {
      console.error('Error fetching AI metadata:', error);
    }
  };

  const handleAnalyzeWithAI = async () => {
    setAnalyzing(true);
    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mockupId: params.id }),
      });

      if (!response.ok) throw new Error('Failed to analyze mockup');

      const data = await response.json();
      setAiMetadata(data.aiMetadata);
      setRightPanelTab('ai'); // Switch to AI tab to show results
      showToast('AI analysis complete!', 'success');
    } catch (error) {
      console.error('Error analyzing mockup:', error);
      showToast('Failed to analyze mockup with AI', 'error');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDeleteMockup = async () => {
    if (!confirm('Are you sure you want to delete this mockup? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/mockups/${params.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete mockup');

      showToast('Mockup deleted successfully', 'success');
      router.push('/gallery');
    } catch (error) {
      console.error('Error deleting mockup:', error);
      showToast('Failed to delete mockup', 'error');
    }
  };

  const handleExport = async (includeAnnotations: boolean) => {
    // This will be triggered from MockupCanvas component
    // The canvas component will handle the actual export
    const event = new CustomEvent('export-mockup', {
      detail: { includeAnnotations }
    });
    window.dispatchEvent(event);
    setShowExportMenu(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
      </div>
    );
  }

  if (!mockup) {
    return null;
  }

  // Context Panel - Annotation Tools
  const contextPanelContent = (
    <div className="h-full flex flex-col">
      {/* Top Section - Info */}
      <div className="p-4 space-y-4">
        {/* Mockup Info */}
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            {mockup.mockup_name}
          </h2>
          <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
            <Calendar className="h-3 w-3" />
            {new Date(mockup.created_at).toLocaleDateString()}
          </div>
        </div>

        {/* Approval Status - Show FinalApprovalBanner if pending final approval */}
        {currentStageProgress?.status === 'pending_final_approval' && workflow && project && mockup && (
          <FinalApprovalBanner
            mockupName={mockup.mockup_name}
            projectName={project.name}
            totalStages={workflow.stages?.length || 0}
            onFinalApprove={handleFinalApprove}
            isProcessing={isProcessingApproval}
          />
        )}

        {/* Approval Status Banner - Show if in review and has approval data */}
        {currentStageProgress?.status === 'in_review' && approvalSummary && workflow && (
          <ApprovalStatusBanner
            stageProgress={approvalSummary.progress_summary[currentStageProgress.stage_order] || {
              stage_order: currentStageProgress.stage_order,
              stage_name: currentStageProgress.stage_name,
              stage_color: currentStageProgress.stage_color,
              approvals_required: currentStageProgress.approvals_required || 0,
              approvals_received: currentStageProgress.approvals_received || 0,
              is_complete: false,
              user_approvals: []
            }}
            currentUserId={user?.id || ''}
            isCurrentUserReviewer={isCurrentUserReviewer}
            hasCurrentUserApproved={hasCurrentUserApproved}
            onApprove={handleApprove}
            onRequestChanges={handleRequestChanges}
            isProcessing={isProcessingApproval}
          />
        )}

        {/* Fallback Stage Info (for other statuses) */}
        {currentStageProgress && workflow && project &&
         currentStageProgress.status !== 'in_review' &&
         currentStageProgress.status !== 'pending_final_approval' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
            <div className="text-xs font-semibold text-blue-900">
              Stage: {currentStageProgress.stage_name || `Stage ${currentStageProgress.stage_order}`}
            </div>
            <div className="text-xs text-blue-700">
              Status: {currentStageProgress.status}
            </div>
            <div className="text-xs text-blue-600">
              Project: {project.name}
            </div>
            {currentStageProgress.notes && (
              <div className="text-xs text-blue-800 pt-2 border-t border-blue-200">
                <strong>Notes:</strong> {currentStageProgress.notes}
              </div>
            )}
          </div>
        )}

        {/* Annotation Toolbar */}
        <div className="pt-4 border-t border-[var(--border-main)]">
          <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
            Annotation Tools
          </h3>
          <AnnotationToolbar
            activeTool={activeTool}
            onToolChange={setActiveTool}
            strokeColor={strokeColor}
            onColorChange={setStrokeColor}
            strokeWidth={strokeWidth}
            onStrokeWidthChange={setStrokeWidth}
            scale={scale}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onZoomReset={handleZoomReset}
          />
        </div>
      </div>

      {/* Bottom Section - Action Buttons */}
      <div className="mt-auto p-4 space-y-2 border-t border-[var(--border-main)] bg-[var(--bg-secondary)]">
        <button
          onClick={handleAnalyzeWithAI}
          disabled={analyzing}
          className="w-full px-3 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50"
          data-tour="analyze-button"
        >
          {analyzing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Analyze with AI
            </>
          )}
        </button>

        {/* Export Menu */}
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="w-full px-3 py-2 bg-white border border-[var(--border-main)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-hover)] transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <Download className="h-4 w-4" />
            Export
          </button>

          {showExportMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowExportMenu(false)}
              />
              <div className="absolute left-0 right-0 bottom-full mb-2 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                <button
                  onClick={() => handleExport(false)}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 rounded-t-lg"
                >
                  Download Clean
                </button>
                <button
                  onClick={() => handleExport(true)}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 rounded-b-lg border-t border-gray-100"
                >
                  Download with Annotations
                </button>
              </div>
            </>
          )}
        </div>

        {isCreator && (
          <button
            onClick={handleDeleteMockup}
            className="w-full px-3 py-2 bg-white border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        )}
      </div>
    </div>
  );

  // Center Panel - Mockup Canvas
  const canvasContent = (
    <div className="h-full bg-gray-100 overflow-auto">
      <MockupCanvas
        mockup={mockup}
        comments={comments}
        activeTool={activeTool}
        strokeColor={strokeColor}
        strokeWidth={strokeWidth}
        scale={scale}
        onScaleChange={setScale}
        onCommentCreate={handleCommentCreate}
        onCommentHover={setHoveredCommentId}
        hoveredCommentId={hoveredCommentId}
        isCreator={isCreator}
      />
    </div>
  );

  // Preview Panel - Comments & AI Insights
  const previewContent = (
    <div className="h-full flex flex-col">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-gray-50">
        <button
          onClick={() => setRightPanelTab('comments')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            rightPanelTab === 'comments'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <MessageSquare className="h-4 w-4 inline mr-2" />
          Comments
          {comments.length > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded-full">
              {comments.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setRightPanelTab('approvals')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            rightPanelTab === 'approvals'
              ? 'text-green-600 border-b-2 border-green-600 bg-white'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Check className="h-4 w-4 inline mr-2" />
          Approvals
          {approvalSummary && Object.keys(approvalSummary.approvals_by_stage).length > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-green-200 text-green-700 text-xs rounded-full">
              {Object.values(approvalSummary.approvals_by_stage).flat().length}
            </span>
          )}
        </button>
        <button
          onClick={() => setRightPanelTab('ai')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            rightPanelTab === 'ai'
              ? 'text-purple-600 border-b-2 border-purple-600 bg-white'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          data-tour="ai-tags"
        >
          <Sparkles className="h-4 w-4 inline mr-2" />
          AI Insights
          {aiMetadata && (
            <span className="ml-2 px-2 py-0.5 bg-purple-200 text-purple-700 text-xs rounded-full">
              New
            </span>
          )}
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {rightPanelTab === 'comments' ? (
          <CommentsSidebar
            mockupId={params.id}
            comments={comments}
            currentUserId={user?.id || ''}
            isCreator={isCreator}
            onCommentUpdate={fetchComments}
            onCommentHover={setHoveredCommentId}
            hoveredCommentId={hoveredCommentId}
          />
        ) : rightPanelTab === 'approvals' ? (
          approvalSummary && workflow?.stages ? (
            <ApprovalTimelinePanel
              approvalSummary={approvalSummary}
              stages={workflow.stages}
            />
          ) : (
            <div className="p-8 text-center text-gray-500">
              <div className="text-sm">No approvals data</div>
              <div className="text-xs mt-1">This asset is not in an approval workflow</div>
            </div>
          )
        ) : (
          <div className="p-4 space-y-4">
            {/* AI Tags */}
            <div data-tour="ai-tags">
              <TagDisplay
                aiMetadata={aiMetadata}
                onAnalyze={handleAnalyzeWithAI}
              />
            </div>

            {/* Accessibility Score */}
            {aiMetadata?.accessibilityScore && (
              <div data-tour="accessibility-score">
                <AccessibilityScore
                  score={aiMetadata.accessibilityScore}
                  compact={false}
                />
              </div>
            )}

            {/* Similar Mockups Button */}
            <button
              onClick={() => setShowSimilarModal(true)}
              className="w-full px-4 py-3 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors flex items-center justify-center gap-2"
              data-tour="similar-mockups"
            >
              <Eye className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-900">
                Find Similar Mockups
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <GmailLayout
        contextPanel={contextPanelContent}
        listView={canvasContent}
        previewArea={<PreviewArea>{previewContent}</PreviewArea>}
        listViewWidth="flex"
        previewWidth="fixed"
      />

      {/* Modals */}
      {/* Stage Action Modal */}
      {showStageActionModal && currentStageProgress && workflow && project && mockup && (
        <StageActionModal
          mockup={mockup}
          project={project}
          stageOrder={currentStageProgress.stage_order}
          stageName={currentStageProgress.stage_name || `Stage ${currentStageProgress.stage_order}`}
          stageColor={currentStageProgress.stage_color || 'blue'}
          onClose={() => setShowStageActionModal(false)}
          onActionComplete={() => {
            fetchStageProgress();
            setShowStageActionModal(false);
            showToast('Stage action completed successfully', 'success');
          }}
        />
      )}

      {/* Similar Mockups Modal */}
      {showSimilarModal && mockup && (
        <SimilarMockupsModal
          mockupId={params.id}
          mockupName={mockup.mockup_name}
          isOpen={showSimilarModal}
          onClose={() => setShowSimilarModal(false)}
        />
      )}

      {/* AI Onboarding Tour */}
      <AIOnboardingTour
        onComplete={() => {
          showToast('AI tour complete! Start exploring.', 'success');
        }}
      />

      {/* Toast Notifications */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </>
  );
}
