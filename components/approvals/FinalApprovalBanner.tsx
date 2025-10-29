'use client';

import { useState } from 'react';
import { Crown, Check, X, ChevronDown, ChevronUp } from 'lucide-react';

interface FinalApprovalBannerProps {
  mockupName: string;
  projectName: string;
  totalStages: number;
  onFinalApprove: (notes?: string) => void;
  isProcessing?: boolean;
}

export default function FinalApprovalBanner({
  mockupName,
  projectName,
  totalStages,
  onFinalApprove,
  isProcessing = false
}: FinalApprovalBannerProps) {
  const [showNotesInput, setShowNotesInput] = useState(false);
  const [notes, setNotes] = useState('');
  const [expanded, setExpanded] = useState(true);

  const handleApprove = () => {
    onFinalApprove(notes.trim() || undefined);
  };

  return (
    <div className="border-2 border-purple-300 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-purple-100 to-blue-100 border-b border-purple-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Crown icon */}
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center">
              <Crown className="h-4 w-4 text-white" />
            </div>

            <div>
              <div className="text-sm font-semibold text-purple-900">
                Final Approval Required
              </div>
              <div className="text-xs text-purple-700">
                All {totalStages} workflow stages completed
              </div>
            </div>
          </div>

          {/* Expand/collapse button */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 hover:bg-white hover:bg-opacity-50 rounded transition-colors text-purple-700"
            title={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 py-4 space-y-4">
          {/* Summary */}
          <div className="space-y-2">
            <div className="text-sm text-gray-700">
              <span className="font-medium">"{mockupName}"</span> has passed all workflow stages
              in <span className="font-medium">{projectName}</span>.
            </div>
            <div className="text-sm text-gray-600">
              As the project owner, you have the final say. Review the asset and provide your approval
              to mark it as complete and ready for use.
            </div>
          </div>

          {/* Stage completion indicator */}
          <div className="flex items-center gap-2 p-3 bg-white bg-opacity-60 rounded-lg border border-purple-200">
            <div className="flex items-center gap-1">
              {Array.from({ length: totalStages }).map((_, i) => (
                <div
                  key={i}
                  className="h-2 w-8 bg-green-500 rounded-full"
                />
              ))}
            </div>
            <div className="text-xs font-medium text-gray-700">
              All stages approved
            </div>
          </div>

          {/* Optional notes input */}
          {!showNotesInput ? (
            <button
              onClick={() => setShowNotesInput(true)}
              className="text-xs text-purple-700 hover:text-purple-900 underline"
            >
              Add approval notes (optional)
            </button>
          ) : (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Approval Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any final comments or notes..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              />
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleApprove}
              disabled={isProcessing}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-400 text-white rounded-lg font-semibold transition-all shadow-sm hover:shadow-md"
            >
              <Crown className="h-4 w-4" />
              {isProcessing ? 'Processing...' : 'Give Final Approval'}
            </button>
          </div>

          {/* Helper text */}
          <div className="flex items-start gap-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="text-xs text-purple-800">
              <div className="font-medium mb-1">What happens next?</div>
              <ul className="list-disc list-inside space-y-0.5 text-purple-700">
                <li>Asset will be marked as fully approved</li>
                <li>All team members will be notified</li>
                <li>Asset can proceed to production/delivery</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
