'use client';

import { Brand } from '@/lib/supabase';
import { CheckSquare, Square, Building2 } from 'lucide-react';

interface BrandListItemProps {
  brand: Brand;
  isSelected: boolean;
  onToggleSelect?: () => void;
}

export default function BrandListItem({
  brand,
  isSelected,
  onToggleSelect,
}: BrandListItemProps) {
  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleSelect) {
      onToggleSelect();
    }
  };

  const primaryLogo = brand.primary_logo_variant;
  const colorPreview = brand.brand_colors?.slice(0, 3) || [];

  return (
    <div
      className={`
        flex items-center gap-3 px-4 py-3 border-b border-[var(--border-light)]
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

      {/* Brand Logo */}
      <div className="flex-shrink-0 w-12 h-12 rounded bg-[var(--bg-secondary)] flex items-center justify-center overflow-hidden p-2">
        {primaryLogo ? (
          <img
            src={primaryLogo.logo_url}
            alt={brand.company_name}
            className="w-full h-full object-contain"
          />
        ) : (
          <Building2 size={20} className="text-[var(--text-tertiary)]" />
        )}
      </div>

      {/* Brand Info */}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm text-[var(--text-primary)] truncate">
          {brand.company_name}
        </div>
        <div className="text-xs text-[var(--text-secondary)] truncate">
          {brand.domain}
        </div>
      </div>

      {/* Color Preview */}
      {colorPreview.length > 0 && (
        <div className="flex-shrink-0 flex items-center gap-1">
          {colorPreview.map((color, idx) => (
            <div
              key={idx}
              className="w-5 h-5 rounded-full border border-[var(--border-main)]"
              style={{ backgroundColor: color.hex }}
              title={color.hex}
            />
          ))}
          {brand.brand_colors && brand.brand_colors.length > 3 && (
            <span className="text-xs text-[var(--text-tertiary)] ml-1">
              +{brand.brand_colors.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Variant Count */}
      <div className="flex-shrink-0 text-xs text-[var(--text-tertiary)] w-20 text-right">
        {brand.logo_variants?.length || 0} variant{brand.logo_variants?.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}
