'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { Upload, CreditCard, Loader2, X, CheckCircle } from 'lucide-react';

interface TemplateUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TemplateUploadModal({
  isOpen,
  onClose,
  onSuccess,
}: TemplateUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    setError(null);

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid image file (PNG, JPG, SVG, WebP, GIF)');
      return;
    }

    // Validate file size (10MB max for card templates)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeFile = () => {
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    if (!file || !templateName.trim()) {
      setError('Please select a file and enter a template name');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      console.log('=== TEMPLATE UPLOAD DEBUG ===');
      console.log('File:', {
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified,
      });
      console.log('Template Name:', templateName.trim());

      // Create FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('templateName', templateName.trim());

      console.log('FormData created, sending to /api/card-upload...');

      // Upload to API
      const response = await fetch('/api/card-upload', {
        method: 'POST',
        body: formData,
      });

      console.log('Response status:', response.status, response.statusText);
      console.log('Response headers:', {
        'content-type': response.headers.get('content-type'),
        'content-length': response.headers.get('content-length'),
      });

      let data;
      const contentType = response.headers.get('content-type');

      if (contentType?.includes('application/json')) {
        data = await response.json();
        console.log('Response JSON:', data);
      } else {
        const text = await response.text();
        console.log('Response text:', text);
        data = { error: `Non-JSON response: ${text.substring(0, 200)}` };
      }

      if (!response.ok) {
        console.error('❌ Upload failed with status:', response.status);
        console.error('Error data:', data);

        const errorMessage = data.details
          ? `${data.error}: ${data.details}`
          : data.error || `Upload failed with status ${response.status}`;

        throw new Error(errorMessage);
      }

      console.log('✅ Upload successful!');

      // Reset form and close modal
      setFile(null);
      setPreview(null);
      setTemplateName('');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('❌ Upload error (catch block):', error);
      console.error('Error type:', error?.constructor?.name);
      console.error('Error stack:', error instanceof Error ? error.stack : 'N/A');

      setError(error instanceof Error ? error.message : 'Failed to upload card template');
    } finally {
      setUploading(false);
      console.log('=== END TEMPLATE UPLOAD DEBUG ===');
    }
  };

  const handleClose = () => {
    if (!uploading) {
      setFile(null);
      setPreview(null);
      setTemplateName('');
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-[var(--border-main)] px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">
              Upload Card Template
            </h2>
            <p className="text-sm text-[var(--text-tertiary)] mt-1">
              Add a new template to your library
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={uploading}
            className="p-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-lg transition-colors disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Template Name */}
          <div>
            <label htmlFor="template-name" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Template Name <span className="text-red-500">*</span>
            </label>
            <input
              id="template-name"
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="e.g., Visa Gift Card Template, Mastercard Prepaid Design"
              className="w-full px-4 py-2 border border-[var(--border-main)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={uploading}
            />
          </div>

          {/* Drop Zone */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Template File <span className="text-red-500">*</span>
            </label>
            <div
              className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-[var(--border-main)] hover:border-blue-300'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp,image/gif"
                onChange={handleFileInput}
                className="hidden"
                disabled={uploading}
              />

              {preview ? (
                <div className="space-y-4">
                  <div className="relative inline-block">
                    <img
                      src={preview}
                      alt="Card template preview"
                      className="max-h-60 max-w-full mx-auto object-contain rounded-lg shadow-md"
                    />
                    {!uploading && (
                      <button
                        onClick={removeFile}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="text-sm text-[var(--text-secondary)]">
                    {file?.name} ({((file?.size ?? 0) / 1024).toFixed(1)} KB)
                  </div>
                </div>
              ) : (
                <>
                  <CreditCard className="mx-auto h-12 w-12 text-[var(--text-tertiary)]" />
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">
                    Drag and drop your card template here, or{' '}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-blue-500 hover:text-blue-600 font-medium"
                      disabled={uploading}
                    >
                      browse
                    </button>
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)] mt-1">
                    PNG, JPG, SVG, WebP, GIF up to 10MB
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Guidelines */}
          <div className="bg-[var(--bg-secondary)] rounded-lg p-4">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Template Guidelines
            </h3>
            <ul className="text-sm text-[var(--text-secondary)] space-y-1 list-disc list-inside">
              <li>Use high-resolution images of card templates</li>
              <li>Remove any sensitive information before uploading</li>
              <li>Use descriptive names to easily identify templates</li>
              <li>Supported formats: PNG, JPG, SVG, WebP, GIF</li>
              <li>Maximum file size: 10MB</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-[var(--border-main)] px-6 py-4 flex gap-3">
          <button
            onClick={handleUpload}
            disabled={!file || !templateName.trim() || uploading}
            className="flex-1 px-4 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-medium"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Upload Template
              </>
            )}
          </button>
          <button
            onClick={handleClose}
            disabled={uploading}
            className="px-4 py-2.5 bg-[var(--bg-secondary)] text-[var(--text-secondary)] rounded-lg hover:bg-[var(--bg-hover)] transition-colors font-medium disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
