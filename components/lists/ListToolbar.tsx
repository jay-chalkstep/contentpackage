'use client';

import { CheckSquare, Square, Archive, Trash2, FolderOpen, MoreHorizontal } from 'lucide-react';
import { usePanelContext } from '@/lib/contexts/PanelContext';

interface ListToolbarProps {
  totalCount: number;
  onSelectAll?: () => void;
  onClearSelection?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
  onMove?: () => void;
  actions?: React.ReactNode;
}

export default function ListToolbar({
  totalCount,
  onSelectAll,
  onClearSelection,
  onArchive,
  onDelete,
  onMove,
  actions,
}: ListToolbarProps) {
  const { selectedIds } = usePanelContext();
  const selectedCount = selectedIds.length;
  const allSelected = selectedCount === totalCount && totalCount > 0;

  const handleToggleSelectAll = () => {
    if (allSelected && onClearSelection) {
      onClearSelection();
    } else if (onSelectAll) {
      onSelectAll();
    }
  };

  return (
    <div className="sticky top-0 z-10 bg-white border-b border-[var(--border-main)]">
      {/* Header Row with Column Labels */}
      {selectedCount === 0 ? (
        <div className="px-4 py-2 flex items-center gap-3">
          {/* Select All Checkbox */}
          <button
            onClick={handleToggleSelectAll}
            className="flex-shrink-0 p-0.5 hover:bg-[var(--bg-hover)] rounded transition-colors"
            title={allSelected ? 'Deselect all' : 'Select all'}
          >
            {allSelected ? (
              <CheckSquare size={18} className="text-[var(--accent-blue)]" />
            ) : (
              <Square size={18} className="text-[var(--text-secondary)]" />
            )}
          </button>

          {/* Project column header */}
          <div className="flex-1 text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
            Project
          </div>

          {/* Status column header */}
          <div className="flex-shrink-0 w-24 text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
            Status
          </div>

          {/* Actions column header */}
          <div className="flex-shrink-0 w-[120px] text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
            Actions
          </div>
        </div>
      ) : (
        /* Action Toolbar when items are selected */
        <div className="px-4 py-2 flex items-center gap-2">
          {/* Select All Checkbox */}
          <button
            onClick={handleToggleSelectAll}
            className="p-1.5 hover:bg-[var(--bg-hover)] rounded transition-colors"
            title={allSelected ? 'Deselect all' : 'Select all'}
          >
            {allSelected ? (
              <CheckSquare size={18} className="text-[var(--accent-blue)]" />
            ) : (
              <Square size={18} className="text-[var(--text-secondary)]" />
            )}
          </button>

          {/* Action Buttons */}
          <div className="h-4 w-px bg-[var(--border-main)]" />

          {onArchive && (
            <button
              onClick={onArchive}
              className="p-1.5 hover:bg-[var(--bg-hover)] rounded transition-colors"
              title="Archive selected"
            >
              <Archive size={18} className="text-[var(--text-secondary)]" />
            </button>
          )}

          {onDelete && (
            <button
              onClick={onDelete}
              className="p-1.5 hover:bg-[var(--bg-hover)] rounded transition-colors"
              title="Delete selected"
            >
              <Trash2 size={18} className="text-[var(--accent-red)]" />
            </button>
          )}

          {onMove && (
            <button
              onClick={onMove}
              className="p-1.5 hover:bg-[var(--bg-hover)] rounded transition-colors"
              title="Move selected"
            >
              <FolderOpen size={18} className="text-[var(--text-secondary)]" />
            </button>
          )}

          <button
            className="p-1.5 hover:bg-[var(--bg-hover)] rounded transition-colors"
            title="More actions"
          >
            <MoreHorizontal size={18} className="text-[var(--text-secondary)]" />
          </button>

          {/* Selection Count */}
          <div className="ml-auto text-xs text-[var(--text-secondary)]">
            {selectedCount} selected
          </div>

          {/* Custom Actions */}
          {actions && <div className="ml-2">{actions}</div>}
        </div>
      )}
    </div>
  );
}
