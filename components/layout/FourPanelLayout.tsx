'use client';

import { ReactNode } from 'react';
import { usePanelContext } from '@/lib/contexts/PanelContext';
import NavRail from '@/components/navigation/NavRail';
import Breadcrumb from '@/components/navigation/Breadcrumb';

interface FourPanelLayoutProps {
  children?: ReactNode;
  contextPanel?: ReactNode;
  gridPanel?: ReactNode;
  previewPanel?: ReactNode;
  propertiesPanel?: ReactNode;
  gridWidth?: 'fixed' | 'flex'; // 'fixed' = 400px, 'flex' = fill remaining space
  previewWidth?: 'fixed' | 'flex'; // 'fixed' = 400px, 'flex' = fill remaining space
  propertiesWidth?: number; // Default 300px
}

export default function FourPanelLayout({
  children,
  contextPanel,
  gridPanel,
  previewPanel,
  propertiesPanel,
  gridWidth = 'flex',
  previewWidth = 'flex',
  propertiesWidth = 300,
}: FourPanelLayoutProps) {
  const { visibility, navVisible } = usePanelContext();

  // Show breadcrumb when panels are hidden
  const showBreadcrumb = (!visibility.list || !visibility.context) && visibility.breadcrumb.length > 0;

  return (
    <div className="flex h-screen bg-[var(--bg-primary)] overflow-hidden pt-16">
      {/* NavRail - Now part of flex flow */}
      <NavRail />

      {/* Main content area */}
      <div className="flex-1 flex flex-col h-full">
        {/* Breadcrumb - shown when panels hidden */}
        {showBreadcrumb && <Breadcrumb path={visibility.breadcrumb} />}

        {/* 4-Panel Layout: Context | Grid | Preview | Properties */}
        <div className="flex flex-1 overflow-hidden">
          {/* Context Panel - 200px fixed, hidden on mobile/when disabled */}
          {visibility.context && contextPanel && (
            <div className="hidden lg:block w-[var(--context-width)] flex-shrink-0 panel overflow-y-auto">
              {contextPanel}
            </div>
          )}

          {/* Grid Panel - Flexible or fixed width, hidden during canvas */}
          {visibility.list && gridPanel && (
            <div className={`${gridWidth === 'fixed' ? 'w-[var(--list-width)] flex-shrink-0' : 'flex-1'} bg-[var(--bg-primary)] border-r border-[var(--border-main)] overflow-hidden flex flex-col`}>
              {gridPanel}
            </div>
          )}

          {/* Preview Panel - Flexible or fixed width */}
          {previewPanel && (
            <div className={`${previewWidth === 'fixed' ? 'w-96' : 'flex-1'} bg-white overflow-y-auto border-r border-[var(--border-main)]`}>
              {previewPanel}
            </div>
          )}

          {/* Properties Panel - Fixed width (default 300px) */}
          {propertiesPanel && (
            <div
              className="flex-shrink-0 bg-white overflow-y-auto border-l border-[var(--border-main)]"
              style={{ width: `${propertiesWidth}px` }}
            >
              {propertiesPanel}
            </div>
          )}

          {/* Fallback: If no panels specified, use children */}
          {!gridPanel && !previewPanel && !propertiesPanel && (
            <div className="flex-1 bg-white overflow-y-auto">
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
