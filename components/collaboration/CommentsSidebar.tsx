'use client';

import { useState } from 'react';
import { Comment } from '@/app/(dashboard)/mockups/[id]/page';
import {
  MessageSquare,
  Trash2,
  Edit2,
  CheckCircle,
  RotateCcw
} from 'lucide-react';
import ResolveCommentModal from './ResolveCommentModal';

interface CommentsSidebarProps {
  mockupId: string;
  comments: Comment[];
  currentUserId: string;
  isCreator: boolean;
  onCommentUpdate: () => void;
  onCommentHover: (commentId: string | null) => void;
  hoveredCommentId: string | null;
}

export default function CommentsSidebar({
  mockupId,
  comments,
  currentUserId,
  isCreator,
  onCommentUpdate,
  onCommentHover,
  hoveredCommentId
}: CommentsSidebarProps) {
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [commentFilter, setCommentFilter] = useState<'all' | 'unresolved' | 'resolved'>('unresolved');
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolvingCommentId, setResolvingCommentId] = useState<string | null>(null);

  // Filter counts
  const unresolvedCount = comments.filter(c => !c.is_resolved).length;
  const resolvedCount = comments.filter(c => c.is_resolved).length;

  // Filtered comments based on selected filter
  const filteredComments = comments.filter(comment => {
    if (commentFilter === 'unresolved') return !comment.is_resolved;
    if (commentFilter === 'resolved') return comment.is_resolved;
    return true; // 'all'
  });

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

  const handleResolveClick = (commentId: string) => {
    setResolvingCommentId(commentId);
    setShowResolveModal(true);
  };

  const handleResolveComplete = async () => {
    setShowResolveModal(false);
    setResolvingCommentId(null);
    await onCommentUpdate();
  };

  const handleUnresolve = async (commentId: string) => {
    try {
      const response = await fetch(`/api/comments/${commentId}/unresolve`, {
        method: 'POST'
      });

      if (!response.ok) throw new Error('Failed to unresolve comment');
      onCommentUpdate();
    } catch (error) {
      console.error('Error unresolving comment:', error);
      alert('Failed to unresolve comment');
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-gray-700" />
          <h2 className="text-sm font-semibold text-gray-900">Comments ({comments.length})</h2>
        </div>
      </div>

      {/* Comment Filters */}
      <div className="flex gap-2 px-4 py-3 border-b border-gray-200 bg-gray-50">
          <button
            onClick={() => setCommentFilter('unresolved')}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
              commentFilter === 'unresolved'
                ? 'bg-orange-100 text-orange-700 ring-1 ring-orange-300'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            Unresolved ({unresolvedCount})
          </button>
          <button
            onClick={() => setCommentFilter('resolved')}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
              commentFilter === 'resolved'
                ? 'bg-green-100 text-green-700 ring-1 ring-green-300'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            Resolved ({resolvedCount})
          </button>
          <button
            onClick={() => setCommentFilter('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
              commentFilter === 'all'
                ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-300'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            All ({comments.length})
          </button>
        </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
            {filteredComments.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">
                  {comments.length === 0
                    ? 'No comments yet'
                    : `No ${commentFilter} comments`}
                </p>
                <p className="text-gray-400 text-xs mt-1">
                  {comments.length === 0
                    ? 'Use the annotation tools to add comments'
                    : `Try a different filter to see ${commentFilter === 'resolved' ? 'unresolved' : 'resolved'} comments`}
                </p>
              </div>
            ) : (
              filteredComments.map((comment, index) => (
                <div
                  key={comment.id}
                  className={`relative rounded-lg p-3 transition-all cursor-pointer ${
                    comment.is_resolved ? 'opacity-70' : ''
                  } ${
                    hoveredCommentId === comment.id
                      ? 'bg-blue-50 ring-2 ring-blue-400 shadow-md'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                  onMouseEnter={() => onCommentHover(comment.id)}
                  onMouseLeave={() => onCommentHover(null)}
                >
                  {/* Comment Number Badge */}
                  <div
                    className="absolute -left-2 -top-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-md"
                    style={{ backgroundColor: comment.annotation_color || '#FF6B6B' }}
                  >
                    {index + 1}
                  </div>

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
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-gray-900">
                            {comment.user_name}
                            {comment.user_id === currentUserId && (
                              <span className="text-gray-500 font-normal ml-1">(You)</span>
                            )}
                          </p>
                          {comment.is_resolved && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                              <CheckCircle className="h-3 w-3" />
                              Resolved
                            </span>
                          )}
                        </div>
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

                      {/* Resolution Details */}
                      {comment.is_resolved && comment.resolved_by && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="bg-green-50 rounded-lg p-2">
                            <p className="text-xs text-green-800 font-medium mb-1">
                              Resolved by {comment.resolved_by_name}
                              {comment.resolved_at && (
                                <span className="text-green-600 font-normal">
                                  {' '}• {new Date(comment.resolved_at).toLocaleDateString()}
                                </span>
                              )}
                            </p>
                            {comment.resolution_note && (
                              <p className="text-xs text-green-700 italic">
                                "{comment.resolution_note}"
                              </p>
                            )}
                          </div>
                          {(isCreator || comment.resolved_by === currentUserId) && (
                            <button
                              onClick={() => handleUnresolve(comment.id)}
                              className="text-xs text-gray-600 hover:text-blue-600 flex items-center gap-1 mt-2"
                            >
                              <RotateCcw className="h-3 w-3" />
                              Reopen this comment
                            </button>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {/* Edit/Delete (owner only) */}
                        {comment.user_id === currentUserId && !comment.is_resolved && (
                          <>
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
                          </>
                        )}

                        {/* Resolve button (creator or reviewers, only for unresolved) */}
                        {!comment.is_resolved && isCreator && (
                          <button
                            onClick={() => handleResolveClick(comment.id)}
                            className="text-xs text-green-600 hover:text-green-700 flex items-center gap-1 font-medium"
                          >
                            <CheckCircle className="h-3 w-3" />
                            Resolve
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
        </div>
      </div>

      {/* Resolve Comment Modal */}
      {showResolveModal && resolvingCommentId && (
        <ResolveCommentModal
          commentId={resolvingCommentId}
          onClose={() => {
            setShowResolveModal(false);
            setResolvingCommentId(null);
          }}
          onResolve={handleResolveComplete}
        />
      )}
    </div>
  );
}
