/**
 * Folder Operations Helper
 *
 * Utilities for working with the folder system, including
 * tree building, validation, and common queries.
 */

import { supabase, Folder } from './supabase';

/**
 * Build a hierarchical tree structure from flat folder array
 *
 * @param folders - Flat array of folders
 * @param parentId - ID of parent folder (null for root)
 * @returns Array of folders with nested subfolders
 */
export function buildFolderTree(
  folders: Folder[],
  parentId: string | null = null
): Folder[] {
  const children = folders.filter(
    (folder) => folder.parent_folder_id === parentId
  );

  return children.map((folder) => ({
    ...folder,
    subfolders: buildFolderTree(folders, folder.id),
  }));
}

/**
 * Get all folders for a user (personal + shared) with asset counts
 *
 * @param userId - Clerk user ID
 * @param orgId - Organization ID
 * @returns Promise<Folder[]> - Array of folders with asset counts
 */
export async function getUserFolders(
  userId: string,
  orgId: string
): Promise<Folder[]> {
  // Get folders user created or org-shared folders
  const { data: folders, error } = await supabase
    .from('folders')
    .select('*')
    .eq('organization_id', orgId)
    .or(`created_by.eq.${userId},is_org_shared.eq.true`)
    .order('name');

  if (error) {
    console.error('Error fetching folders:', error);
    throw error;
  }

  // Get asset counts for each folder
  const folderIds = (folders || []).map((f) => f.id);

  if (folderIds.length === 0) {
    return [];
  }

  const { data: assetCounts } = await supabase
    .from('assets')
    .select('folder_id')
    .in('folder_id', folderIds);

  // Count assets per folder
  const counts: Record<string, number> = {};
  (assetCounts || []).forEach((m) => {
    if (m.folder_id) {
      counts[m.folder_id] = (counts[m.folder_id] || 0) + 1;
    }
  });

  // Add counts to folders
  return (folders || []).map((folder) => ({
    ...folder,
    asset_count: counts[folder.id] || 0,
    mockup_count: counts[folder.id] || 0, // Deprecated: kept for backward compatibility
  }));
}

/**
 * Get count of unsorted assets (not in any folder)
 *
 * @param userId - Clerk user ID
 * @param orgId - Organization ID
 * @returns Promise<number> - Count of unsorted assets
 */
export async function getUnsortedAssetCount(
  userId: string,
  orgId: string
): Promise<number> {
  const { count, error } = await supabase
    .from('assets')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .is('folder_id', null);

  if (error) {
    console.error('Error counting unsorted assets:', error);
    return 0;
  }

  return count || 0;
}

/**
 * @deprecated Use getUnsortedAssetCount instead
 */
export const getUnsortedMockupCount = getUnsortedAssetCount;

/**
 * Validate folder name
 *
 * @param name - Folder name to validate
 * @returns Error message or null if valid
 */
export function validateFolderName(name: string): string | null {
  if (!name || name.trim().length === 0) {
    return 'Folder name is required';
  }

  if (name.length > 100) {
    return 'Folder name must be 100 characters or less';
  }

  // Check for invalid characters (optional - could be more permissive)
  const invalidChars = /[<>:"/\\|?*]/;
  if (invalidChars.test(name)) {
    return 'Folder name contains invalid characters';
  }

  return null;
}

/**
 * Get full folder path (breadcrumb trail)
 *
 * @param folderId - ID of the folder
 * @param allFolders - Array of all folders
 * @returns Array of folders from root to target folder
 */
export function getFolderPath(
  folderId: string | null,
  allFolders: Folder[]
): Folder[] {
  if (!folderId) return [];

  const path: Folder[] = [];
  let currentId: string | null = folderId;

  while (currentId) {
    const folder = allFolders.find((f) => f.id === currentId);
    if (!folder) break;

    path.unshift(folder); // Add to beginning
    currentId = folder.parent_folder_id || null;
  }

  return path;
}

/**
 * Check if user can access a folder
 *
 * @param folder - Folder to check
 * @param userId - Clerk user ID
 * @returns boolean - true if user can access
 */
export function canAccessFolder(folder: Folder, userId: string): boolean {
  return folder.created_by === userId || folder.is_org_shared;
}

/**
 * Check if user can edit/delete a folder
 *
 * @param folder - Folder to check
 * @param userId - Clerk user ID
 * @param isAdmin - Whether user is org admin
 * @returns boolean - true if user can edit
 */
export function canEditFolder(
  folder: Folder,
  userId: string,
  isAdmin: boolean
): boolean {
  // User can edit their own folders
  // Admins can edit org-shared folders
  return folder.created_by === userId || (isAdmin && folder.is_org_shared);
}
