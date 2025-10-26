'use client';

import { useState, useEffect } from 'react';
import { useOrganization, useUser } from '@clerk/nextjs';
import { supabase, CardMockup, Folder, Project } from '@/lib/supabase';
import { buildFolderTree, getUnsortedMockupCount } from '@/lib/folders';
import { useRouter } from 'next/navigation';
import { usePanelContext } from '@/lib/contexts/PanelContext';
import GmailLayout from '@/components/layout/GmailLayout';
import ContextPanel from '@/components/navigation/ContextPanel';
import ListView from '@/components/lists/ListView';
import ListToolbar from '@/components/lists/ListToolbar';
import MockupListItem from '@/components/lists/MockupListItem';
import PreviewArea from '@/components/preview/PreviewArea';
import FolderTree from '@/components/folders/FolderTree';
import Toast from '@/components/Toast';
import CreateFolderModal from '@/components/folders/CreateFolderModal';
import RenameFolderModal from '@/components/folders/RenameFolderModal';
import DeleteFolderModal from '@/components/folders/DeleteFolderModal';
import FolderSelector from '@/components/folders/FolderSelector';
import { Search, Plus, Loader2, Upload, CreditCard } from 'lucide-react';

interface ToastMessage {
  message: string;
  type: 'success' | 'error';
  id: number;
}

export default function MockupLibraryPage() {
  const { organization, isLoaded, membership } = useOrganization();
  const { user } = useUser();
  const router = useRouter();
  const { selectedIds, setSelectedIds, setActiveNav } = usePanelContext();

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

  // Set active nav on mount
  useEffect(() => {
    setActiveNav('library');
  }, [setActiveNav]);

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
          ),
          project:projects (
            id,
            name,
            color
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
      throw error;
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
      fetchFolders();
      fetchMockups(); // Refresh to show relocated mockups
    } catch (error) {
      throw error;
    }
  };

  const handleDeleteMockup = async (mockupId: string) => {
    try {
      const response = await fetch(`/api/mockups/${mockupId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete mockup');
      }

      showToast('Mockup deleted successfully', 'success');
      fetchMockups();
      setSelectedIds(selectedIds.filter(id => id !== mockupId));
    } catch (error) {
      console.error('Error deleting mockup:', error);
      showToast('Failed to delete mockup', 'error');
    }
  };

  const handleMoveMockup = async (mockupId: string, folderId: string | null) => {
    try {
      const response = await fetch(`/api/mockups/${mockupId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder_id: folderId })
      });

      if (!response.ok) {
        throw new Error('Failed to move mockup');
      }

      showToast('Mockup moved successfully', 'success');
      fetchMockups();
      setMovingMockupId(null);
    } catch (error) {
      console.error('Error moving mockup:', error);
      showToast('Failed to move mockup', 'error');
    }
  };

  const handleSelectAll = () => {
    setSelectedIds(filteredMockups.map(m => m.id));
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;

    const confirmDelete = window.confirm(
      `Delete ${selectedIds.length} mockup(s)? This action cannot be undone.`
    );

    if (!confirmDelete) return;

    for (const id of selectedIds) {
      await handleDeleteMockup(id);
    }
  };

  // Context Panel Content (Folders)
  const contextPanelContent = (
    <div className="p-4 space-y-4">
      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
        <input
          type="text"
          placeholder="Search mockups..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm border border-[var(--border-main)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]"
        />
      </div>

      {/* Upload Buttons */}
      <div className="space-y-2">
        {/* Upload Logo - Available to all users */}
        <button
          onClick={() => router.push('/upload')}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm bg-[var(--accent-blue)] text-white hover:opacity-90 rounded-lg transition-opacity"
        >
          <Upload size={16} />
          <span>Upload Logo</span>
        </button>

        {/* Upload Template - Admin only */}
        {isAdmin && (
          <button
            onClick={() => router.push('/card-upload')}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm bg-[var(--accent-purple)] text-white hover:opacity-90 rounded-lg transition-opacity"
          >
            <CreditCard size={16} />
            <span>Upload Template</span>
          </button>
        )}
      </div>

      {/* Create Folder Button */}
      <button
        onClick={() => setShowCreateFolderModal(true)}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--accent-blue)] hover:bg-[var(--bg-hover)] rounded-lg transition-colors"
      >
        <Plus size={16} />
        <span>New Folder</span>
      </button>

      {/* Folder Tree */}
      <div className="border-t border-[var(--border-main)] pt-4">
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
          isAdmin={isAdmin}
        />
      </div>
    </div>
  );

  // List View with Toolbar
  const listViewContent = (
    <ListView
      items={filteredMockups}
      renderItem={(mockup, index, isSelected) => (
        <MockupListItem
          key={mockup.id}
          mockup={mockup}
          isSelected={isSelected}
          onToggleSelect={() => {
            setSelectedIds((prev: string[]) =>
              prev.includes(mockup.id)
                ? prev.filter((id: string) => id !== mockup.id)
                : [...prev, mockup.id]
            );
          }}
        />
      )}
      itemHeight={72}
      loading={loading}
      emptyMessage={
        selectedFolderId === null
          ? 'No unsorted mockups'
          : 'No mockups in this folder'
      }
      toolbar={
        <ListToolbar
          totalCount={filteredMockups.length}
          onSelectAll={handleSelectAll}
          onClearSelection={handleClearSelection}
          onDelete={handleDeleteSelected}
          onMove={() => {
            if (selectedIds.length > 0) {
              setMovingMockupId(selectedIds[0]);
            }
          }}
        />
      }
    />
  );

  // Preview Area Content
  const previewContent = selectedIds.length === 1 ? (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {(() => {
          const mockup = mockups.find(m => m.id === selectedIds[0]);
          if (!mockup) return <div>Mockup not found</div>;

          return (
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
                {mockup.mockup_name}
              </h1>

              {mockup.mockup_image_url && (
                <div className="bg-[var(--bg-primary)] rounded-lg p-4 mb-4">
                  <img
                    src={mockup.mockup_image_url}
                    alt={mockup.mockup_name}
                    className="w-full max-w-2xl mx-auto rounded shadow-lg"
                  />
                </div>
              )}

              <div className="space-y-2 text-sm">
                <div className="flex gap-2">
                  <span className="text-[var(--text-secondary)]">Project:</span>
                  <span className="text-[var(--text-primary)] font-medium">
                    {mockup.project?.name || 'No project'}
                  </span>
                </div>

                <div className="mt-4">
                  <button
                    onClick={() => router.push(`/mockups/${mockup.id}`)}
                    className="px-4 py-2 bg-[var(--accent-blue)] text-white rounded-lg hover:opacity-90 transition-opacity"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  ) : null;

  return (
    <>
      <GmailLayout
        contextPanel={contextPanelContent}
        listView={listViewContent}
        previewArea={<PreviewArea>{previewContent}</PreviewArea>}
      />

      {/* Modals */}
      {showCreateFolderModal && (
        <CreateFolderModal
          isOpen={showCreateFolderModal}
          onClose={() => {
            setShowCreateFolderModal(false);
            setCreateFolderParentId(undefined);
          }}
          onSubmit={handleCreateFolder}
        />
      )}

      {showRenameFolderModal && selectedFolder && (
        <RenameFolderModal
          isOpen={showRenameFolderModal}
          folder={selectedFolder}
          onClose={() => {
            setShowRenameFolderModal(false);
            setSelectedFolder(null);
          }}
          onSubmit={handleRenameFolder}
        />
      )}

      {showDeleteFolderModal && selectedFolder && (
        <DeleteFolderModal
          isOpen={showDeleteFolderModal}
          folder={selectedFolder}
          onClose={() => {
            setShowDeleteFolderModal(false);
            setSelectedFolder(null);
          }}
          onConfirm={handleDeleteFolder}
        />
      )}

      {movingMockupId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Move Mockup</h3>
            <FolderSelector
              folders={folders}
              selectedFolderId={null}
              onSelect={(folderId) => {
                handleMoveMockup(movingMockupId, folderId);
              }}
            />
            <button
              onClick={() => setMovingMockupId(null)}
              className="mt-4 w-full px-4 py-2 border border-[var(--border-main)] rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
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
    </>
  );
}
