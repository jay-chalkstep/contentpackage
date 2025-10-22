'use client';

import { useState } from 'react';
import { Comment, Reviewer } from '@/app/(dashboard)/mockups/[id]/page';
import {
  MessageSquare,
  Users,
  Check,
  X,
  Trash2,
  Edit2,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface CommentsSidebarProps {
  mockupId: string;
  comments: Comment[];
  reviewers: Reviewer[];
  currentUserId: string;
  isCreator: boolean;
  onCommentUpdate: () => void;
  onReviewerUpdate: () => void;
}

export default function CommentsSidebar({
  mockupId,
  comments,
  reviewers,
  currentUserId,
  isCreator,
  onCommentUpdate,
  onReviewerUpdate
}: CommentsSidebarProps) {
  const [activeTab, setActiveTab] = useState<'comments' | 'reviewers'>('comments');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'approved' | 'changes_requested' | null>(null);
  const [approvalNote, setApprovalNote] = useState('');

  const currentUserReviewer = reviewers.find(r => r.reviewer_id === currentUserId);

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Delete this comment?')) return;

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete comment');
      onCommentUpdate();
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Failed to delete comment');
    }
  };

  const handleEditComment = async (commentId: string) => {
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment_text: editText })
      });

      if (!response.ok) throw new Error('Failed to update comment');

      setEditingCommentId(null);
      setEditText('');
      onCommentUpdate();
    } catch (error) {
      console.error('Error updating comment:', error);
      alert('Failed to update comment');
    }
  };

  const handleApprovalSubmit = async () => {
    if (!approvalAction || !currentUserReviewer) return;

    try {
      const response = await fetch(`/api/mockups/${mockupId}/reviewers/${currentUserReviewer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: approvalAction,
          response_note: approvalNote
        })
      });

      if (!response.ok) throw new Error('Failed to update review status');

      setShowApprovalModal(false);
      setApprovalAction(null);
      setApprovalNote('');
      onReviewerUpdate();
    } catch (error) {
      console.error('Error updating review status:', error);
      alert('Failed to update review status');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
            <CheckCircle className="h-3 w-3" />
            Approved
          </span>
        );
      case 'changes_requested':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
            <AlertCircle className="h-3 w-3" />
            Changes Requested
          </span>
        );
      case 'viewed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
            <Clock className="h-3 w-3" />
            Viewed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
            <Clock className="h-3 w-3" />
            Pending
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('comments')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'comments'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Comments ({comments.length})
          </div>
        </button>
        <button
          onClick={() => setActiveTab('reviewers')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'reviewers'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Users className="h-4 w-4" />
            Reviewers ({reviewers.length})
          </div>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'comments' ? (
          <div className="p-4 space-y-4">
            {comments.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No comments yet</p>
                <p className="text-gray-400 text-xs mt-1">
                  Use the annotation tools to add comments
                </p>
              </div>
            ) : (
              comments.map((comment) => (
                <div
                  key={comment.id}
                  className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors"
                >
                  {/* User Info */}
                  <div className="flex items-start gap-3 mb-2">
                    {comment.user_avatar ? (
                      <img
                        src={comment.user_avatar}
                        alt={comment.user_name}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                        {comment.user_name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">
                          {comment.user_name}
                          {comment.user_id === currentUserId && (
                            <span className="text-gray-500 font-normal ml-1">(You)</span>
                          )}
                        </p>
                        {comment.annotation_type && (
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: comment.annotation_color }}
                            title={comment.annotation_type}
                          />
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        {new Date(comment.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Comment Text */}
                  {editingCommentId === comment.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full border border-gray-300 rounded p-2 text-sm resize-none"
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditComment(comment.id)}
                          className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingCommentId(null);
                            setEditText('');
                          }}
                          className="px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {comment.comment_text}
                      </p>

                      {/* Actions */}
                      {comment.user_id === currentUserId && (
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => {
                              setEditingCommentId(comment.id);
                              setEditText(comment.comment_text);
                            }}
                            className="text-xs text-gray-600 hover:text-blue-600 flex items-center gap-1"
                          >
                            <Edit2 className="h-3 w-3" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-xs text-gray-600 hover:text-red-600 flex items-center gap-1"
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {reviewers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No reviewers yet</p>
                {isCreator && (
                  <p className="text-gray-400 text-xs mt-1">
                    Click "Request Feedback" to invite reviewers
                  </p>
                )}
              </div>
            ) : (
              <>
                {reviewers.map((reviewer) => (
                  <div
                    key={reviewer.id}
                    className="bg-gray-50 rounded-lg p-3"
                  >
                    <div className="flex items-start gap-3">
                      {reviewer.reviewer_avatar ? (
                        <img
                          src={reviewer.reviewer_avatar}
                          alt={reviewer.reviewer_name}
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white text-sm font-medium">
                          {reviewer.reviewer_name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {reviewer.reviewer_name}
                          {reviewer.reviewer_id === currentUserId && (
                            <span className="text-gray-500 font-normal ml-1">(You)</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500 mb-2">
                          Invited {new Date(reviewer.invited_at).toLocaleDateString()}
                        </p>
                        {getStatusBadge(reviewer.status)}

                        {reviewer.response_note && (
                          <p className="text-sm text-gray-700 mt-2 italic">
                            "{reviewer.response_note}"
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Review Actions (if current user is a reviewer) */}
                {currentUserReviewer && currentUserReviewer.status === 'pending' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-blue-900 mb-3">
                      Your Review
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setApprovalAction('approved');
                          setShowApprovalModal(true);
                        }}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <Check className="h-4 w-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          setApprovalAction('changes_requested');
                          setShowApprovalModal(true);
                        }}
                        className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <X className="h-4 w-4" />
                        Request Changes
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Approval Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 shadow-xl">
            <h3 className="text-lg font-semibold mb-4">
              {approvalAction === 'approved' ? 'Approve Mockup' : 'Request Changes'}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {approvalAction === 'approved'
                ? 'Add an optional note with your approval:'
                : 'What changes would you like to see?'}
            </p>
            <textarea
              value={approvalNote}
              onChange={(e) => setApprovalNote(e.target.value)}
              placeholder={
                approvalAction === 'approved'
                  ? 'Looks great! (optional)'
                  : 'Describe the changes needed...'
              }
              className="w-full border border-gray-300 rounded-lg p-3 h-24 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setShowApprovalModal(false);
                  setApprovalAction(null);
                  setApprovalNote('');
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApprovalSubmit}
                disabled={approvalAction === 'changes_requested' && !approvalNote.trim()}
                className={`px-4 py-2 text-white rounded-lg transition-colors ${
                  approvalAction === 'approved'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-orange-600 hover:bg-orange-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {approvalAction === 'approved' ? 'Approve' : 'Request Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
