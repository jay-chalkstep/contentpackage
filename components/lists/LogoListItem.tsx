'use client';

import { Brand, LogoVariant } from '@/lib/supabase';
import { CheckSquare, Square } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface LogoListItemProps {
  brand: Brand;
  isSelected: boolean;
  onToggleSelect?: () => void;
}

export default function LogoListItem({
  brand,
  isSelected,
  onToggleSelect,
}: LogoListItemProps) {
  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleSelect) {
      onToggleSelect();
    }
  };

  const primaryLogo = brand.primary_logo_variant || brand.logo_variants?.[0];

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

      {/* Logo Thumbnail */}
      <div className="flex-shrink-0 w-12 h-12 bg-[var(--bg-primary)] rounded overflow-hidden flex items-center justify-center">
        {primaryLogo?.logo_url ? (
          <img
            src={primaryLogo.logo_url}
            alt={brand.company_name}
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <div className="text-[var(--text-tertiary)] text-xs">No logo</div>
        )}
      </div>

      {/* Company Name & Domain */}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm text-[var(--text-primary)] truncate">
          {brand.company_name}
        </div>
        <div className="text-xs text-[var(--text-secondary)] truncate">
          {brand.domain || 'No domain'}
        </div>
      </div>

      {/* Variant Count */}
      <div className="flex-shrink-0 text-xs text-[var(--text-tertiary)]">
        {brand.logo_variants?.length || 0} variants
      </div>

      {/* Time */}
      <div className="flex-shrink-0 text-xs text-[var(--text-tertiary)] w-20 text-right">
        {formatDistanceToNow(new Date(brand.created_at), { addSuffix: true })}
      </div>
    </div>
  );
}
