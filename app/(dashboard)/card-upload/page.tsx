'use client';

import { useState, useRef, ChangeEvent } from 'react';
import Toast from '@/components/Toast';
import GmailLayout from '@/components/layout/GmailLayout';
import { Upload, CreditCard, Loader2, X, CheckCircle, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ToastMessage {
  message: string;
  type: 'success' | 'error';
  id: number;
}

export default function CardUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const showToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now();
    setToasts(prev => [...prev, { message, type, id }]);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

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
    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      showToast('Please upload a valid image file (PNG, JPG, SVG, WebP, GIF)', 'error');
      return;
    }

    // Validate file size (10MB max for card templates)
    if (file.size > 10 * 1024 * 1024) {
      showToast('File size must be less than 10MB', 'error');
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
      showToast('Please select a file and enter a template name', 'error');
      return;
    }

    setUploading(true);
    try {
      // Create FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('templateName', templateName.trim());

      // Upload to API
      const response = await fetch('/api/card-upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      showToast('Card template uploaded successfully!', 'success');

      // Reset form and redirect
      setTimeout(() => {
        router.push('/card-library');
      }, 1500);
    } catch (error) {
      console.error('Upload error:', error);
      showToast(error instanceof Error ? error.message : 'Failed to upload card template', 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <GmailLayout>
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Upload Card Template</h2>
        <p className="text-gray-600 mb-8">Upload prepaid card templates for future use</p>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
          {/* Template Name */}
          <div>
            <label htmlFor="template-name" className="block text-sm font-medium text-gray-700 mb-2">
              Template Name <span className="text-red-500">*</span>
            </label>
            <input
              id="template-name"
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="e.g., Visa Gift Card Template, Mastercard Prepaid Design"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#374151] focus:border-transparent"
            />
          </div>

          {/* Drop Zone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Template File
            </label>
            <div
              className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? 'border-[#374151] bg-[#f3f4f6]'
                  : 'border-gray-300 hover:border-gray-400'
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
              />

              {preview ? (
                <div className="space-y-4">
                  <div className="relative inline-block">
                    <img
                      src={preview}
                      alt="Card template preview"
                      className="max-h-60 max-w-full mx-auto object-contain rounded-lg shadow-md"
                    />
                    <button
                      onClick={removeFile}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="text-sm text-gray-600">
                    {file?.name} ({((file?.size ?? 0) / 1024).toFixed(1)} KB)
                  </div>
                </div>
              ) : (
                <>
                  <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">
                    Drag and drop your card template here, or{' '}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[#374151] hover:text-[#374151] font-medium"
                    >
                      browse
                    </button>
                  </p>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, SVG, WebP, GIF up to 10MB
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Upload Date Info */}
          <div className="bg-gray-50 rounded-lg p-4 flex items-start gap-3">
            <Calendar className="h-5 w-5 text-gray-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-gray-700">Upload Date</p>
              <p className="text-gray-500">
                The upload date will be automatically recorded as {new Date().toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <button
              onClick={handleUpload}
              disabled={!file || !templateName.trim() || uploading}
              className="flex-1 px-4 py-2 bg-[#374151] text-white rounded-lg hover:bg-[#1f2937] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
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
              onClick={() => router.push('/card-library')}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-[#f3f4f6] rounded-lg p-6">
          <h3 className="text-sm font-semibold text-[#030712] mb-2 flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Card Template Guidelines
          </h3>
          <ul className="text-sm text-[#111827] space-y-1 list-disc list-inside">
            <li>Use high-resolution images of card templates</li>
            <li>Remove any sensitive information before uploading</li>
            <li>Use descriptive names to easily identify templates later</li>
            <li>Supported formats: PNG, JPG, SVG, WebP, GIF</li>
            <li>Maximum file size: 10MB</li>
          </ul>
        </div>
      </div>

      {/* Toast Notifications */}
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </GmailLayout>
  );
}