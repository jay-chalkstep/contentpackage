'use client';

import { useState, useCallback } from 'react';
import { usePanelContext } from '@/lib/contexts/PanelContext';

interface ListViewProps<T extends { id: string }> {
  items: T[];
  renderItem: (item: T, index: number, isSelected: boolean) => React.ReactNode;
  itemHeight: number; // Fixed height per row (e.g., 72px)
  loading?: boolean;
  emptyMessage?: string;
  toolbar?: React.ReactNode;
}

export default function ListView<T extends { id: string }>({
  items,
  renderItem,
  itemHeight,
  loading = false,
  emptyMessage = 'No items found',
  toolbar,
}: ListViewProps<T>) {
  const { selectedIds, setSelectedIds, lastSelectedIndex, setLastSelectedIndex } = usePanelContext();

  // Handle item click with multi-select support
  const handleItemClick = useCallback(
    (id: string, index: number, event: React.MouseEvent) => {
      if (event.shiftKey && lastSelectedIndex !== null) {
        // Range select
        const start = Math.min(lastSelectedIndex, index);
        const end = Math.max(lastSelectedIndex, index);
        const rangeIds = items.slice(start, end + 1).map((item) => item.id);
        setSelectedIds(rangeIds);
      } else if (event.ctrlKey || event.metaKey) {
        // Toggle single
        setSelectedIds(
          selectedIds.includes(id)
            ? selectedIds.filter((i) => i !== id)
            : [...selectedIds, id]
        );
      } else {
        // Single select
        setSelectedIds([id]);
      }
      setLastSelectedIndex(index);
    },
    [items, selectedIds, lastSelectedIndex, setSelectedIds, setLastSelectedIndex]
  );

  // Row renderer for virtual list
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const item = items[index];
    const isSelected = selectedIds.includes(item.id);

    return (
      <div
        style={style}
        onClick={(e) => handleItemClick(item.id, index, e)}
        className="cursor-pointer"
      >
        {renderItem(item, index, isSelected)}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-blue)] mx-auto mb-2"></div>
          <div className="text-sm text-[var(--text-secondary)]">Loading...</div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-[var(--text-secondary)]">
          <div className="text-sm">{emptyMessage}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      {toolbar}

      {/* List - Simple scrolling for now */}
      <div className="flex-1 overflow-y-auto">
        {items.map((item, index) => {
          const isSelected = selectedIds.includes(item.id);
          return (
            <div
              key={item.id}
              onClick={(e) => handleItemClick(item.id, index, e)}
              className="cursor-pointer"
            >
              {renderItem(item, index, isSelected)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
