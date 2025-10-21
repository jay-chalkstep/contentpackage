'use client';

import { useState, useEffect } from 'react';
import { useOrganization } from '@clerk/nextjs';
import { supabase, CardMockup } from '@/lib/supabase';
import {
  Layers,
  Download,
  Trash2,
  Calendar,
  Edit,
  ExternalLink,
  Search,
  Loader2,
  Copy
} from 'lucide-react';
import Toast from '@/components/Toast';
import { useRouter } from 'next/navigation';

interface ToastMessage {
  message: string;
  type: 'success' | 'error';
  id: number;
}

export default function MockupLibraryPage() {
  const { organization, isLoaded } = useOrganization();
  const [mockups, setMockups] = useState<CardMockup[]>([]);
  const [filteredMockups, setFilteredMockups] = useState<CardMockup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const router = useRouter();

  const showToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now();
    setToasts(prev => [...prev, { message, type, id }]);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  useEffect(() => {
    if (organization?.id) {
      fetchMockups();
    }
  }, [organization?.id]);

  useEffect(() => {
    // Filter mockups based on search term
    if (searchTerm) {
      const filtered = mockups.filter(mockup =>
        mockup.mockup_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mockup.logo?.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mockup.template?.template_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredMockups(filtered);
    } else {
      setFilteredMockups(mockups);
    }
  }, [searchTerm, mockups]);

  const fetchMockups = async () => {
    if (!organization?.id) return;

    setLoading(true);
    try {
      // Fetch mockups with joined logo and template data (filtered by organization)
      // Note: logo_id now references logo_variants (formerly logos table)
      const { data, error } = await supabase
        .from('card_mockups')
        .select(`
          *,
          logo:logo_variants!logo_id (
            id,
            logo_url
          ),
          template:card_templates!template_id (
            id,
            template_name,
            template_url
          )
        `)
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMockups(data || []);
      setFilteredMockups(data || []);
    } catch (error) {
      console.error('Error fetching mockups:', error);
      showToast('Failed to load mockups', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (mockup: CardMockup) => {
    if (!confirm(`Are you sure you want to delete "${mockup.mockup_name}"?`)) {
      return;
    }

    try {
      // Extract file name from URL if it exists
      if (mockup.mockup_image_url) {
        const urlParts = mockup.mockup_image_url.split('/');
        const fileName = urlParts[urlParts.length - 1];

        // Delete from storage
        const { error: storageError } = await supabase.storage
          .from('card-mockups')
          .remove([fileName]);

        if (storageError) {
          console.error('Storage deletion error:', storageError);
        }
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('card_mockups')
        .delete()
        .eq('id', mockup.id);

      if (dbError) throw dbError;

      showToast('Mockup deleted successfully', 'success');
      fetchMockups();
    } catch (error) {
      console.error('Error deleting mockup:', error);
      showToast('Failed to delete mockup', 'error');
    }
  };

  const handleDownload = async (mockup: CardMockup) => {
    if (!mockup.mockup_image_url) {
      showToast('No image available for this mockup', 'error');
      return;
    }

    try {
      const response = await fetch(mockup.mockup_image_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${mockup.mockup_name}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showToast('Mockup downloaded', 'success');
    } catch (error) {
      console.error('Download error:', error);
      showToast('Failed to download mockup', 'error');
    }
  };

  const handleDuplicate = async (mockup: CardMockup) => {
    try {
      const newMockup = {
        mockup_name: `${mockup.mockup_name} (Copy)`,
        logo_id: mockup.logo_id,
        template_id: mockup.template_id,
        logo_x: mockup.logo_x,
        logo_y: mockup.logo_y,
        logo_scale: mockup.logo_scale,
        mockup_image_url: mockup.mockup_image_url
      };

      const { error } = await supabase
        .from('card_mockups')
        .insert(newMockup);

      if (error) throw error;

      showToast('Mockup duplicated successfully', 'success');
      fetchMockups();
    } catch (error) {
      console.error('Error duplicating mockup:', error);
      showToast('Failed to duplicate mockup', 'error');
    }
  };

  const handleEdit = (mockup: CardMockup) => {
    // Navigate to designer with mockup data
    router.push(`/card-designer?edit=${mockup.id}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Mockup Library</h2>
          <p className="text-gray-600">View and manage your card mockup designs</p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search mockups, logos, or templates..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#374151] focus:border-transparent"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : filteredMockups.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Layers className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No mockups found' : 'No mockups created yet'}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm
                ? 'Try adjusting your search terms'
                : 'Start by creating your first card mockup'}
            </p>
            {!searchTerm && (
              <a
                href="/card-designer"
                className="inline-flex items-center px-4 py-2 bg-[#374151] text-white rounded-lg hover:bg-[#1f2937] transition-colors"
              >
                Create Mockup
              </a>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMockups.map((mockup) => (
              <div
                key={mockup.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Mockup Preview */}
                <div className="aspect-[1.586/1] bg-gray-50 p-4 flex items-center justify-center">
                  {mockup.mockup_image_url ? (
                    <img
                      src={mockup.mockup_image_url}
                      alt={mockup.mockup_name}
                      className="max-w-full max-h-full object-contain rounded"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 rounded flex items-center justify-center">
                      <Layers className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Mockup Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 truncate">
                    {mockup.mockup_name}
                  </h3>

                  <div className="space-y-1 text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(mockup.created_at)}</span>
                    </div>
                    {mockup.logo && (
                      <div className="truncate">
                        Logo: {mockup.logo.company_name}
                      </div>
                    )}
                    {mockup.template && (
                      <div className="truncate">
                        Template: {mockup.template.template_name}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2">
                    {mockup.mockup_image_url && (
                      <button
                        onClick={() => window.open(mockup.mockup_image_url!, '_blank')}
                        className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-1 text-sm"
                      >
                        <ExternalLink className="h-4 w-4" />
                        View
                      </button>
                    )}
                    <button
                      onClick={() => handleDownload(mockup)}
                      className="px-3 py-2 bg-[#374151] text-white rounded-lg hover:bg-[#1f2937] transition-colors flex items-center justify-center gap-1 text-sm"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </button>
                    <button
                      onClick={() => handleDuplicate(mockup)}
                      className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-1 text-sm"
                    >
                      <Copy className="h-4 w-4" />
                      Duplicate
                    </button>
                    <button
                      onClick={() => handleDelete(mockup)}
                      className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-1 text-sm"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
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