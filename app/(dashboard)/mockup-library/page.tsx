'use client';

import { useState, useEffect } from 'react';
import { useOrganization, useUser } from '@clerk/nextjs';
import { supabase, CardMockup, Folder } from '@/lib/supabase';
import { buildFolderTree, getUnsortedMockupCount } from '@/lib/folders';
import {
  Layers,
  Download,
  Trash2,
  Calendar,
  ExternalLink,
  Search,
  Loader2,
  Copy,
  FolderOpen,
  MoveVertical
} from 'lucide-react';
import Toast from '@/components/Toast';
import FolderTree from '@/components/folders/FolderTree';
import CreateFolderModal from '@/components/folders/CreateFolderModal';
import RenameFolderModal from '@/components/folders/RenameFolderModal';
import DeleteFolderModal from '@/components/folders/DeleteFolderModal';
import FolderSelector from '@/components/folders/FolderSelector';
import { useRouter } from 'next/navigation';

interface ToastMessage {
  message: string;
  type: 'success' | 'error';
  id: number;
}

export default function MockupLibraryPage() {
  const { organization, isLoaded, membership } = useOrganization();
  const { user } = useUser();
  const router = useRouter();

  // Mockup state
  const [mockups, setMockups] = useState<CardMockup[]>([]);
  const [filteredMockups, setFilteredMockups] = useState<CardMockup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Folder state
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [unsortedCount, setUnsortedCount] = useState(0);

  // Modal state
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [showRenameFolderModal, setShowRenameFolderModal] = useState(false);
  const [showDeleteFolderModal, setShowDeleteFolderModal] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [createFolderParentId, setCreateFolderParentId] = useState<string | undefined>();

  // Move mockup state
  const [movingMockupId, setMovingMockupId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const isAdmin = membership?.role === 'org:admin';

  const showToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now();
    setToasts(prev => [...prev, { message, type, id }]);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  useEffect(() => {
    if (organization?.id && user?.id) {
      fetchFolders();
      fetchMockups();
    }
  }, [organization?.id, user?.id]);

  useEffect(() => {
    // Filter mockups based on search term and selected folder
    let filtered = mockups;

    // Filter by folder
    if (selectedFolderId === null) {
      // Show unsorted mockups
      filtered = filtered.filter(m => !m.folder_id);
    } else {
      // Show mockups in selected folder
      filtered = filtered.filter(m => m.folder_id === selectedFolderId);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(mockup =>
        mockup.mockup_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredMockups(filtered);
  }, [searchTerm, mockups, selectedFolderId]);

  const fetchFolders = async () => {
    if (!organization?.id || !user?.id) return;

    try {
      const response = await fetch('/api/folders');
      if (!response.ok) throw new Error('Failed to fetch folders');

      const { folders: fetchedFolders } = await response.json();
      const folderTree = buildFolderTree(fetchedFolders);
      setFolders(folderTree);

      // Get unsorted count
      const count = await getUnsortedMockupCount(user.id, organization.id);
      setUnsortedCount(count);
    } catch (error) {
      console.error('Error fetching folders:', error);
    }
  };

  const fetchMockups = async () => {
    if (!organization?.id) return;

    setLoading(true);
    try {
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
    } catch (error) {
      console.error('Error fetching mockups:', error);
      showToast('Failed to load mockups', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFolder = async (name: string) => {
    if (!organization?.id || !user?.id) return;

    try {
      const response = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          parent_folder_id: createFolderParentId
        })
      });

      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error || 'Failed to create folder');
      }

      showToast('Folder created successfully', 'success');
      fetchFolders();
      setCreateFolderParentId(undefined);
    } catch (error) {
      throw error; // Let modal handle the error
    }
  };

  const handleRenameFolder = async (folderId: string, newName: string) => {
    try {
      const response = await fetch(`/api/folders/${folderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName })
      });

      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error || 'Failed to rename folder');
      }

      showToast('Folder renamed successfully', 'success');
      fetchFolders();
    } catch (error) {
      throw error;
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    try {
      const response = await fetch(`/api/folders/${folderId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error || 'Failed to delete folder');
      }

      showToast('Folder deleted successfully', 'success');

      // If we're viewing the deleted folder, switch to unsorted
      if (selectedFolderId === folderId) {
        setSelectedFolderId(null);
      }

      fetchFolders();
      fetchMockups(); // Refresh mockups as they may have been moved to unsorted
    } catch (error) {
      throw error;
    }
  };

  const handleToggleShare = async (folder: Folder) => {
    if (!isAdmin) {
      showToast('Only admins can share folders', 'error');
      return;
    }

    try {
      const response = await fetch(`/api/folders/${folder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_org_shared: !folder.is_org_shared })
      });

      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error || 'Failed to update folder');
      }

      showToast(
        folder.is_org_shared
          ? 'Folder is now private'
          : 'Folder is now shared with organization',
        'success'
      );
      fetchFolders();
    } catch (error) {
      console.error('Error toggling folder share:', error);
      showToast('Failed to update folder', 'error');
    }
  };

  const handleMoveMockup = async (mockupId: string, targetFolderId: string | null) => {
    try {
      const response = await fetch(`/api/mockups/${mockupId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder_id: targetFolderId })
      });

      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error || 'Failed to move mockup');
      }

      showToast('Mockup moved successfully', 'success');
      fetchMockups();
      fetchFolders(); // Update folder counts
      setMovingMockupId(null);
    } catch (error) {
      console.error('Error moving mockup:', error);
      showToast('Failed to move mockup', 'error');
    }
  };

  const handleDelete = async (mockup: CardMockup) => {
    if (!confirm(`Are you sure you want to delete "${mockup.mockup_name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/mockups/${mockup.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error || 'Failed to delete mockup');
      }

      showToast('Mockup deleted successfully', 'success');
      fetchMockups();
      fetchFolders(); // Update folder counts
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
        organization_id: organization?.id,
        created_by: user?.id,
        folder_id: mockup.folder_id,
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getFolderDisplayName = () => {
    if (selectedFolderId === null) {
      return 'Unsorted Mockups';
    }
    const findFolder = (folderList: Folder[]): Folder | null => {
      for (const folder of folderList) {
        if (folder.id === selectedFolderId) return folder;
        if (folder.subfolders) {
          const found = findFolder(folder.subfolders);
          if (found) return found;
        }
      }
      return null;
    };
    const folder = findFolder(folders);
    return folder?.name || 'Unknown Folder';
  };

  return (
    <>
      <div className="h-full">
        {/* Two-Panel Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
          {/* Left Panel - Folder Tree */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sticky top-4">
              <FolderTree
                folders={folders}
                selectedFolderId={selectedFolderId}
                unsortedCount={unsortedCount}
                onFolderSelect={setSelectedFolderId}
                onCreateFolder={(parentId) => {
                  setCreateFolderParentId(parentId);
                  setShowCreateFolderModal(true);
                }}
                onRenameFolder={(folder) => {
                  setSelectedFolder(folder);
                  setShowRenameFolderModal(true);
                }}
                onDeleteFolder={(folder) => {
                  setSelectedFolder(folder);
                  setShowDeleteFolderModal(true);
                }}
                onToggleShare={handleToggleShare}
                isAdmin={isAdmin}
              />
            </div>
          </div>

          {/* Right Panel - Mockups */}
          <div className="lg:col-span-3">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                    <FolderOpen className="h-8 w-8" />
                    {getFolderDisplayName()}
                  </h2>
                  <p className="text-gray-600 mt-1">
                    {filteredMockups.length} mockup{filteredMockups.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search mockups..."
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
                  {searchTerm ? 'No mockups found' : 'No mockups in this folder'}
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm
                    ? 'Try adjusting your search terms'
                    : 'Start by creating a mockup in the designer'}
                </p>
                <a
                  href="/card-designer"
                  className="inline-flex items-center px-4 py-2 bg-[#374151] text-white rounded-lg hover:bg-[#1f2937] transition-colors"
                >
                  Create Mockup
                </a>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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
                      </div>

                      {/* Move to Folder */}
                      {movingMockupId === mockup.id ? (
                        <div className="mb-3">
                          <label className="text-xs text-gray-600 mb-1 block">Move to folder:</label>
                          <FolderSelector
                            folders={folders}
                            selectedFolderId={mockup.folder_id || null}
                            onSelect={(folderId) => handleMoveMockup(mockup.id, folderId)}
                          />
                          <button
                            onClick={() => setMovingMockupId(null)}
                            className="text-xs text-gray-500 hover:text-gray-700 mt-1"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setMovingMockupId(mockup.id)}
                          className="w-full mb-3 px-3 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 text-sm border border-gray-200"
                        >
                          <MoveVertical className="h-4 w-4" />
                          Move to Folder
                        </button>
                      )}

                      {/* Actions */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => router.push(`/mockups/${mockup.id}`)}
                          className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-1 text-sm font-medium"
                        >
                          <ExternalLink className="h-4 w-4" />
                          View Details
                        </button>
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
                          Copy
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
        </div>
      </div>

      {/* Modals */}
      <CreateFolderModal
        isOpen={showCreateFolderModal}
        onClose={() => {
          setShowCreateFolderModal(false);
          setCreateFolderParentId(undefined);
        }}
        onSubmit={handleCreateFolder}
        parentFolderName={
          createFolderParentId
            ? folders.find(f => f.id === createFolderParentId)?.name
            : undefined
        }
      />

      <RenameFolderModal
        isOpen={showRenameFolderModal}
        folder={selectedFolder}
        onClose={() => {
          setShowRenameFolderModal(false);
          setSelectedFolder(null);
        }}
        onSubmit={handleRenameFolder}
      />

      <DeleteFolderModal
        isOpen={showDeleteFolderModal}
        folder={selectedFolder}
        onClose={() => {
          setShowDeleteFolderModal(false);
          setSelectedFolder(null);
        }}
        onConfirm={handleDeleteFolder}
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
