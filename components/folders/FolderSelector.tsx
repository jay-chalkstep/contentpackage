'use client';

import { useState, useRef, useEffect } from 'react';
import { Folder as FolderType } from '@/lib/supabase';
import {
  Folder,
  ChevronDown,
  Inbox,
  Plus
} from 'lucide-react';

interface FolderSelectorProps {
  folders: FolderType[];
  selectedFolderId: string | null;
  onSelect: (folderId: string | null) => void;
  onCreateFolder?: () => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function FolderSelector({
  folders,
  selectedFolderId,
  onSelect,
  onCreateFolder,
  placeholder = 'Select folder...',
  disabled = false
}: FolderSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const selectedFolder = folders.find(f => f.id === selectedFolderId);

  // Flatten folder tree for display
  const flattenFolders = (folderList: FolderType[], level: number = 0): Array<FolderType & { level: number }> => {
    let result: Array<FolderType & { level: number }> = [];

    folderList.forEach(folder => {
      result.push({ ...folder, level });
      if (folder.subfolders && folder.subfolders.length > 0) {
        result = result.concat(flattenFolders(folder.subfolders, level + 1));
      }
    });

    return result;
  };

  const flatFolders = flattenFolders(folders);

  const handleSelect = (folderId: string | null) => {
    onSelect(folderId);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:bg-gray-50 flex items-center justify-between gap-2 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {selectedFolderId === null ? (
            <>
              <Inbox className="h-4 w-4 text-gray-500 flex-shrink-0" />
              <span className="text-gray-900 truncate">Unsorted</span>
            </>
          ) : selectedFolder ? (
            <>
              <Folder className="h-4 w-4 text-gray-500 flex-shrink-0" />
              <span className="text-gray-900 truncate">{selectedFolder.name}</span>
            </>
          ) : (
            <span className="text-gray-500 truncate">{placeholder}</span>
          )}
        </div>
        <ChevronDown className={`h-4 w-4 text-gray-500 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
          {/* Unsorted Option */}
          <button
            type="button"
            onClick={() => handleSelect(null)}
            className={`w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 ${
              selectedFolderId === null ? 'bg-blue-50 text-blue-700' : ''
            }`}
          >
            <Inbox className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm">Unsorted</span>
          </button>

          {/* Divider */}
          {flatFolders.length > 0 && (
            <div className="border-t border-gray-100" />
          )}

          {/* Folders */}
          {flatFolders.map(folder => (
            <button
              key={folder.id}
              type="button"
              onClick={() => handleSelect(folder.id)}
              className={`w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 ${
                selectedFolderId === folder.id ? 'bg-blue-50 text-blue-700' : ''
              }`}
              style={{ paddingLeft: `${12 + folder.level * 16}px` }}
            >
              <Folder className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm truncate">{folder.name}</span>
              {folder.is_org_shared && (
                <span className="text-xs text-gray-500">(Shared)</span>
              )}
            </button>
          ))}

          {/* Create Folder Option */}
          {onCreateFolder && (
            <>
              <div className="border-t border-gray-100" />
              <button
                type="button"
                onClick={() => {
                  onCreateFolder();
                  setIsOpen(false);
                }}
                className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-blue-600"
              >
                <Plus className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm font-medium">Create New Folder</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
