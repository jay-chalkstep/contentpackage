'use client';

import { usePanelContext } from '@/lib/contexts/PanelContext';
import { Layers } from 'lucide-react';

interface PreviewAreaProps {
  children?: React.ReactNode;
  emptyIcon?: React.ReactNode;
  emptyMessage?: string;
}

export default function PreviewArea({
  children,
  emptyIcon = <Layers size={48} className="text-[var(--text-tertiary)]" />,
  emptyMessage = 'Select an item to preview',
}: PreviewAreaProps) {
  const { selectedIds } = usePanelContext();

  // If children provided, always render them
  if (children) {
    return <div className="h-full overflow-auto">{children}</div>;
  }

  // Empty state when nothing selected
  if (selectedIds.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4 flex justify-center">{emptyIcon}</div>
          <div className="text-[var(--text-secondary)] text-sm">{emptyMessage}</div>
        </div>
      </div>
    );
  }

  // Multi-select state
  if (selectedIds.length > 1) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-[var(--text-primary)] text-lg font-medium mb-2">
            {selectedIds.length} items selected
          </div>
          <div className="text-[var(--text-secondary)] text-sm">
            Multiple items selected
          </div>
        </div>
      </div>
    );
  }

  // Single item selected - fallback (children should handle this)
  return (
    <div className="h-full overflow-auto">
      <div className="p-8">
        <div className="text-[var(--text-secondary)]">Loading preview...</div>
      </div>
    </div>
  );
}
