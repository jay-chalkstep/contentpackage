'use client';

import { useState, useEffect } from 'react';
import { useOrganization, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { supabase, CardMockup } from '@/lib/supabase';
import {
  ArrowLeft,
  Download,
  Trash2,
  Users,
  Loader2,
  Calendar,
  User
} from 'lucide-react';
import Toast from '@/components/Toast';
import MockupCanvas from '@/components/collaboration/MockupCanvas';
import AnnotationToolbar from '@/components/collaboration/AnnotationToolbar';
import CommentsSidebar from '@/components/collaboration/CommentsSidebar';
import RequestFeedbackModal from '@/components/collaboration/RequestFeedbackModal';

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

export interface Reviewer {
  id: string;
  mockup_id: string;
  reviewer_id: string;
  reviewer_name: string;
  reviewer_email: string;
  reviewer_avatar?: string;
  reviewer_color?: string;
  status: 'pending' | 'viewed' | 'approved' | 'changes_requested';
  invited_by: string;
  invited_at: string;
  invitation_message?: string;
  viewed_at?: string;
  responded_at?: string;
  response_note?: string;
  organization_id: string;
}

export type AnnotationTool = 'select' | 'pin' | 'arrow' | 'circle' | 'rect' | 'freehand' | 'text';

export default function MockupDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { organization, isLoaded: orgLoaded } = useOrganization();
  const { user } = useUser();

  // Core data
  const [mockup, setMockup] = useState<CardMockup | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
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
  const [showRequestFeedbackModal, setShowRequestFeedbackModal] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Toast notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

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

  // Check if current user is a reviewer
  const isReviewer = reviewers.some(r => r.reviewer_id === user?.id);

  useEffect(() => {
    if (orgLoaded && organization?.id && user?.id) {
      fetchMockupData();
      fetchComments();
      fetchReviewers();
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

      // Check if user has access (creator or reviewer)
      if (data.created_by !== user?.id) {
        const { data: reviewerAccess } = await supabase
          .from('mockup_reviewers')
          .select('id')
          .eq('mockup_id', params.id)
          .eq('reviewer_id', user?.id)
          .single();

        if (!reviewerAccess) {
          showToast('You do not have access to this mockup', 'error');
          router.push('/mockup-library');
          return;
        }
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

  const fetchReviewers = async () => {
    try {
      const response = await fetch(`/api/mockups/${params.id}/reviewers`);
      if (!response.ok) throw new Error('Failed to fetch reviewers');
      const { reviewers } = await response.json();
      setReviewers(reviewers || []);
    } catch (error) {
      console.error('Error fetching reviewers:', error);
    }
  };

  // Comment creation handler - refetches to update UI
  const handleCommentCreate = async () => {
    // Refetch comments after creation to show new comment immediately
    await fetchComments();
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
                {isReviewer && !isCreator && (
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span>Invited to review</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {isCreator && (
              <button
                onClick={() => setShowRequestFeedbackModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                Request Feedback
              </button>
            )}

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
            isReviewer={isReviewer}
          />
        </div>

        {/* Right Panel - Comments & Reviewers */}
        <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
          <CommentsSidebar
            mockupId={params.id}
            comments={comments}
            reviewers={reviewers}
            currentUserId={user?.id || ''}
            isCreator={isCreator}
            onCommentUpdate={fetchComments}
            onReviewerUpdate={fetchReviewers}
            onCommentHover={setHoveredCommentId}
            hoveredCommentId={hoveredCommentId}
          />
        </div>
      </div>

      {/* Modals */}
      {showRequestFeedbackModal && (
        <RequestFeedbackModal
          mockupId={params.id}
          mockupName={mockup.mockup_name}
          onClose={() => setShowRequestFeedbackModal(false)}
          onSuccess={() => {
            fetchReviewers();
            showToast('Review requests sent successfully', 'success');
          }}
        />
      )}

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
