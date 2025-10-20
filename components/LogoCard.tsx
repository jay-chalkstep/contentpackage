'use client';

import { useState } from 'react';
import { Save, Download, ExternalLink, Check, Loader2, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

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
  description?: string;
  brandColors?: Array<{ hex: string; type?: string; brightness?: number }>;
  brandFonts?: Array<{ name: string; type?: string; origin?: string }>;
  allLogos?: BrandLogo[]; // Full logos array from Brandfetch to save all variants
  onSaveSuccess?: () => void;
  showToast?: (message: string, type: 'success' | 'error') => void;
  // Library mode props
  id?: string;
  isLibraryMode?: boolean;
  isUploaded?: boolean;
  onDelete?: (id: string) => Promise<void>;
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
  description,
  brandColors,
  brandFonts,
  allLogos,
  onSaveSuccess,
  showToast = () => {},
  id,
  isLibraryMode = false,
  isUploaded = false,
  onDelete,
}: LogoCardProps) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const saveLogo = async () => {
    setSaving(true);
    try {
      // Validate required fields
      if (!companyName?.trim() || !domain?.trim()) {
        const missingFields = [];
        if (!companyName?.trim()) missingFields.push('company name');
        if (!domain?.trim()) missingFields.push('domain');
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      // Step 1: Check if brand exists or create it
      console.log('Step 1: Checking for existing brand with domain:', domain);
      const { data: existingBrands, error: fetchError } = await supabase
        .from('brands')
        .select('id')
        .eq('domain', domain)
        .single();

      console.log('Brand check result:', { existingBrands, fetchError });

      let brandId: string;

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 = not found, which is fine
        console.error('Brand fetch error:', fetchError);
        throw fetchError;
      }

      if (existingBrands) {
        // Brand exists, use it
        brandId = existingBrands.id;
      } else {
        // Create new brand
        const { data: newBrand, error: createError } = await supabase
          .from('brands')
          .insert([{
            company_name: companyName,
            domain: domain,
            description: description || null,
          }])
          .select()
          .single();

        if (createError) {
          console.error('Error creating brand:', createError);
          throw createError;
        }

        if (!newBrand?.id) {
          throw new Error('Failed to create brand');
        }

        brandId = newBrand.id;
      }

      // Step 2: Insert logo variants (all if allLogos provided, otherwise just this one)
      const variantsToInsert = [];
      let clickedLogoId: string | null = null;

      console.log('Step 2: Preparing logo variants. allLogos provided?', !!allLogos, 'Count:', allLogos?.length);

      if (allLogos && allLogos.length > 0) {
        // Save ALL logo variants from Brandfetch
        for (const logoGroup of allLogos) {
          for (const logoFormat of logoGroup.formats) {
            const variantData = {
              brand_id: brandId,
              logo_url: logoFormat.src,
              logo_type: logoGroup.type,
              logo_format: logoFormat.format,
              theme: logoGroup.theme,
              width: logoFormat.width,
              height: logoFormat.height,
              file_size: logoFormat.size,
              background_color: logoFormat.background || brandColors?.find(c => c.type === 'brand')?.hex,
              accent_color: brandColors?.find(c => c.type === 'accent')?.hex,
            };
            variantsToInsert.push(variantData);
          }
        }
        console.log('Prepared', variantsToInsert.length, 'logo variants for bulk insert');
      } else {
        // Fallback: Save only the clicked logo
        variantsToInsert.push({
          brand_id: brandId,
          logo_url: logoUrl,
          logo_type: type,
          logo_format: format,
          theme: theme,
          width: width,
          height: height,
          file_size: size,
          background_color: brandColors?.find(c => c.type === 'brand')?.hex,
          accent_color: brandColors?.find(c => c.type === 'accent')?.hex,
        });
      }

      // Insert all variants in bulk
      console.log('Inserting', variantsToInsert.length, 'logo variants...');
      const { data: insertedVariants, error: variantError } = await supabase
        .from('logo_variants')
        .insert(variantsToInsert)
        .select();

      console.log('Insert result:', { insertedCount: insertedVariants?.length, variantError });

      if (variantError) {
        console.error('Variant insert error:', variantError);
        throw variantError;
      }

      if (!insertedVariants || insertedVariants.length === 0) {
        throw new Error('Failed to insert logo variants');
      }

      // Find the ID of the clicked logo (the one that matches current logoUrl)
      const clickedVariant = insertedVariants.find(v => v.logo_url === logoUrl);
      clickedLogoId = clickedVariant?.id || insertedVariants[0].id;

      // Step 3: Set clicked logo as primary logo variant
      const { data: brand } = await supabase
        .from('brands')
        .select('primary_logo_variant_id')
        .eq('id', brandId)
        .single();

      if (!brand?.primary_logo_variant_id && clickedLogoId) {
        await supabase
          .from('brands')
          .update({ primary_logo_variant_id: clickedLogoId })
          .eq('id', brandId);
      }

      // Step 4: Insert brand colors (only once per brand)
      if (brandColors && brandColors.length > 0) {
        // Check if colors already exist for this brand
        const { data: existingColors } = await supabase
          .from('brand_colors')
          .select('id')
          .eq('brand_id', brandId)
          .limit(1);

        if (!existingColors || existingColors.length === 0) {
          // Colors don't exist yet, insert them
          const colorInserts = brandColors.map(color => ({
            brand_id: brandId,
            hex: color.hex,
            type: color.type,
            brightness: color.brightness,
          }));

          const { error: colorError } = await supabase
            .from('brand_colors')
            .insert(colorInserts);

          if (colorError) {
            console.debug('Error saving colors:', colorError);
            // Don't throw - colors are secondary data
          }
        }
      }

      // Step 5: Insert brand fonts (only once per brand)
      if (brandFonts && brandFonts.length > 0) {
        // Check if fonts already exist for this brand
        const { data: existingFonts } = await supabase
          .from('brand_fonts')
          .select('id')
          .eq('brand_id', brandId)
          .limit(1);

        if (!existingFonts || existingFonts.length === 0) {
          // Fonts don't exist yet, insert them
          const fontInserts = brandFonts.map(font => ({
            brand_id: brandId,
            font_name: font.name,
            font_type: font.type,
            origin: font.origin,
          }));

          const { error: fontError } = await supabase
            .from('brand_fonts')
            .insert(fontInserts);

          if (fontError) {
            console.debug('Error saving fonts:', fontError);
            // Don't throw - fonts are secondary data
          }
        }
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