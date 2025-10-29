'use client';

import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Brand, LogoVariant, BrandColor, BrandFont } from '@/lib/supabase';

interface BrandDetailModalProps {
  brand: Brand;
  isOpen: boolean;
  onClose: () => void;
  onSelectLogo: (logoVariant: LogoVariant) => void;
}

export default function BrandDetailModal({
  brand,
  isOpen,
  onClose,
  onSelectLogo,
}: BrandDetailModalProps) {
  const [selectedLogo, setSelectedLogo] = useState<LogoVariant | null>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Group logo variants by type
  const logosByType: Record<string, LogoVariant[]> = {};
  if (brand.logo_variants) {
    brand.logo_variants.forEach(logo => {
      const type = logo.logo_type || 'other';
      if (!logosByType[type]) {
        logosByType[type] = [];
      }
      logosByType[type].push(logo);
    });
  }

  const handleSelectLogo = (logo: LogoVariant) => {
    setSelectedLogo(logo);
    onSelectLogo(logo);
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end sm:justify-center">
        <div
          className="bg-white w-full sm:w-full max-w-4xl h-screen sm:h-auto sm:max-h-[90vh] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between p-6 border-b border-gray-200 flex-shrink-0">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">{brand.company_name}</h2>
              <p className="text-gray-600 text-sm mt-1">{brand.domain}</p>
              {brand.description && (
                <p className="text-gray-600 mt-2">{brand.description}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            >
              <X className="h-6 w-6 text-gray-600" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {/* Logo Variants */}
            {brand.logo_variants && brand.logo_variants.length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Logo Variants ({brand.logo_variants.length})
                </h3>
                <div className="space-y-6">
                  {Object.entries(logosByType).map(([type, logos]) => (
                    <div key={type}>
                      <h4 className="text-lg font-semibold text-gray-800 mb-3 capitalize">
                        {type} Logos
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {logos.map(logo => (
                          <button
                            key={logo.id}
                            onClick={() => handleSelectLogo(logo)}
                            className="group relative border-2 border-gray-200 rounded-lg overflow-hidden hover:border-blue-500 transition-all hover:shadow-lg"
                          >
                            {/* Preview */}
                            <div className="aspect-square bg-gray-50 flex items-center justify-center p-3">
                              <img
                                src={logo.logo_url}
                                alt={`${brand.company_name} logo`}
                                className="max-h-full max-w-full object-contain"
                              />
                            </div>

                            {/* Info overlay */}
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex flex-col items-center justify-center opacity-0 group-hover:opacity-100">
                              <div className="bg-white px-3 py-1 rounded text-sm font-medium text-gray-900">
                                Select
                              </div>
                            </div>

                            {/* Metadata */}
                            <div className="p-2 bg-white text-xs space-y-1">
                              <p className="font-mono text-gray-700 uppercase">
                                {logo.logo_format}
                              </p>
                              {logo.theme && (
                                <p className="text-gray-600 capitalize">{logo.theme}</p>
                              )}
                              {logo.width && logo.height && (
                                <p className="text-gray-500">
                                  {logo.width} × {logo.height}px
                                </p>
                              )}
                              {logo.file_size && (
                                <p className="text-gray-500">
                                  {(logo.file_size / 1024).toFixed(1)} KB
                                </p>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Brand Colors */}
            {brand.brand_colors && brand.brand_colors.length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Brand Colors ({brand.brand_colors.length})
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {brand.brand_colors.map((color, idx) => (
                    <div key={idx} className="space-y-2">
                      <div
                        className="w-full aspect-square rounded-lg shadow-md border border-gray-200"
                        style={{ backgroundColor: color.hex }}
                      />
                      <div className="text-xs">
                        <p className="font-mono font-semibold text-gray-900">{color.hex}</p>
                        {color.type && (
                          <p className="text-gray-600 capitalize">{color.type}</p>
                        )}
                        {color.brightness && (
                          <p className="text-gray-500">Brightness: {color.brightness}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Brand Fonts */}
            {brand.brand_fonts && brand.brand_fonts.length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Brand Fonts ({brand.brand_fonts.length})
                </h3>
                <div className="space-y-3">
                  {brand.brand_fonts.map((font, idx) => (
                    <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="font-semibold text-gray-900">{font.font_name}</p>
                      <div className="text-sm text-gray-600 mt-2 space-y-1">
                        {font.font_type && <p>Type: {font.font_type}</p>}
                        {font.origin && <p>Origin: {font.origin}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-4 flex-shrink-0 bg-gray-50">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
