'use client';

import { useState } from 'react';
import { CardTemplate } from '@/lib/supabase';
import {
  FileText,
  Calendar,
  HardDrive,
  Download,
  Trash2,
  Edit3,
  Info,
} from 'lucide-react';

interface TemplatePropertiesProps {
  template: CardTemplate | null;
  onDelete?: (id: string) => void;
  onEdit?: (id: string, newName: string) => void;
}

export default function TemplateProperties({
  template,
  onDelete,
  onEdit,
}: TemplatePropertiesProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  if (!template) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-[var(--text-tertiary)] p-6">
        <Info size={48} className="mb-3 opacity-20" />
        <p className="text-sm text-center">
          Select a template to view its properties
        </p>
      </div>
    );
  }

  // Format file size
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  };

  // Handle edit
  const handleEdit = () => {
    setIsEditing(true);
    setEditedName(template.template_name);
  };

  const handleSaveEdit = () => {
    if (editedName.trim() && onEdit) {
      onEdit(template.id, editedName.trim());
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedName('');
  };

  // Handle delete
  const handleDelete = async () => {
    if (!onDelete) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${template.template_name}"? This action cannot be undone.`
    );

    if (confirmed) {
      setIsDeleting(true);
      try {
        await onDelete(template.id);
      } catch (error) {
        console.error('Failed to delete template:', error);
        setIsDeleting(false);
      }
    }
  };

  // Handle download
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = template.template_url;
    link.download = template.template_name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="h-full flex flex-col p-6 overflow-y-auto">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
          Properties
        </h3>
        <p className="text-sm text-[var(--text-tertiary)]">
          Template details and actions
        </p>
      </div>

      {/* Template Name - Editable */}
      <div className="mb-6">
        <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide mb-2 block">
          Template Name
        </label>
        {isEditing ? (
          <div className="space-y-2">
            <input
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--border-main)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveEdit}
                className="flex-1 px-3 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
              >
                Save
              </button>
              <button
                onClick={handleCancelEdit}
                className="flex-1 px-3 py-1.5 bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-sm rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium text-[var(--text-primary)] flex-1 break-words">
              {template.template_name}
            </p>
            <button
              onClick={handleEdit}
              className="p-1.5 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded transition-colors"
              title="Edit name"
            >
              <Edit3 size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-[var(--border-main)] mb-6" />

      {/* Details */}
      <div className="space-y-4 mb-6">
        {/* File Type */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileText size={16} className="text-[var(--text-tertiary)]" />
            <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">
              File Type
            </label>
          </div>
          <p className="text-sm text-[var(--text-primary)] ml-6">
            {template.file_type?.toUpperCase() || 'Unknown'}
          </p>
        </div>

        {/* File Size */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <HardDrive size={16} className="text-[var(--text-tertiary)]" />
            <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">
              File Size
            </label>
          </div>
          <p className="text-sm text-[var(--text-primary)] ml-6">
            {formatFileSize(template.file_size)}
          </p>
        </div>

        {/* Upload Date */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Calendar size={16} className="text-[var(--text-tertiary)]" />
            <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">
              Uploaded
            </label>
          </div>
          <p className="text-sm text-[var(--text-primary)] ml-6">
            {formatDate(template.uploaded_date)}
          </p>
        </div>

        {/* Template ID */}
        <div>
          <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide mb-1 block">
            Template ID
          </label>
          <p className="text-xs text-[var(--text-tertiary)] font-mono break-all">
            {template.id}
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-[var(--border-main)] mb-6" />

      {/* Actions */}
      <div className="space-y-2 mt-auto">
        <h4 className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide mb-3">
          Actions
        </h4>

        {/* Download Button */}
        <button
          onClick={handleDownload}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
        >
          <Download size={18} />
          <span>Download</span>
        </button>

        {/* Delete Button */}
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Trash2 size={18} />
          <span>{isDeleting ? 'Deleting...' : 'Delete Template'}</span>
        </button>
      </div>
    </div>
  );
}
