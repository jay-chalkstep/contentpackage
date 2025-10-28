'use client';

import { useState, useEffect } from 'react';
import { useOrganization } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { CardTemplate } from '@/lib/supabase';
import FourPanelLayout from '@/components/layout/FourPanelLayout';
import TemplateCard from '@/components/templates/TemplateCard';
import TemplateDetailsPanel from '@/components/templates/TemplateDetailsPanel';
import TemplateUploadModal from '@/components/templates/TemplateUploadModal';
import Toast from '@/components/Toast';
import { Search, Upload, Loader2, LayoutTemplate, Filter } from 'lucide-react';

interface ToastMessage {
  message: string;
  type: 'success' | 'error';
  id: number;
}

export default function AdminTemplatesPage() {
  const { organization, membership } = useOrganization();
  const router = useRouter();

  // State
  const [templates, setTemplates] = useState<CardTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<CardTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<CardTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date');

  // Check if user is admin
  const isAdmin = membership?.role === 'org:admin';

  // Redirect non-admins
  useEffect(() => {
    if (membership && !isAdmin) {
      router.push('/mockup-library');
    }
  }, [membership, isAdmin, router]);

  // Toast functions
  const showToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now();
    setToasts(prev => [...prev, { message, type, id }]);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Fetch templates on mount
  useEffect(() => {
    if (organization?.id && isAdmin) {
      fetchTemplates();
    }
  }, [organization?.id, isAdmin]);

  // Filter and sort templates
  useEffect(() => {
    let filtered = templates;

    // Apply search filter
    if (searchTerm) {
      filtered = templates.filter(template =>
        template.template_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.uploaded_date).getTime() - new Date(a.uploaded_date).getTime();
      } else {
        return a.template_name.localeCompare(b.template_name);
      }
    });

    setFilteredTemplates(filtered);
  }, [searchTerm, templates, sortBy]);

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

      // Select first template if available
      if (data && data.length > 0 && !selectedTemplate) {
        setSelectedTemplate(data[0]);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      showToast('Failed to load card templates', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      // Find template
      const template = templates.find(t => t.id === id);
      if (!template) return;

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
        .eq('id', id);

      if (dbError) throw dbError;

      showToast('Template deleted successfully', 'success');

      // Clear selection if deleted template was selected
      if (selectedTemplate?.id === id) {
        setSelectedTemplate(null);
      }

      // Refresh templates
      fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      showToast('Failed to delete template', 'error');
    }
  };

  const handleEdit = async (id: string, newName: string) => {
    try {
      const { error } = await supabase
        .from('card_templates')
        .update({ template_name: newName })
        .eq('id', id);

      if (error) throw error;

      showToast('Template name updated successfully', 'success');

      // Update local state
      setTemplates(prev =>
        prev.map(t => (t.id === id ? { ...t, template_name: newName } : t))
      );

      if (selectedTemplate?.id === id) {
        setSelectedTemplate(prev => prev ? { ...prev, template_name: newName } : null);
      }
    } catch (error) {
      console.error('Error updating template:', error);
      showToast('Failed to update template name', 'error');
    }
  };

  const handleUploadSuccess = () => {
    showToast('Template uploaded successfully!', 'success');
    fetchTemplates();
  };

  // Don't render if not admin
  if (!isAdmin) {
    return null;
  }

  // Context Panel
  const contextPanel = (
    <div className="p-4 space-y-4">
      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
        <input
          type="text"
          placeholder="Search templates..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm border border-[var(--border-main)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Upload Button */}
      <button
        onClick={() => setIsUploadModalOpen(true)}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
      >
        <Upload size={18} />
        <span>Upload Template</span>
      </button>

      {/* Divider */}
      <div className="border-t border-[var(--border-main)] pt-4">
        <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-3">
          Sort By
        </h3>
        <div className="space-y-1">
          <button
            onClick={() => setSortBy('date')}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              sortBy === 'date'
                ? 'bg-blue-50 text-blue-600 font-medium'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
            }`}
          >
            Upload Date
          </button>
          <button
            onClick={() => setSortBy('name')}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              sortBy === 'name'
                ? 'bg-blue-50 text-blue-600 font-medium'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
            }`}
          >
            Template Name
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="border-t border-[var(--border-main)] pt-4">
        <div className="text-sm text-[var(--text-secondary)]">
          <div className="flex items-center justify-between mb-2">
            <span>Total Templates</span>
            <span className="font-semibold text-[var(--text-primary)]">{templates.length}</span>
          </div>
          {searchTerm && (
            <div className="flex items-center justify-between">
              <span>Filtered Results</span>
              <span className="font-semibold text-[var(--text-primary)]">{filteredTemplates.length}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Grid Panel
  const gridPanel = (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[var(--border-main)]">
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">
          Template Library
        </h2>
        <p className="text-sm text-[var(--text-tertiary)] mt-1">
          {filteredTemplates.length} {filteredTemplates.length === 1 ? 'template' : 'templates'}
        </p>
      </div>

      {/* Grid Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--text-tertiary)]" />
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <LayoutTemplate size={48} className="text-[var(--text-tertiary)] opacity-20 mb-4" />
            <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
              {searchTerm ? 'No templates found' : 'No templates yet'}
            </h3>
            <p className="text-sm text-[var(--text-tertiary)] max-w-md">
              {searchTerm
                ? 'Try adjusting your search terms'
                : 'Upload your first card template to get started'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Upload Template
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                isSelected={selectedTemplate?.id === template.id}
                onClick={() => setSelectedTemplate(template)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // Combined Details Panel (Preview + Properties)
  const detailsPanel = (
    <TemplateDetailsPanel
      template={selectedTemplate}
      onDelete={handleDelete}
      onEdit={handleEdit}
    />
  );

  return (
    <>
      <FourPanelLayout
        contextPanel={contextPanel}
        gridPanel={gridPanel}
        propertiesPanel={detailsPanel}
        gridWidth="flex"
        propertiesWidth={400}
      />

      {/* Upload Modal */}
      <TemplateUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={handleUploadSuccess}
      />

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
