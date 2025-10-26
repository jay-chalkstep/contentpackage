'use client';

import { ReactNode } from 'react';
import { usePanelContext } from '@/lib/contexts/PanelContext';
import NavRail from '@/components/navigation/NavRail';
import Breadcrumb from '@/components/navigation/Breadcrumb';

interface GmailLayoutProps {
  children?: ReactNode;
  contextPanel?: ReactNode;
  listView?: ReactNode;
  previewArea?: ReactNode;
}

export default function GmailLayout({
  children,
  contextPanel,
  listView,
  previewArea,
}: GmailLayoutProps) {
  const { visibility } = usePanelContext();

  // Show breadcrumb when panels are hidden
  const showBreadcrumb = (!visibility.list || !visibility.context) && visibility.breadcrumb.length > 0;

  return (
    <div className="flex h-screen bg-[var(--bg-primary)] overflow-hidden">
      {/* NavRail - Always visible, fixed 120px */}
      <NavRail />

      {/* 12px gutter between NavRail and content */}
      <div className="w-3 bg-[#F7F9FA] flex-shrink-0" />

      {/* Main content area */}
      <div className="flex-1 flex flex-col h-screen">
        {/* Breadcrumb - shown when panels hidden */}
        {showBreadcrumb && <Breadcrumb path={visibility.breadcrumb} />}

        {/* 3-Panel Layout: Context | List | Preview */}
        <div className="flex flex-1 overflow-hidden">
          {/* Context Panel - 200px fixed, hidden on mobile/when disabled */}
          {visibility.context && contextPanel && (
            <div className="hidden lg:block w-[var(--context-width)] panel overflow-y-auto">
              {contextPanel}
            </div>
          )}

          {/* List View - 400px fixed, hidden during canvas */}
          {visibility.list && listView && (
            <div className="w-[var(--list-width)] bg-[var(--bg-primary)] border-r border-[var(--border-main)] overflow-hidden flex flex-col">
              {listView}
            </div>
          )}

          {/* Preview Area - Remaining space, expands when list hidden */}
          <div className="flex-1 bg-white overflow-hidden">
            {previewArea || children}
          </div>
        </div>
      </div>
    </div>
  );
}
