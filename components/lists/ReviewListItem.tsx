'use client';

import { useState } from 'react';
import { CardMockup, WorkflowStageColor } from '@/lib/supabase';
import { CheckSquare, Square, FileImage, Check, Loader2 } from 'lucide-react';

interface ReviewListItemProps {
  mockup: CardMockup;
  projectName: string;
  projectColor: string;
  stageOrder: number;
  stageName: string;
  stageColor: WorkflowStageColor;
  isSelected: boolean;
  onToggleSelect?: () => void;
  onQuickApprove?: () => Promise<void>;
  hasUserApproved?: boolean;
}

export default function ReviewListItem({
  mockup,
  projectName,
  projectColor,
  stageOrder,
  stageName,
  stageColor,
  isSelected,
  onToggleSelect,
  onQuickApprove,
  hasUserApproved = false,
}: ReviewListItemProps) {
  const [isApproving, setIsApproving] = useState(false);

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleSelect) {
      onToggleSelect();
    }
  };

  const handleQuickApprove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onQuickApprove || hasUserApproved) return;

    setIsApproving(true);
    try {
      await onQuickApprove();
    } catch (error) {
      console.error('Quick approve failed:', error);
    } finally {
      setIsApproving(false);
    }
  };

  // Color mapping for workflow stage colors
  const stageColorClasses: Record<WorkflowStageColor, string> = {
    yellow: 'bg-yellow-100 text-yellow-800',
    green: 'bg-green-100 text-green-800',
    blue: 'bg-blue-100 text-blue-800',
    purple: 'bg-purple-100 text-purple-800',
    orange: 'bg-orange-100 text-orange-800',
    red: 'bg-red-100 text-red-800',
    gray: 'bg-gray-100 text-gray-800',
  };

  const stageColorClass = stageColorClasses[stageColor] || stageColorClasses.gray;

  return (
    <div
      className={`
        flex items-center gap-3 px-4 py-3 border-b border-[var(--border-light)]
        hover-row transition-colors
        ${isSelected ? 'bg-[var(--bg-selected)]' : 'bg-white'}
      `}
    >
      {/* Checkbox */}
      <button
        onClick={handleCheckboxClick}
        className="flex-shrink-0 p-0.5 hover:bg-[var(--bg-hover)] rounded transition-colors"
      >
        {isSelected ? (
          <CheckSquare size={18} className="text-[var(--accent-blue)]" />
        ) : (
          <Square size={18} className="text-[var(--text-tertiary)]" />
        )}
      </button>

      {/* Mockup Thumbnail */}
      <div className="flex-shrink-0 w-16 h-10 rounded bg-[var(--bg-secondary)] flex items-center justify-center overflow-hidden">
        {mockup.mockup_image_url ? (
          <img
            src={mockup.mockup_image_url}
            alt={mockup.mockup_name}
            className="w-full h-full object-contain"
          />
        ) : (
          <FileImage size={20} className="text-[var(--text-tertiary)]" />
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm text-[var(--text-primary)] truncate">
          {mockup.mockup_name}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: projectColor }}
          />
          <span className="text-xs text-[var(--text-secondary)] truncate">
            {projectName}
          </span>
        </div>
      </div>

      {/* Stage Badge */}
      <div className="flex-shrink-0">
        <span className={`text-xs font-medium px-2 py-1 rounded ${stageColorClass}`}>
          {stageName}
        </span>
      </div>

      {/* Quick Approve Button */}
      {onQuickApprove && (
        <div className="flex-shrink-0">
          {hasUserApproved ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded text-xs font-medium">
              <Check size={14} />
              Approved
            </div>
          ) : (
            <button
              onClick={handleQuickApprove}
              disabled={isApproving}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded text-xs font-medium transition-colors"
            >
              {isApproving ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <Check size={14} />
                  Quick Approve
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
