'use client';

import { useState } from 'react';
import { Save, Download, ExternalLink, Check, Loader2, MoreVertical } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface LogoCardProps {
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
  brandColors?: Array<{ hex: string; type: string }>;
  onSaveSuccess?: () => void;
  showToast?: (message: string, type: 'success' | 'error') => void;
}

export default function LogoCard({
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
  brandColors,
  onSaveSuccess,
  showToast = () => {},
}: LogoCardProps) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const saveLogo = async () => {
    setSaving(true);
    try {
      // Check if logo already exists
      const { data: existing } = await supabase
        .from('logos')
        .select('id')
        .eq('logo_url', logoUrl)
        .single();

      if (existing) {
        showToast('Logo already saved in library', 'error');
        setSaved(true);
        return;
      }

      const logoData = {
        company_name: companyName,
        domain: domain,
        logo_url: logoUrl,
        logo_type: format,
        logo_format: type,
        background_color: brandColors?.find(c => c.type === 'brand')?.hex,
        accent_color: brandColors?.find(c => c.type === 'accent')?.hex,
      };

      const { error } = await supabase
        .from('logos')
        .insert([logoData]);

      if (error) throw error;

      setSaved(true);
      showToast('Logo saved to library!', 'success');
      if (onSaveSuccess) onSaveSuccess();
    } catch (err) {
      console.error('Save error:', err);
      showToast('Failed to save logo', 'error');
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

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return null;
    return (bytes / 1024).toFixed(1) + ' KB';
  };

  const getFormatColor = (fmt: string) => {
    switch (fmt.toLowerCase()) {
      case 'svg':
        return 'bg-purple-100 text-purple-700';
      case 'png':
        return 'bg-blue-100 text-blue-700';
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
        className="h-40 flex items-center justify-center p-4"
        style={{ backgroundColor: background || '#f9fafb' }}
      >
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
          {saved ? (
            <div className="flex-1 px-3 py-2 bg-green-50 text-green-700 rounded-md text-sm font-medium flex items-center justify-center gap-2">
              <Check className="h-4 w-4" />
              Saved
            </div>
          ) : (
            <button
              onClick={saveLogo}
              disabled={saving}
              className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center justify-center gap-2"
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