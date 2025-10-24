'use client';

import { useState } from 'react';
import { CheckCircle, X } from 'lucide-react';

interface ResolveCommentModalProps {
  commentId: string;
  onClose: () => void;
  onResolve: () => void;
}

export default function ResolveCommentModal({
  commentId,
  onClose,
  onResolve
}: ResolveCommentModalProps) {
  const [resolutionNote, setResolutionNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const response = await fetch(`/api/comments/${commentId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolution_note: resolutionNote })
      });

      if (!response.ok) throw new Error('Failed to resolve comment');

      onResolve();
      onClose();
    } catch (error) {
      console.error('Error resolving comment:', error);
      alert('Failed to resolve comment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Resolve Comment</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Resolution Note (optional)
          </label>
          <textarea
            value={resolutionNote}
            onChange={(e) => setResolutionNote(e.target.value)}
            placeholder="Explain what was done to address this feedback..."
            className="w-full border border-gray-300 rounded-lg p-3 h-32 resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
            disabled={submitting}
          />
          <p className="text-xs text-gray-500 mt-1">
            Optional: Add a note about how this feedback was addressed
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Resolving...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                Resolve
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
