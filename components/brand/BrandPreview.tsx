'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Brand } from '@/lib/supabase';
import { Building2, ExternalLink, Palette, Type, Download, Trash2, Loader2 } from 'lucide-react';

interface BrandPreviewProps {
  brand: Brand;
  onSave?: (brandId: string) => void;
  onDelete?: (brandId: string) => void;
  showActions?: boolean;
}

export default function BrandPreview({
  brand,
  onSave,
  onDelete,
  showActions = true,
}: BrandPreviewProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!onDelete) return;

    const confirmed = window.confirm(
      `Delete ${brand.company_name}?\n\nThis will permanently remove all logo variants, colors, and fonts.\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    setDeleting(true);
    try {
      await onDelete(brand.id);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-[var(--border-main)] px-6 py-4 z-10">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-1">
              {brand.company_name}
            </h2>
            <a
              href={`https://${brand.domain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[var(--accent-blue)] hover:underline flex items-center gap-1"
            >
              {brand.domain}
              <ExternalLink size={12} />
            </a>
            {brand.description && (
              <p className="text-sm text-[var(--text-secondary)] mt-2">
                {brand.description}
              </p>
            )}
          </div>
          {showActions && onDelete && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--accent-red)] border border-[var(--accent-red)] rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              {deleting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Trash2 size={16} />
              )}
              <span>Delete</span>
            </button>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Logo Variants */}
        {brand.logo_variants && brand.logo_variants.length > 0 && (
          <div className="bg-white rounded-lg p-5 border border-[var(--border-main)]">
            <div className="flex items-center gap-2 mb-4">
              <Building2 size={20} className="text-[var(--accent-blue)]" />
              <h3 className="font-semibold text-[var(--text-primary)]">Logo Variants</h3>
              <span className="text-xs text-[var(--text-tertiary)]">
                ({brand.logo_variants.length})
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {brand.logo_variants.map((variant) => (
                <div
                  key={variant.id}
                  className="aspect-video bg-[var(--bg-secondary)] rounded-lg flex items-center justify-center p-4 hover:bg-[var(--bg-hover)] transition-colors cursor-pointer group relative"
                  onClick={() => {
                    // Could open in designer or download
                    console.log('Logo clicked:', variant);
                  }}
                >
                  <img
                    src={variant.logo_url}
                    alt={`${brand.company_name} logo`}
                    className="max-w-full max-h-full object-contain"
                  />
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(variant.logo_url, '_blank');
                      }}
                      className="p-1.5 bg-white rounded shadow-md hover:bg-gray-50"
                      title="Download"
                    >
                      <Download size={14} className="text-[var(--text-secondary)]" />
                    </button>
                  </div>
                  {variant.id === brand.primary_logo_variant_id && (
                    <div className="absolute bottom-2 left-2">
                      <span className="text-xs bg-[var(--accent-blue)] text-white px-2 py-0.5 rounded">
                        Primary
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Brand Colors */}
        {brand.brand_colors && brand.brand_colors.length > 0 && (
          <div className="bg-white rounded-lg p-5 border border-[var(--border-main)]">
            <div className="flex items-center gap-2 mb-4">
              <Palette size={20} className="text-[var(--accent-purple)]" />
              <h3 className="font-semibold text-[var(--text-primary)]">Brand Colors</h3>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
              {brand.brand_colors.map((color, idx) => (
                <div
                  key={idx}
                  className="group cursor-pointer"
                  onClick={() => {
                    navigator.clipboard.writeText(color.hex);
                    // Could show toast here
                  }}
                  title="Click to copy"
                >
                  <div
                    className="aspect-square rounded-lg shadow-sm mb-2 transition-transform hover:scale-105"
                    style={{ backgroundColor: color.hex }}
                  />
                  <p className="text-xs font-medium text-[var(--text-primary)] text-center truncate">
                    {color.hex}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)] capitalize text-center">
                    {color.type}
                  </p>
                </div>
              ))}
            </div>
            <p className="text-xs text-[var(--text-tertiary)] mt-4 text-center">
              Click any color to copy its hex code
            </p>
          </div>
        )}

        {/* Brand Fonts */}
        {brand.brand_fonts && brand.brand_fonts.length > 0 && (
          <div className="bg-white rounded-lg p-5 border border-[var(--border-main)]">
            <div className="flex items-center gap-2 mb-4">
              <Type size={20} className="text-[var(--accent-green)]" />
              <h3 className="font-semibold text-[var(--text-primary)]">Brand Fonts</h3>
            </div>
            <div className="space-y-3">
              {brand.brand_fonts.map((font, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-[var(--bg-secondary)] rounded-lg"
                >
                  <div>
                    <div className="font-medium text-[var(--text-primary)]">{font.font_name}</div>
                    <div className="text-xs text-[var(--text-secondary)] capitalize">
                      {font.font_type}
                      {font.origin && ` • ${font.origin}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/card-designer')}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[var(--accent-blue)] text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              <ExternalLink size={18} />
              <span>Open in Designer</span>
            </button>
          </div>
        )}

        {/* Empty State */}
        {(!brand.logo_variants || brand.logo_variants.length === 0) &&
          (!brand.brand_colors || brand.brand_colors.length === 0) &&
          (!brand.brand_fonts || brand.brand_fonts.length === 0) && (
            <div className="text-center py-12">
              <Building2 size={48} className="mx-auto text-[var(--text-tertiary)] mb-3 opacity-30" />
              <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
                No brand assets
              </h3>
              <p className="text-sm text-[var(--text-secondary)]">
                This brand doesn't have any logos, colors, or fonts saved yet
              </p>
            </div>
          )}
      </div>
    </div>
  );
}
