'use client';

import { useState } from 'react';
import { Check, X, Clock, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import type { ApprovalProgress } from '@/lib/supabase';

interface ApprovalStatusBannerProps {
  stageProgress: ApprovalProgress;
  currentUserId: string;
  isCurrentUserReviewer: boolean;
  hasCurrentUserApproved: boolean;
  onApprove: () => void;
  onRequestChanges: () => void;
  isProcessing?: boolean;
}

export default function ApprovalStatusBanner({
  stageProgress,
  currentUserId,
  isCurrentUserReviewer,
  hasCurrentUserApproved,
  onApprove,
  onRequestChanges,
  isProcessing = false
}: ApprovalStatusBannerProps) {
  const [expanded, setExpanded] = useState(true);

  const {
    stage_name,
    stage_color,
    approvals_required,
    approvals_received,
    user_approvals
  } = stageProgress;

  // Calculate pending reviewers (those assigned but haven't approved)
  const approvedUserIds = user_approvals
    .filter(a => a.action === 'approve')
    .map(a => a.user_id);

  // Color mapping for stage colors
  const colorClasses = {
    yellow: 'bg-yellow-50 border-yellow-300',
    green: 'bg-green-50 border-green-300',
    blue: 'bg-blue-50 border-blue-300',
    purple: 'bg-purple-50 border-purple-300',
    orange: 'bg-orange-50 border-orange-300',
    red: 'bg-red-50 border-red-300',
    gray: 'bg-gray-50 border-gray-300'
  };

  const textColorClasses = {
    yellow: 'text-yellow-800',
    green: 'text-green-800',
    blue: 'text-blue-800',
    purple: 'text-purple-800',
    orange: 'text-orange-800',
    red: 'text-red-800',
    gray: 'text-gray-800'
  };

  const bgColor = stage_color ? colorClasses[stage_color] : colorClasses.gray;
  const textColor = stage_color ? textColorClasses[stage_color] : textColorClasses.gray;

  const progressPercentage = approvals_required > 0
    ? Math.round((approvals_received / approvals_required) * 100)
    : 0;

  return (
    <div className={`border rounded-lg ${bgColor} overflow-hidden`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-current border-opacity-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            {/* Stage indicator */}
            <div className={`px-2 py-1 rounded text-xs font-semibold ${textColor} bg-white bg-opacity-50`}>
              {stage_name}
            </div>

            {/* Progress indicator */}
            <div className="flex items-center gap-2">
              <div className={`text-sm font-medium ${textColor}`}>
                {approvals_received} of {approvals_required} approved
              </div>
              <div className="flex-1 min-w-[100px] max-w-[200px] h-2 bg-white bg-opacity-50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-current transition-all duration-300"
                  style={{ width: `${progressPercentage}%`, opacity: 0.6 }}
                />
              </div>
            </div>

            {/* User status badge */}
            {isCurrentUserReviewer && (
              <div className="ml-auto">
                {hasCurrentUserApproved ? (
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                    <Check className="h-3 w-3" />
                    You approved
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-medium">
                    <Clock className="h-3 w-3" />
                    Your approval needed
                  </div>
                )}
              </div>
            )}

            {/* Expand/collapse button */}
            <button
              onClick={() => setExpanded(!expanded)}
              className={`p-1 hover:bg-white hover:bg-opacity-30 rounded transition-colors ${textColor}`}
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
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 py-3 space-y-3">
          {/* Reviewer list */}
          {user_approvals.length > 0 && (
            <div className="space-y-2">
              <div className={`text-xs font-semibold ${textColor} uppercase tracking-wide`}>
                Reviewers
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {user_approvals.map((approval) => (
                  <div
                    key={approval.id}
                    className="flex items-center gap-2 p-2 bg-white bg-opacity-50 rounded"
                  >
                    {/* Avatar or initials */}
                    {approval.user_image_url ? (
                      <img
                        src={approval.user_image_url}
                        alt={approval.user_name}
                        className="h-6 w-6 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600">
                        {approval.user_name.substring(0, 2).toUpperCase()}
                      </div>
                    )}

                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {approval.user_name}
                      </div>
                      {approval.notes && (
                        <div className="text-xs text-gray-500 truncate" title={approval.notes}>
                          {approval.notes}
                        </div>
                      )}
                    </div>

                    {/* Status icon */}
                    {approval.action === 'approve' ? (
                      <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    ) : (
                      <X className="h-4 w-4 text-red-600 flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons (only show if user is reviewer and hasn't approved) */}
          {isCurrentUserReviewer && !hasCurrentUserApproved && (
            <div className="flex gap-2 pt-2 border-t border-current border-opacity-20">
              <button
                onClick={onApprove}
                disabled={isProcessing}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
              >
                <Check className="h-4 w-4" />
                {isProcessing ? 'Processing...' : 'Approve'}
              </button>
              <button
                onClick={onRequestChanges}
                disabled={isProcessing}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
              >
                <AlertCircle className="h-4 w-4" />
                {isProcessing ? 'Processing...' : 'Request Changes'}
              </button>
            </div>
          )}

          {/* Info message if user already approved */}
          {isCurrentUserReviewer && hasCurrentUserApproved && (
            <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-green-800">
                <div className="font-medium">You've approved this stage</div>
                <div className="text-xs mt-0.5">
                  Waiting for {approvals_required - approvals_received} more {approvals_required - approvals_received === 1 ? 'reviewer' : 'reviewers'}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
