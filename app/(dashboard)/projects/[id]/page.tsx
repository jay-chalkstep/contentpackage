'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useOrganization } from '@clerk/nextjs';
import {
  ArrowLeft,
  Briefcase,
  Loader2,
  Calendar,
  Download,
  Trash2,
  ExternalLink,
  Edit2,
  Search,
} from 'lucide-react';
import type { Project, CardMockup } from '@/lib/supabase';
import Toast from '@/components/Toast';

interface ToastMessage {
  message: string;
  type: 'success' | 'error';
  id: number;
}

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { organization } = useOrganization();
  const projectId = params.id as string;

  // State
  const [project, setProject] = useState<Project | null>(null);
  const [mockups, setMockups] = useState<CardMockup[]>([]);
  const [filteredMockups, setFilteredMockups] = useState<CardMockup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { message, type, id }]);
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  useEffect(() => {
    if (organization?.id && projectId) {
      fetchProjectAndMockups();
    }
  }, [organization?.id, projectId]);

  useEffect(() => {
    // Filter mockups by search term
    if (searchTerm) {
      const filtered = mockups.filter((mockup) =>
        mockup.mockup_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredMockups(filtered);
    } else {
      setFilteredMockups(mockups);
    }
  }, [searchTerm, mockups]);

  const fetchProjectAndMockups = async () => {
    if (!organization?.id || !projectId) return;

    setLoading(true);
    try {
      // Fetch project details
      const projectResponse = await fetch(`/api/projects/${projectId}`);
      if (!projectResponse.ok) throw new Error('Failed to fetch project');
      const { project: fetchedProject } = await projectResponse.json();
      setProject(fetchedProject);

      // Fetch project mockups
      const mockupsResponse = await fetch(`/api/projects/${projectId}/mockups`);
      if (!mockupsResponse.ok) throw new Error('Failed to fetch mockups');
      const { mockups: fetchedMockups } = await mockupsResponse.json();
      setMockups(fetchedMockups || []);
    } catch (error) {
      console.error('Error fetching project data:', error);
      showToast('Failed to load project', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMockup = async (mockupId: string) => {
    if (!confirm('Are you sure you want to delete this mockup? This cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/mockups/${mockupId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete mockup');
      }

      await fetchProjectAndMockups();
      showToast('Mockup deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting mockup:', error);
      showToast(
        error instanceof Error ? error.message : 'Failed to delete mockup',
        'error'
      );
    }
  };

  const statusColors = {
    active: 'bg-green-100 text-green-800',
    completed: 'bg-blue-100 text-blue-800',
    archived: 'bg-gray-100 text-gray-800',
  };

  const statusLabels = {
    active: 'Active',
    completed: 'Completed',
    archived: 'Archived',
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Briefcase className="h-16 w-16 text-gray-300 mb-4" />
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Project not found</h2>
        <button
          onClick={() => router.push('/projects')}
          className="text-blue-600 hover:text-blue-700 flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Projects
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Back button */}
          <button
            onClick={() => router.push('/projects')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Projects
          </button>

          {/* Project header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-4">
              {/* Color indicator */}
              <div
                className="w-3 h-3 rounded-full mt-2"
                style={{ backgroundColor: project.color }}
              />

              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
                {project.client_name && (
                  <p className="text-lg text-gray-600 mt-1">{project.client_name}</p>
                )}
                {project.description && (
                  <p className="text-gray-600 mt-2">{project.description}</p>
                )}

                {/* Metadata */}
                <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      statusColors[project.status]
                    }`}
                  >
                    {statusLabels[project.status]}
                  </span>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Created {new Date(project.created_at).toLocaleDateString()}
                  </div>
                  <div>
                    {project.mockup_count || 0}{' '}
                    {project.mockup_count === 1 ? 'mockup' : 'mockups'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search mockups..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Mockups grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredMockups.length === 0 ? (
          <div className="text-center py-16">
            <Briefcase className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No mockups found' : 'No mockups in this project'}
            </h3>
            <p className="text-gray-600">
              {searchTerm
                ? 'Try adjusting your search'
                : 'Assign mockups to this project from the Mockup Library'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredMockups.map((mockup) => (
              <div
                key={mockup.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group"
              >
                {/* Mockup image */}
                <div
                  className="relative aspect-[3/2] bg-gray-100 cursor-pointer"
                  onClick={() => router.push(`/mockups/${mockup.id}`)}
                >
                  {mockup.mockup_image_url ? (
                    <img
                      src={mockup.mockup_image_url}
                      alt={mockup.mockup_name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Briefcase className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Mockup info */}
                <div className="p-4">
                  <h3 className="font-medium text-gray-900 truncate mb-2">
                    {mockup.mockup_name}
                  </h3>

                  {/* Folder info */}
                  {mockup.folder && (
                    <p className="text-xs text-gray-500 mb-3">
                      Folder: {mockup.folder.name}
                    </p>
                  )}

                  {/* Date */}
                  <p className="text-xs text-gray-500 flex items-center gap-1 mb-3">
                    <Calendar className="h-3 w-3" />
                    {new Date(mockup.created_at).toLocaleDateString()}
                  </p>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push(`/mockups/${mockup.id}`)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" />
                      View
                    </button>
                    {mockup.mockup_image_url && (
                      <a
                        href={mockup.mockup_image_url}
                        download
                        className="flex items-center justify-center px-3 py-1.5 text-xs border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                      >
                        <Download className="h-3 w-3" />
                      </a>
                    )}
                    <button
                      onClick={() => handleDeleteMockup(mockup.id)}
                      className="flex items-center justify-center px-3 py-1.5 text-xs border border-red-300 text-red-600 rounded hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Toast notifications */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </div>
  );
}
