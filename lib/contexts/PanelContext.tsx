'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface PanelVisibility {
  context: boolean;  // Hidden on mobile, collapsible
  list: boolean;     // Hidden during canvas mode
  preview: boolean;  // Can expand to full width
  breadcrumb: string[]; // ['Projects', 'Q4 Campaign', 'Mockup']
}

interface PanelContextType {
  visibility: PanelVisibility;
  setVisibility: (visibility: Partial<PanelVisibility>) => void;
  setBreadcrumb: (path: string[]) => void;
  navExpanded: boolean;
  setNavExpanded: (expanded: boolean) => void;
  activeNav: string;
  setActiveNav: (nav: string) => void;
  selectedIds: string[];
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>;
  lastSelectedIndex: number | null;
  setLastSelectedIndex: (index: number | null) => void;
}

const PanelContext = createContext<PanelContextType | undefined>(undefined);

export function PanelProvider({ children }: { children: ReactNode }) {
  // Panel visibility state
  const [visibility, setVisibilityState] = useState<PanelVisibility>({
    context: true,
    list: true,
    preview: true,
    breadcrumb: [],
  });

  // Navigation state with localStorage persistence
  const [navExpanded, setNavExpandedState] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('nav-expanded');
      return stored === 'true';
    }
    return false;
  });

  // Active navigation item - defaults to 'projects'
  const [activeNav, setActiveNav] = useState<string>('projects');

  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);

  // Persist nav expanded state to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('nav-expanded', String(navExpanded));
    }
  }, [navExpanded]);

  // Merge visibility updates
  const setVisibility = (updates: Partial<PanelVisibility>) => {
    setVisibilityState((prev) => ({ ...prev, ...updates }));
  };

  // Update breadcrumb
  const setBreadcrumb = (path: string[]) => {
    setVisibility({ breadcrumb: path });
  };

  // Wrapper for setNavExpanded to persist
  const setNavExpanded = (expanded: boolean) => {
    setNavExpandedState(expanded);
  };

  return (
    <PanelContext.Provider
      value={{
        visibility,
        setVisibility,
        setBreadcrumb,
        navExpanded,
        setNavExpanded,
        activeNav,
        setActiveNav,
        selectedIds,
        setSelectedIds,
        lastSelectedIndex,
        setLastSelectedIndex,
      }}
    >
      {children}
    </PanelContext.Provider>
  );
}

export function usePanelContext() {
  const context = useContext(PanelContext);
  if (context === undefined) {
    throw new Error('usePanelContext must be used within a PanelProvider');
  }
  return context;
}
