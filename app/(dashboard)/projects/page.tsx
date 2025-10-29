'use client';

import { useState, useEffect } from 'react';
import { useOrganization, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Plus, Search } from 'lucide-react';
import type { Project, ProjectStatus } from '@/lib/supabase';
import { usePanelContext } from '@/lib/contexts/PanelContext';
import GmailLayout from '@/components/layout/GmailLayout';
import ListView from '@/components/lists/ListView';
import ListToolbar from '@/components/lists/ListToolbar';
import ProjectListItem from '@/components/lists/ProjectListItem';
import PreviewArea from '@/components/preview/PreviewArea';
import Toast from '@/components/Toast';
import NewProjectModal from '@/components/projects/NewProjectModal';
import ProjectMetrics from '@/components/projects/ProjectMetrics';
import ActiveProjectsOverview from '@/components/projects/ActiveProjectsOverview';
import { createProject, deleteProject } from '@/app/actions/projects';

interface ToastMessage {
  message: string;
  type: 'success' | 'error';
  id: number;
}

export default function ProjectsPage() {
  const { organization, isLoaded } = useOrganization();
  const { user } = useUser();
  const router = useRouter();
  const { selectedIds, setSelectedIds, setActiveNav } = usePanelContext();

  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { message, type, id }]);
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  useEffect(() => {
    setActiveNav('projects');
  }, [setActiveNav]);

  useEffect(() => {
    if (organization?.id && user?.id) {
      fetchProjects();
    }
  }, [organization?.id, user?.id]);

  useEffect(() => {
    let filtered = projects;
    if (statusFilter !== 'all') {
      filtered = filtered.filter((p) => p.status === statusFilter);
    }
    if (searchTerm) {
      filtered = filtered.filter(
        (project) =>
          project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          project.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          project.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredProjects(filtered);
  }, [searchTerm, statusFilter, projects]);

  const fetchProjects = async () => {
    if (!organization?.id) return;
    setLoading(true);
    try {
      const response = await fetch('/api/projects');
      if (!response.ok) throw new Error('Failed to fetch projects');
      const { projects: fetchedProjects } = await response.json();
      setProjects(fetchedProjects || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      showToast('Failed to load projects', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (projectData: {
    name: string;
    client_name?: string;
    description?: string;
    status?: ProjectStatus;
    color?: string;
  }) => {
    try {
      const formData = new FormData();
      formData.append('name', projectData.name);
      if (projectData.client_name) formData.append('clientName', projectData.client_name);
      if (projectData.description) formData.append('description', projectData.description);
      if (projectData.color) formData.append('color', projectData.color);

      const result = await createProject(formData);

      if (result.error) {
        throw new Error(result.error);
      }

      await fetchProjects();
      showToast('Project created successfully', 'success');
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    const confirmDelete = window.confirm(
      `Delete ${selectedIds.length} project(s)? Mockups will not be deleted.`
    );
    if (!confirmDelete) return;

    for (const id of selectedIds) {
      try {
        const result = await deleteProject(id);
        if (result.error) throw new Error(result.error);
      } catch (error) {
        console.error('Error deleting project:', error);
        showToast('Failed to delete project', 'error');
      }
    }
    await fetchProjects();
    setSelectedIds([]);
    showToast('Projects deleted successfully', 'success');
  };

  const activeCount = projects.filter((p) => p.status === 'active').length;
  const completedCount = projects.filter((p) => p.status === 'completed').length;
  const archivedCount = projects.filter((p) => p.status === 'archived').length;

  // Context Panel
  const contextPanelContent = (
    <div className="p-4 space-y-4">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
        <input
          type="text"
          placeholder="Search projects..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm border border-[var(--border-main)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]"
        />
      </div>

      <button
        onClick={() => setShowNewProjectModal(true)}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--accent-blue)] hover:bg-[var(--bg-hover)] rounded-lg transition-colors"
      >
        <Plus size={16} />
        <span>New Project</span>
      </button>

      <div className="border-t border-[var(--border-main)] pt-4 space-y-1">
        <button
          onClick={() => setStatusFilter('all')}
          className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${
            statusFilter === 'all' ? 'bg-[var(--bg-selected)] text-[var(--accent-blue)]' : 'hover:bg-[var(--bg-hover)]'
          }`}
        >
          <span>All Projects</span>
          <span className="text-xs">{projects.length}</span>
        </button>
        <button
          onClick={() => setStatusFilter('active')}
          className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${
            statusFilter === 'active' ? 'bg-[var(--bg-selected)] text-[var(--accent-blue)]' : 'hover:bg-[var(--bg-hover)]'
          }`}
        >
          <span>Active</span>
          <span className="text-xs">{activeCount}</span>
        </button>
        <button
          onClick={() => setStatusFilter('completed')}
          className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${
            statusFilter === 'completed' ? 'bg-[var(--bg-selected)] text-[var(--accent-blue)]' : 'hover:bg-[var(--bg-hover)]'
          }`}
        >
          <span>Completed</span>
          <span className="text-xs">{completedCount}</span>
        </button>
        <button
          onClick={() => setStatusFilter('archived')}
          className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${
            statusFilter === 'archived' ? 'bg-[var(--bg-selected)] text-[var(--accent-blue)]' : 'hover:bg-[var(--bg-hover)]'
          }`}
        >
          <span>Archived</span>
          <span className="text-xs">{archivedCount}</span>
        </button>
      </div>
    </div>
  );

  // List View
  const listViewContent = (
    <ListView
      items={filteredProjects}
      renderItem={(project, index, isSelected) => (
        <div
          onClick={() => {
            // Select the project to show metrics in preview panel
            setSelectedIds([project.id]);
          }}
        >
          <ProjectListItem
            key={project.id}
            project={project}
            isSelected={isSelected}
            onToggleSelect={() => {
              setSelectedIds((prev: string[]) =>
                prev.includes(project.id)
                  ? prev.filter((id: string) => id !== project.id)
                  : [...prev, project.id]
              );
            }}
          />
        </div>
      )}
      itemHeight={64}
      loading={loading}
      emptyMessage="No projects found"
      toolbar={
        <ListToolbar
          totalCount={filteredProjects.length}
          onSelectAll={() => setSelectedIds(filteredProjects.map(p => p.id))}
          onClearSelection={() => setSelectedIds([])}
          onDelete={handleDeleteSelected}
        />
      }
    />
  );

  // Preview - Show individual project metrics OR aggregated overview
  const previewContent = selectedIds.length === 1 ? (
    <ProjectMetrics projectId={selectedIds[0]} />
  ) : selectedIds.length === 0 ? (
    <ActiveProjectsOverview statusFilter={statusFilter} />
  ) : null; // Multiple selected = show count

  return (
    <>
      <GmailLayout
        contextPanel={contextPanelContent}
        listView={listViewContent}
        previewArea={<PreviewArea>{previewContent}</PreviewArea>}
      />

      {showNewProjectModal && (
        <NewProjectModal
          isOpen={showNewProjectModal}
          onClose={() => setShowNewProjectModal(false)}
          onSubmit={handleCreateProject}
        />
      )}

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
