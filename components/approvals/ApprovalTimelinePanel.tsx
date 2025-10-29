'use client';

import { Check, X, Crown } from 'lucide-react';
import type { AssetApprovalSummary, WorkflowStage } from '@/lib/supabase';

interface ApprovalTimelinePanelProps {
  approvalSummary: AssetApprovalSummary;
  stages: WorkflowStage[];
}

export default function ApprovalTimelinePanel({
  approvalSummary,
  stages
}: ApprovalTimelinePanelProps) {
  const { approvals_by_stage, progress_summary, final_approval } = approvalSummary;

  // Flatten all approvals into chronological timeline
  const allApprovals = Object.values(approvals_by_stage)
    .flat()
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  // Format date/time
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  // Get stage info
  const getStageInfo = (stageOrder: number) => {
    const stage = stages.find(s => s.order === stageOrder);
    return {
      name: stage?.name || `Stage ${stageOrder}`,
      color: stage?.color || 'gray'
    };
  };

  // Color classes for stage badges
  const stageColorClasses = {
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    green: 'bg-green-100 text-green-800 border-green-300',
    blue: 'bg-blue-100 text-blue-800 border-blue-300',
    purple: 'bg-purple-100 text-purple-800 border-purple-300',
    orange: 'bg-orange-100 text-orange-800 border-orange-300',
    red: 'bg-red-100 text-red-800 border-red-300',
    gray: 'bg-gray-100 text-gray-800 border-gray-300'
  };

  if (allApprovals.length === 0 && !final_approval) {
    return (
      <div className="p-8 text-center text-gray-500">
        <div className="text-sm">No approvals yet</div>
        <div className="text-xs mt-1">Approval history will appear here</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {/* Timeline heading */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Approval Timeline</h3>
        <div className="text-xs text-gray-500">
          {allApprovals.length} {allApprovals.length === 1 ? 'review' : 'reviews'}
        </div>
      </div>

      {/* Timeline items */}
      <div className="space-y-3">
        {allApprovals.map((approval, index) => {
          const stageInfo = getStageInfo(approval.stage_order);
          const stageColorClass = stageColorClasses[stageInfo.color] || stageColorClasses.gray;
          const isApprove = approval.action === 'approve';

          return (
            <div key={approval.id} className="relative">
              {/* Timeline line (not for last item) */}
              {index < allApprovals.length - 1 && (
                <div className="absolute left-[15px] top-8 bottom-[-12px] w-0.5 bg-gray-200" />
              )}

              {/* Timeline item */}
              <div className="flex gap-3">
                {/* Icon */}
                <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                  isApprove ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {isApprove ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <X className="h-4 w-4 text-red-600" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pt-0.5">
                  {/* User info and action */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {approval.user_image_url && (
                        <img
                          src={approval.user_image_url}
                          alt={approval.user_name}
                          className="h-5 w-5 rounded-full object-cover flex-shrink-0"
                        />
                      )}
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {approval.user_name}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 whitespace-nowrap">
                      {formatDateTime(approval.created_at)}
                    </div>
                  </div>

                  {/* Action description */}
                  <div className="mt-0.5 text-sm text-gray-600">
                    {isApprove ? 'Approved' : 'Requested changes for'}{' '}
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium border ${stageColorClass}`}>
                      {stageInfo.name}
                    </span>
                  </div>

                  {/* Notes if present */}
                  {approval.notes && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-700 border border-gray-200">
                      {approval.notes}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Final approval (if exists) */}
        {final_approval && (
          <div className="relative">
            {/* Timeline line */}
            {allApprovals.length > 0 && (
              <div className="absolute left-[15px] top-0 h-3 w-0.5 bg-gray-200" />
            )}

            {/* Final approval item */}
            <div className="flex gap-3">
              {/* Icon */}
              <div className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center bg-gradient-to-br from-purple-400 to-blue-500">
                <Crown className="h-4 w-4 text-white" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm font-semibold text-gray-900">
                    Final Approval
                  </div>
                  <div className="text-xs text-gray-500 whitespace-nowrap">
                    {formatDateTime(final_approval.approved_at)}
                  </div>
                </div>

                <div className="mt-0.5 text-sm text-gray-600">
                  Project owner approved this asset
                </div>

                {final_approval.notes && (
                  <div className="mt-2 p-2 bg-purple-50 rounded text-xs text-purple-900 border border-purple-200">
                    {final_approval.notes}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stage progress summary */}
      <div className="pt-4 border-t border-gray-200">
        <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
          Stage Progress
        </div>
        <div className="space-y-1.5">
          {stages.map((stage) => {
            const progress = progress_summary[stage.order];
            if (!progress) return null;

            const percentage = progress.approvals_required > 0
              ? Math.round((progress.approvals_received / progress.approvals_required) * 100)
              : 0;

            const isComplete = progress.is_complete;
            const stageColorClass = stageColorClasses[stage.color] || stageColorClasses.gray;

            return (
              <div key={stage.order} className="flex items-center gap-2 text-xs">
                <div className={`px-1.5 py-0.5 rounded font-medium border min-w-[80px] text-center ${stageColorClass}`}>
                  {stage.name}
                </div>
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${isComplete ? 'bg-green-500' : 'bg-blue-500'}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className={`font-medium ${isComplete ? 'text-green-600' : 'text-gray-600'}`}>
                  {progress.approvals_received}/{progress.approvals_required}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
