'use client';

import { Project } from '@/lib/supabase';
import { CheckSquare, Square, Briefcase } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ProjectListItemProps {
  project: Project;
  isSelected: boolean;
  onToggleSelect?: () => void;
}

export default function ProjectListItem({
  project,
  isSelected,
  onToggleSelect,
}: ProjectListItemProps) {
  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleSelect) {
      onToggleSelect();
    }
  };

  // Status color mapping
  const statusColors = {
    active: 'text-[var(--accent-green)]',
    completed: 'text-[var(--accent-blue)]',
    archived: 'text-[var(--text-tertiary)]',
  };

  return (
    <div
      className={`
        flex items-center gap-3 px-4 py-2 border-b border-[var(--border-light)]
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

      {/* Project Icon with Color */}
      <div
        className="flex-shrink-0 w-10 h-10 rounded flex items-center justify-center"
        style={{ backgroundColor: project.color || '#6B7280' }}
      >
        <Briefcase size={20} className="text-white" />
      </div>

      {/* Title & Description */}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm text-[var(--text-primary)] truncate">
          {project.name}
        </div>
        <div className="text-xs text-[var(--text-secondary)] truncate">
          {project.client_name || 'No client'} • {project.mockup_count || 0} mockups
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex-shrink-0">
        <span className={`text-xs font-medium capitalize ${statusColors[project.status]}`}>
          {project.status}
        </span>
      </div>

      {/* Time */}
      <div className="flex-shrink-0 text-xs text-[var(--text-tertiary)] w-20 text-right">
        {formatDistanceToNow(new Date(project.created_at), { addSuffix: true })}
      </div>
    </div>
  );
}
