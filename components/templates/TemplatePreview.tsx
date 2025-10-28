'use client';

import { CardTemplate } from '@/lib/supabase';
import Image from 'next/image';
import { ImageIcon } from 'lucide-react';

interface TemplatePreviewProps {
  template: CardTemplate | null;
}

export default function TemplatePreview({ template }: TemplatePreviewProps) {
  if (!template) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-[var(--text-tertiary)] p-8">
        <ImageIcon size={64} className="mb-4 opacity-20" />
        <p className="text-lg font-medium mb-2">No Template Selected</p>
        <p className="text-sm text-center max-w-md">
          Select a template from the grid to preview it here
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[var(--bg-secondary)] p-6">
      {/* Preview Header */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
          Preview
        </h2>
        <p className="text-sm text-[var(--text-tertiary)]">
          {template.template_name}
        </p>
      </div>

      {/* Image Container - Centered with max size */}
      <div className="flex-1 flex items-center justify-center overflow-auto">
        <div className="relative max-w-full max-h-full">
          <div className="relative bg-white rounded-lg shadow-lg overflow-hidden">
            <Image
              src={template.template_url}
              alt={template.template_name}
              width={800}
              height={450}
              className="max-w-full h-auto"
              unoptimized
              priority
            />
          </div>
        </div>
      </div>

      {/* Quick Info Footer */}
      <div className="mt-4 pt-4 border-t border-[var(--border-main)]">
        <div className="flex items-center justify-between text-sm text-[var(--text-secondary)]">
          <span>
            {template.file_type?.toUpperCase() || 'Unknown format'}
          </span>
          <span>
            {template.file_size
              ? `${(template.file_size / (1024 * 1024)).toFixed(2)} MB`
              : 'Size unknown'}
          </span>
        </div>
      </div>
    </div>
  );
}
