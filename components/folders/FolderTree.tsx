'use client';

import { useState } from 'react';
import { Folder as FolderType } from '@/lib/supabase';
import {
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  MoreVertical,
  Plus,
  Edit2,
  Trash2,
  Share2,
  Inbox
} from 'lucide-react';

interface FolderTreeProps {
  folders: FolderType[];
  selectedFolderId: string | null;
  unsortedCount: number;
  onFolderSelect: (folderId: string | null) => void;
  onCreateFolder: (parentId?: string) => void;
  onRenameFolder: (folder: FolderType) => void;
  onDeleteFolder: (folder: FolderType) => void;
  onToggleShare?: (folder: FolderType) => void;
  isAdmin?: boolean;
}

interface FolderNodeProps {
  folder: FolderType;
  level: number;
  isSelected: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onSelect: () => void;
  onAction: (action: 'create' | 'rename' | 'delete' | 'share', folder: FolderType) => void;
  children?: React.ReactNode;
  isAdmin?: boolean;
}

function FolderNode({
  folder,
  level,
  isSelected,
  isExpanded,
  onToggle,
  onSelect,
  onAction,
  children,
  isAdmin
}: FolderNodeProps) {
  const [showMenu, setShowMenu] = useState(false);

  const hasChildren = folder.subfolders && folder.subfolders.length > 0;

  return (
    <div>
      <div
        className={`
          flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer
          hover:bg-gray-100 transition-colors group relative
          ${isSelected ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}
        `}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
      >
        {/* Expand/Collapse Icon */}
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className="p-0.5 hover:bg-gray-200 rounded"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        ) : (
          <div className="w-5" />
        )}

        {/* Folder Icon */}
        <button
          onClick={onSelect}
          className="flex items-center gap-2 flex-1 min-w-0"
        >
          {isExpanded ? (
            <FolderOpen className="h-4 w-4 flex-shrink-0" />
          ) : (
            <Folder className="h-4 w-4 flex-shrink-0" />
          )}

          <span className="text-sm font-medium truncate flex-1 text-left">
            {folder.name}
          </span>

          {/* Shared Badge */}
          {folder.is_org_shared && (
            <span title="Shared with organization">
              <Share2 className="h-3 w-3 text-blue-500 flex-shrink-0" />
            </span>
          )}

          {/* Count Badge */}
          {(folder.mockup_count || 0) > 0 && (
            <span className="text-xs text-gray-500 flex-shrink-0">
              {folder.mockup_count}
            </span>
          )}
        </button>

        {/* Actions Menu */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1 opacity-0 group-hover:opacity-100 hover:bg-gray-200 rounded transition-opacity"
          >
            <MoreVertical className="h-4 w-4" />
          </button>

          {showMenu && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />

              {/* Menu */}
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[160px]">
                <button
                  onClick={() => {
                    onAction('create', folder);
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  New Subfolder
                </button>
                <button
                  onClick={() => {
                    onAction('rename', folder);
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                >
                  <Edit2 className="h-4 w-4" />
                  Rename
                </button>
                {isAdmin && (
                  <button
                    onClick={() => {
                      onAction('share', folder);
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Share2 className="h-4 w-4" />
                    {folder.is_org_shared ? 'Make Private' : 'Share with Org'}
                  </button>
                )}
                <button
                  onClick={() => {
                    onAction('delete', folder);
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2 border-t border-gray-100"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>{children}</div>
      )}
    </div>
  );
}

export default function FolderTree({
  folders,
  selectedFolderId,
  unsortedCount,
  onFolderSelect,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onToggleShare,
  isAdmin = false
}: FolderTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const handleAction = (action: 'create' | 'rename' | 'delete' | 'share', folder: FolderType) => {
    switch (action) {
      case 'create':
        onCreateFolder(folder.id);
        break;
      case 'rename':
        onRenameFolder(folder);
        break;
      case 'delete':
        onDeleteFolder(folder);
        break;
      case 'share':
        if (onToggleShare) {
          onToggleShare(folder);
        }
        break;
    }
  };

  const renderFolderTree = (folderList: FolderType[], level: number = 0): React.ReactNode => {
    return folderList.map((folder) => (
      <FolderNode
        key={folder.id}
        folder={folder}
        level={level}
        isSelected={selectedFolderId === folder.id}
        isExpanded={expandedFolders.has(folder.id)}
        onToggle={() => toggleFolder(folder.id)}
        onSelect={() => onFolderSelect(folder.id)}
        onAction={handleAction}
        isAdmin={isAdmin}
      >
        {folder.subfolders && folder.subfolders.length > 0 &&
          renderFolderTree(folder.subfolders, level + 1)}
      </FolderNode>
    ));
  };

  // Separate folders by ownership
  const myFolders = folders.filter(f => !f.is_org_shared && !f.parent_folder_id);
  const sharedFolders = folders.filter(f => f.is_org_shared && !f.parent_folder_id);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between px-2">
        <h3 className="text-sm font-semibold text-gray-900">Folders</h3>
        <button
          onClick={() => onCreateFolder()}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          title="Create new folder"
        >
          <Plus className="h-4 w-4 text-gray-600" />
        </button>
      </div>

      {/* Unsorted Mockups */}
      <button
        onClick={() => onFolderSelect(null)}
        className={`
          w-full flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer
          hover:bg-gray-100 transition-colors
          ${selectedFolderId === null ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}
        `}
      >
        <Inbox className="h-4 w-4 flex-shrink-0" />
        <span className="text-sm font-medium flex-1 text-left">Unsorted</span>
        {unsortedCount > 0 && (
          <span className="text-xs text-gray-500">{unsortedCount}</span>
        )}
      </button>

      {/* My Folders */}
      {myFolders.length > 0 && (
        <div>
          <div className="px-2 mb-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              My Folders
            </p>
          </div>
          {renderFolderTree(myFolders)}
        </div>
      )}

      {/* Shared Folders */}
      {sharedFolders.length > 0 && (
        <div>
          <div className="px-2 mb-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Shared
            </p>
          </div>
          {renderFolderTree(sharedFolders)}
        </div>
      )}

      {/* Empty State */}
      {myFolders.length === 0 && sharedFolders.length === 0 && (
        <div className="px-2 py-4 text-center">
          <p className="text-sm text-gray-500 mb-2">No folders yet</p>
          <button
            onClick={() => onCreateFolder()}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Create your first folder
          </button>
        </div>
      )}
    </div>
  );
}
