'use client';

import { useState } from 'react';
import { usePanelContext } from '@/lib/contexts/PanelContext';
import { ChevronDown, ChevronRight, Filter } from 'lucide-react';

interface ContextPanelProps {
  activeNav: string;
  children?: React.ReactNode;
}

export default function ContextPanel({ activeNav, children }: ContextPanelProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    filters: true,
    folders: true,
    recent: true,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Render content based on active navigation
  const renderContent = () => {
    // If children provided, render them
    if (children) {
      return children;
    }

    // Default content based on active nav
    switch (activeNav) {
      case 'library':
        return (
          <div className="p-4 space-y-4">
            {/* Filters Section */}
            <div>
              <button
                onClick={() => toggleSection('filters')}
                className="w-full flex items-center justify-between p-2 hover:bg-[var(--bg-hover)] rounded-lg transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Filter size={16} className="text-[var(--text-secondary)]" />
                  <span className="text-sm font-medium text-[var(--text-primary)]">
                    Filters
                  </span>
                </div>
                {expandedSections.filters ? (
                  <ChevronDown size={16} className="text-[var(--text-secondary)]" />
                ) : (
                  <ChevronRight size={16} className="text-[var(--text-secondary)]" />
                )}
              </button>

              {expandedSections.filters && (
                <div className="mt-2 space-y-1 pl-2">
                  <FilterItem label="All Mockups" count={0} />
                  <FilterItem label="Approved" count={0} />
                  <FilterItem label="Needs Review" count={0} />
                  <FilterItem label="Unsorted" count={0} />
                </div>
              )}
            </div>

            {/* Folders Section - Placeholder for FolderTree */}
            <div>
              <button
                onClick={() => toggleSection('folders')}
                className="w-full flex items-center justify-between p-2 hover:bg-[var(--bg-hover)] rounded-lg transition-colors"
              >
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  Folders
                </span>
                {expandedSections.folders ? (
                  <ChevronDown size={16} className="text-[var(--text-secondary)]" />
                ) : (
                  <ChevronRight size={16} className="text-[var(--text-secondary)]" />
                )}
              </button>

              {expandedSections.folders && (
                <div className="mt-2 pl-2 text-sm text-[var(--text-secondary)]">
                  {/* FolderTree component will go here */}
                  <div className="py-2">Folders will appear here</div>
                </div>
              )}
            </div>
          </div>
        );

      case 'search':
        return (
          <div className="p-4">
            <div className="text-sm text-[var(--text-secondary)]">
              <div className="font-medium mb-2">Recent Searches</div>
              <div className="text-xs py-2">No recent searches</div>
            </div>
          </div>
        );

      case 'design':
        return (
          <div className="p-4">
            <div className="text-sm text-[var(--text-secondary)]">
              <div className="font-medium mb-2">Templates</div>
              <div className="text-xs py-2">Template library</div>
            </div>
          </div>
        );

      case 'reviews':
        return (
          <div className="p-4 space-y-4">
            <div>
              <div className="text-sm font-medium text-[var(--text-primary)] mb-2">
                Inbox
              </div>
              <div className="space-y-1">
                <FilterItem label="Urgent" count={0} />
                <FilterItem label="Regular" count={0} />
              </div>
            </div>
          </div>
        );

      case 'projects':
        return (
          <div className="p-4 space-y-4">
            <div>
              <div className="text-sm font-medium text-[var(--text-primary)] mb-2">
                Status
              </div>
              <div className="space-y-1">
                <FilterItem label="Active" count={0} />
                <FilterItem label="Completed" count={0} />
                <FilterItem label="Archived" count={0} />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      {renderContent()}
    </div>
  );
}

// Helper component for filter items
function FilterItem({ label, count }: { label: string; count: number }) {
  return (
    <button className="w-full flex items-center justify-between px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] rounded-lg transition-colors">
      <span>{label}</span>
      {count > 0 && (
        <span className="text-xs bg-[var(--bg-selected)] text-[var(--accent-blue)] px-2 py-0.5 rounded-full">
          {count}
        </span>
      )}
    </button>
  );
}
