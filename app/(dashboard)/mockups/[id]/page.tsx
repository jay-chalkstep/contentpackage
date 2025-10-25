'use client';

import { useState, useEffect } from 'react';
import { useOrganization, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { supabase, CardMockup } from '@/lib/supabase';
import {
  ArrowLeft,
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
import type { MockupStageProgressWithDetails, Project, Workflow } from '@/lib/supabase';
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
  const [rightPanelTab, setRightPanelTab] = useState<'comments' | 'ai'>('comments');

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
    if (orgLoaded && organization?.id && user?.id) {
      fetchMockupData();
      fetchComments();
      fetchStageProgress();
      fetchAIMetadata();
      // Note: Realtime subscriptions removed due to RLS blocking with Clerk Auth
      // Using polling fallback instead
    }
  }, [params.id, orgLoaded, organization?.id, user?.id]);

  const fetchMockupData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('card_mockups')
        .select(`
          *,
          logo:logo_variants(*),
          template:card_templates(*)
        `)
        .eq('id', params.id)
        .eq('organization_id', organization?.id)
        .single();

      if (error) throw error;

      if (!data) {
        showToast('Mockup not found', 'error');
        router.push('/mockup-library');
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

  // Comment creation handler - refetches to update UI
  const handleCommentCreate = async () => {
    // Refetch comments after creation to show new comment immediately
    await fetchComments();
  };

  // AI metadata handlers
  const fetchAIMetadata = async () => {
    try {
      const { data, error } = await supabase
        .from('card_mockups')
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
      router.push('/mockup-library');
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

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/mockup-library')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{mockup.mockup_name}</h1>
              <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(mockup.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {/* Analyze with AI Button */}
            <button
              onClick={handleAnalyzeWithAI}
              disabled={analyzing}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
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
                  <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[200px]">
                    <button
                      onClick={() => handleExport(false)}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 rounded-t-lg"
                    >
                      Download Clean
                    </button>
                    <button
                      onClick={() => handleExport(true)}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 rounded-b-lg border-t border-gray-100"
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
                className="px-4 py-2 bg-white border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Stage Action Banner - show if mockup is in a workflow */}
      {currentStageProgress && workflow && project && (
        <div className="bg-blue-50 border-b border-blue-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-blue-900">
                Current Stage: {currentStageProgress.stage_name || `Stage ${currentStageProgress.stage_order}`}
              </h3>
              <p className="text-sm text-blue-700 mt-1">
                Status: {currentStageProgress.status === 'in_review' ? 'Awaiting Review' : currentStageProgress.status}
                {currentStageProgress.reviewed_by_name && ` • Reviewed by ${currentStageProgress.reviewed_by_name}`}
              </p>
              {project && (
                <p className="text-xs text-blue-600 mt-1">
                  Project: {project.name}
                </p>
              )}
            </div>

            {/* Show action buttons if user is reviewer for current stage AND stage is in_review */}
            {isStageReviewer && currentStageProgress.status === 'in_review' && (
              <div className="flex gap-2">
                <button
                  onClick={() => setShowStageActionModal(true)}
                  className="px-4 py-2 bg-white border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors font-medium"
                >
                  Approve or Request Changes
                </button>
              </div>
            )}

            {/* Show approved badge if current stage approved */}
            {currentStageProgress.status === 'approved' && currentStageProgress.reviewed_by_name && (
              <div className="bg-green-500 text-white px-4 py-2 rounded-lg font-medium">
                ✓ Approved by {currentStageProgress.reviewed_by_name}
              </div>
            )}

            {/* Show changes requested badge */}
            {currentStageProgress.status === 'changes_requested' && (
              <div className="bg-red-500 text-white px-4 py-2 rounded-lg font-medium">
                ✕ Changes Requested
              </div>
            )}
          </div>

          {/* Show notes if present */}
          {currentStageProgress.notes && (
            <div className="mt-3 bg-white border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-gray-700">
                <strong>Notes:</strong> {currentStageProgress.notes}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Main Content - Three Panel Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Annotation Toolbar */}
        <div className="w-20 bg-white border-r border-gray-200">
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

        {/* Center Panel - Mockup Canvas */}
        <div className="flex-1 bg-gray-100 overflow-auto">
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

        {/* Right Panel - Comments & AI Insights */}
        <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
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
      </div>

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
    </div>
  );
}
