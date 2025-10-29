'use client';

import { useState } from 'react';
import { Save, Download, ExternalLink, Check, Loader2, Trash2 } from 'lucide-react';
import { saveBrand as saveBrandAction } from '@/app/actions/brands';

interface LogoFormat {
  src: string;
  background?: string;
  format: string;
  height?: number;
  width?: number;
  size?: number;
}

interface BrandLogo {
  type: string;
  theme?: string;
  formats: LogoFormat[];
}

interface BrandCardProps {
  logoUrl: string;
  format: string;
  type: string;
  theme?: string;
  width?: number;
  height?: number;
  size?: number;
  background?: string;
  companyName: string;
  domain: string;
  description?: string;
  brandColors?: Array<{ hex: string; type?: string; brightness?: number }>;
  brandFonts?: Array<{ name: string; type?: string; origin?: string }>;
  allLogos?: BrandLogo[]; // Full logos array from Brandfetch to save all variants
  onSaveSuccess?: () => void;
  showToast?: (message: string, type: 'success' | 'error') => void;
  organizationId?: string; // ADDED: Organization ID for multi-tenant support
  // Library mode props
  id?: string;
  isLibraryMode?: boolean;
  isUploaded?: boolean;
  onDelete?: (id: string) => Promise<void>;
}

export default function BrandCard({
  logoUrl,
  format,
  type,
  theme,
  width,
  height,
  size,
  background,
  companyName,
  domain,
  description,
  brandColors,
  brandFonts,
  allLogos,
  onSaveSuccess,
  showToast = () => {},
  organizationId,
  id,
  isLibraryMode = false,
  isUploaded = false,
  onDelete,
}: BrandCardProps) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const saveLogo = async () => {
    setSaving(true);
    try {
      // Validate required fields
      if (!companyName?.trim() || !domain?.trim() || !organizationId) {
        const missingFields = [];
        if (!companyName?.trim()) missingFields.push('company name');
        if (!domain?.trim()) missingFields.push('domain');
        if (!organizationId) missingFields.push('organization');
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      // Call Server Action to save brand
      const result = await saveBrandAction({
        companyName,
        domain,
        description,
        logoUrl,
        allLogos,
        brandColors,
        brandFonts,
        logoType: type,
        logoFormat: format,
        logoTheme: theme,
        logoWidth: width,
        logoHeight: height,
        logoSize: size,
      });

      if (result.error) {
        throw new Error(result.error);
      }

      setSaved(true);
      showToast('Logo saved to library!', 'success');
      if (onSaveSuccess) onSaveSuccess();
    } catch (err) {
      console.error('Full error object:', err);
      let errorMessage = 'Failed to save logo';

      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'object' && err !== null) {
        if ('message' in err) {
          errorMessage = String(err.message);
        } else if ('error' in err) {
          errorMessage = String(err.error);
        } else {
          errorMessage = JSON.stringify(err);
        }
      } else if (typeof err === 'string') {
        errorMessage = err;
      }

      console.error('Error saving logo:', errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setSaving(false);
    }
  };

  const downloadLogo = async () => {
    try {
      const response = await fetch(logoUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${companyName.replace(/\s+/g, '_')}_${type}_${theme || ''}.${format}`.replace(/__/g, '_');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      showToast('Download started', 'success');
    } catch (err) {
      console.error('Download error:', err);
      showToast('Failed to download logo', 'error');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this logo?')) return;

    if (!id || !onDelete) return;

    setDeleting(true);
    try {
      await onDelete(id);
      showToast('Logo deleted', 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete logo';
      showToast(errorMessage, 'error');
    } finally {
      setDeleting(false);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return null;
    return (bytes / 1024).toFixed(1) + ' KB';
  };

  const getFormatColor = (fmt: string) => {
    switch (fmt.toLowerCase()) {
      case 'svg':
        return 'bg-purple-100 text-purple-700';
      case 'png':
        return 'bg-[#e5e7eb] text-[#1f2937]';
      case 'jpg':
      case 'jpeg':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div
      className="relative group bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Logo Preview */}
      <div
        className="h-40 flex items-center justify-center p-4 relative"
        style={{ backgroundColor: background || '#f9fafb' }}
      >
        {isLibraryMode && isUploaded && (
          <div className="absolute top-2 right-2 px-2 py-1 bg-green-500 text-white text-xs font-semibold rounded">
            Uploaded
          </div>
        )}
        <img
          src={logoUrl}
          alt={`${companyName} ${type}`}
          className="max-h-full max-w-full object-contain"
        />
      </div>

      {/* Logo Info */}
      <div className="p-4 space-y-3">
        {/* Type and Format Badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 capitalize">
              {type} {theme && `(${theme})`}
            </span>
          </div>
          <span className={`px-2 py-1 text-xs font-semibold rounded-full uppercase ${getFormatColor(format)}`}>
            {format}
          </span>
        </div>

        {/* Dimensions and Size */}
        <div className="flex items-center gap-3 text-xs text-gray-500">
          {width && height && (
            <span>{width} × {height}px</span>
          )}
          {size && (
            <span>{formatFileSize(size)}</span>
          )}
        </div>

        {/* Action Buttons - Always visible on mobile, hover on desktop */}
        <div className={`flex gap-2 transition-opacity duration-200 ${showActions || saved ? 'opacity-100' : 'md:opacity-0 md:group-hover:opacity-100'}`}>
          {isLibraryMode ? (
            <>
              <button
                onClick={downloadLogo}
                className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium flex items-center justify-center gap-1"
                title="Download"
              >
                <Download className="h-3 w-3" />
                Download
              </button>

              <a
                href={logoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors flex items-center"
                title="Open in new tab"
              >
                <ExternalLink className="h-3 w-3" />
              </a>

              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-3 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                title="Delete"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </>
          ) : (
            <>
              {saved ? (
                <div className="flex-1 px-3 py-2 bg-green-50 text-green-700 rounded-md text-sm font-medium flex items-center justify-center gap-2">
                  <Check className="h-4 w-4" />
                  Saved
                </div>
              ) : (
                <button
                  onClick={saveLogo}
                  disabled={saving}
                  className="flex-1 px-3 py-2 bg-[#374151] text-white rounded-md hover:bg-[#1f2937] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-3 w-3" />
                      Save
                    </>
                  )}
                </button>
              )}

              <button
                onClick={downloadLogo}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                title="Download"
              >
                <Download className="h-4 w-4" />
              </button>

              <a
                href={logoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors flex items-center"
                title="Open original"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </>
          )}
        </div>
      </div>

      {/* Saved indicator badge */}
      {saved && (
        <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
          <Check className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}