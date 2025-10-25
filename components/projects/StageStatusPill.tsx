import type { StageStatus } from '@/lib/supabase';

interface StageStatusPillProps {
  status: StageStatus;
  stageName: string;
  reviewedBy?: string;
  reviewedAt?: string;
  notes?: string;
}

export default function StageStatusPill({
  status,
  stageName,
  reviewedBy,
  reviewedAt,
  notes
}: StageStatusPillProps) {
  const statusConfig = {
    pending: {
      color: 'bg-gray-200 text-gray-600',
      icon: '○',
      label: 'Not Started'
    },
    in_review: {
      color: 'bg-yellow-100 text-yellow-700 border border-yellow-300',
      icon: '◐',
      label: 'In Review'
    },
    approved: {
      color: 'bg-green-100 text-green-700 border border-green-300',
      icon: '✓',
      label: 'Approved'
    },
    changes_requested: {
      color: 'bg-red-100 text-red-700 border border-red-300',
      icon: '✕',
      label: 'Changes Requested'
    }
  };

  const config = statusConfig[status];

  // Build tooltip content
  let tooltipContent = `${config.label} - ${stageName}`;
  if (reviewedBy && reviewedAt) {
    const date = new Date(reviewedAt).toLocaleDateString();
    tooltipContent += `\nReviewed by ${reviewedBy} on ${date}`;
  }
  if (notes) {
    tooltipContent += `\n${notes}`;
  }

  return (
    <div
      className={`px-3 py-1.5 rounded-full text-sm font-medium ${config.color} flex items-center gap-1.5 whitespace-nowrap`}
      title={tooltipContent}
    >
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </div>
  );
}
