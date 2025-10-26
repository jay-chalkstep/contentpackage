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
  const { visibility, navVisible } = usePanelContext();

  // Show breadcrumb when panels are hidden
  const showBreadcrumb = (!visibility.list || !visibility.context) && visibility.breadcrumb.length > 0;

  return (
    <div className="flex h-screen bg-[var(--bg-primary)] overflow-hidden pt-16">
      {/* NavRail - Toggleable, offset from top for header */}
      <NavRail />

      {/* Main content area - Left margin to account for fixed NavRail */}
      <div className="flex-1 flex flex-col h-full ml-[120px]">
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
