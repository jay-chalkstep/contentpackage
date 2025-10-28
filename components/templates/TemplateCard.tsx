'use client';

import { CardTemplate } from '@/lib/supabase';
import { FileType, CalendarDays } from 'lucide-react';
import Image from 'next/image';

interface TemplateCardProps {
  template: CardTemplate;
  isSelected?: boolean;
  onClick?: () => void;
}

export default function TemplateCard({ template, isSelected, onClick }: TemplateCardProps) {
  // Format file size
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  // Get file type display
  const getFileTypeDisplay = (fileType?: string): string => {
    if (!fileType) return 'Unknown';
    return fileType.toUpperCase();
  };

  return (
    <div
      onClick={onClick}
      className={`
        group relative bg-white rounded-lg border-2 transition-all cursor-pointer
        overflow-hidden hover:shadow-md
        ${isSelected
          ? 'border-blue-500 shadow-md ring-2 ring-blue-100'
          : 'border-[var(--border-main)] hover:border-blue-300'
        }
      `}
    >
      {/* Template Image */}
      <div className="aspect-[16/9] bg-[var(--bg-secondary)] relative overflow-hidden">
        <Image
          src={template.template_url}
          alt={template.template_name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover group-hover:scale-105 transition-transform duration-200"
          unoptimized
        />

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />

        {/* Selected indicator */}
        {isSelected && (
          <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>

      {/* Template Info */}
      <div className="p-3">
        {/* Template Name */}
        <h3 className="font-medium text-sm text-[var(--text-primary)] truncate mb-2">
          {template.template_name}
        </h3>

        {/* Metadata */}
        <div className="flex items-center gap-3 text-xs text-[var(--text-tertiary)]">
          {/* File Type */}
          <div className="flex items-center gap-1">
            <FileType size={12} />
            <span>{getFileTypeDisplay(template.file_type)}</span>
          </div>

          {/* File Size */}
          <div className="flex items-center gap-1">
            <span>{formatFileSize(template.file_size)}</span>
          </div>
        </div>

        {/* Upload Date */}
        <div className="flex items-center gap-1 text-xs text-[var(--text-tertiary)] mt-1">
          <CalendarDays size={12} />
          <span>{formatDate(template.uploaded_date)}</span>
        </div>
      </div>
    </div>
  );
}
