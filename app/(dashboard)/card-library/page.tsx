'use client';

import { useState, useEffect } from 'react';
import { useOrganization } from '@clerk/nextjs';
import { supabase } from '@/lib/supabase';
import { CardTemplate } from '@/lib/supabase';
import { CreditCard, Download, Trash2, Calendar, FileType, HardDrive, ExternalLink, Search, Loader2 } from 'lucide-react';
import Toast from '@/components/Toast';

interface ToastMessage {
  message: string;
  type: 'success' | 'error';
  id: number;
}

export default function CardLibraryPage() {
  const { organization, isLoaded } = useOrganization();
  const [templates, setTemplates] = useState<CardTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<CardTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now();
    setToasts(prev => [...prev, { message, type, id }]);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  useEffect(() => {
    if (organization?.id) {
      fetchTemplates();
    }
  }, [organization?.id]);

  useEffect(() => {
    // Filter templates based on search term
    if (searchTerm) {
      const filtered = templates.filter(template =>
        template.template_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredTemplates(filtered);
    } else {
      setFilteredTemplates(templates);
    }
  }, [searchTerm, templates]);

  const fetchTemplates = async () => {
    if (!organization?.id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('card_templates')
        .select('*')
        .eq('organization_id', organization.id)
        .order('uploaded_date', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
      setFilteredTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      showToast('Failed to load card templates', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (template: CardTemplate) => {
    if (!confirm(`Are you sure you want to delete "${template.template_name}"?`)) {
      return;
    }

    try {
      // Extract file name from URL
      const urlParts = template.template_url.split('/');
      const fileName = urlParts[urlParts.length - 1];

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('card-templates')
        .remove([fileName]);

      if (storageError) {
        console.error('Storage deletion error:', storageError);
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('card_templates')
        .delete()
        .eq('id', template.id);

      if (dbError) throw dbError;

      showToast('Card template deleted successfully', 'success');
      fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      showToast('Failed to delete card template', 'error');
    }
  };

  const handleDownload = async (template: CardTemplate) => {
    try {
      const response = await fetch(template.template_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${template.template_name}.${template.file_type?.split('/')[1] || 'png'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showToast('Card template downloaded', 'success');
    } catch (error) {
      console.error('Download error:', error);
      showToast('Failed to download card template', 'error');
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    const kb = bytes / 1024;
    const mb = kb / 1024;
    if (mb >= 1) {
      return `${mb.toFixed(2)} MB`;
    }
    return `${kb.toFixed(1)} KB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getFileTypeDisplay = (fileType?: string) => {
    if (!fileType) return 'Unknown';
    const type = fileType.split('/')[1]?.toUpperCase();
    return type || 'Unknown';
  };

  return (
    <>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Card Template Library</h2>
          <p className="text-gray-600">Manage your prepaid card templates</p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search templates..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#374151] focus:border-transparent"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <CreditCard className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No templates found' : 'No card templates uploaded yet'}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm
                ? 'Try adjusting your search terms'
                : 'Upload your first card template to get started'}
            </p>
            {!searchTerm && (
              <a
                href="/card-upload"
                className="inline-flex items-center px-4 py-2 bg-[#374151] text-white rounded-lg hover:bg-[#1f2937] transition-colors"
              >
                Upload Template
              </a>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Card Preview */}
                <div className="aspect-[1.6/1] bg-gray-50 p-4 flex items-center justify-center">
                  <img
                    src={template.template_url}
                    alt={template.template_name}
                    className="max-w-full max-h-full object-contain rounded"
                    onError={(e) => {
                      e.currentTarget.src = '';
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement?.classList.add('bg-gray-100');
                      const icon = document.createElement('div');
                      icon.innerHTML = '<svg class="w-16 h-16 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="12" rx="2" stroke-width="2"/><path d="M3 10h18" stroke-width="2"/></svg>';
                      e.currentTarget.parentElement?.appendChild(icon.firstChild as Node);
                    }}
                  />
                </div>

                {/* Card Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 truncate">
                    {template.template_name}
                  </h3>

                  <div className="space-y-1 text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(template.uploaded_date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileType className="h-4 w-4" />
                      <span>{getFileTypeDisplay(template.file_type)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <HardDrive className="h-4 w-4" />
                      <span>{formatFileSize(template.file_size)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => window.open(template.template_url, '_blank')}
                      className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-1 text-sm"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View
                    </button>
                    <button
                      onClick={() => handleDownload(template)}
                      className="flex-1 px-3 py-2 bg-[#374151] text-white rounded-lg hover:bg-[#1f2937] transition-colors flex items-center justify-center gap-1 text-sm"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </button>
                    <button
                      onClick={() => handleDelete(template)}
                      className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center text-sm"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
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
    </>
  );
}