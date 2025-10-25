'use client';

import { useState } from 'react';
import { X, CheckCircle, XCircle } from 'lucide-react';
import type { CardMockup, Project } from '@/lib/supabase';

interface StageActionModalProps {
  mockup: CardMockup;
  project: Project;
  stageOrder: number;
  stageName: string;
  stageColor: string;
  onClose: () => void;
  onActionComplete: () => void;
}

export default function StageActionModal({
  mockup,
  project,
  stageOrder,
  stageName,
  stageColor,
  onClose,
  onActionComplete
}: StageActionModalProps) {
  const [activeTab, setActiveTab] = useState<'approve' | 'request_changes'>('approve');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (activeTab === 'request_changes' && !notes.trim()) {
      setError('Please provide feedback about what changes are needed');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        `/api/mockups/${mockup.id}/stage-progress/${stageOrder}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: activeTab,
            notes: notes.trim() || undefined
          })
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to process action');
      }

      onActionComplete();
      onClose();
    } catch (err) {
      console.error('Error processing stage action:', err);
      setError(err instanceof Error ? err.message : 'Failed to process action');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Stage {stageOrder}: {stageName}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {mockup.mockup_name} - {project.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('approve')}
              className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'approve'
                  ? 'text-green-600 border-b-2 border-green-600 bg-green-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
              disabled={loading}
            >
              <CheckCircle className="h-4 w-4 inline-block mr-2" />
              Approve
            </button>
            <button
              onClick={() => setActiveTab('request_changes')}
              className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'request_changes'
                  ? 'text-red-600 border-b-2 border-red-600 bg-red-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
              disabled={loading}
            >
              <XCircle className="h-4 w-4 inline-block mr-2" />
              Request Changes
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {activeTab === 'approve' ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-medium text-green-900 mb-2">
                  ✓ Approve this stage
                </h3>
                <p className="text-sm text-green-700">
                  This mockup meets the requirements for the{' '}
                  <strong>{stageName}</strong> stage and can move forward in the
                  workflow.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Approval Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any comments or feedback..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  rows={3}
                  disabled={loading}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-medium text-red-900 mb-2">
                  ⚠️ Request Changes
                </h3>
                <p className="text-sm text-red-700">
                  This will send the mockup back to <strong>Stage 1</strong> for
                  revision. The creator will be notified about the requested changes.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What changes are needed? <span className="text-red-600">*</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Please explain what changes need to be made..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                  rows={4}
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Be specific about what needs to change so the creator can address your feedback.
                </p>
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`px-6 py-2 text-white rounded-lg transition-colors font-medium ${
              activeTab === 'approve'
                ? 'bg-green-600 hover:bg-green-700 disabled:bg-green-400'
                : 'bg-red-600 hover:bg-red-700 disabled:bg-red-400'
            }`}
          >
            {loading
              ? 'Processing...'
              : activeTab === 'approve'
              ? 'Approve Stage'
              : 'Request Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
