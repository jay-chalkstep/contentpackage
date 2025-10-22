import { NextRequest, NextResponse } from 'next/server';
import { getUserContext, isAdmin } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { validateFolderName } from '@/lib/folders';

// Mark as dynamic to prevent build-time evaluation
export const dynamic = 'force-dynamic';

/**
 * PATCH /api/folders/[id]
 *
 * Update a folder (rename or toggle sharing)
 *
 * Body:
 * {
 *   name?: string (rename folder),
 *   is_org_shared?: boolean (toggle org sharing, admin only)
 * }
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, orgId } = await getUserContext();
    const { id } = await context.params;

    const body = await request.json();
    const { name, is_org_shared } = body;

    // Get the folder to check ownership
    const { data: folder, error: fetchError } = await supabase
      .from('folders')
      .select('*')
      .eq('id', id)
      .eq('organization_id', orgId)
      .single();

    if (fetchError || !folder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    // Check permissions
    const userIsAdmin = await isAdmin();
    const canEdit = folder.created_by === userId || (userIsAdmin && folder.is_org_shared);

    if (!canEdit) {
      return NextResponse.json(
        { error: 'You do not have permission to edit this folder' },
        { status: 403 }
      );
    }

    // Prepare update data
    const updateData: any = {};

    // Handle rename
    if (name !== undefined) {
      const nameError = validateFolderName(name);
      if (nameError) {
        return NextResponse.json({ error: nameError }, { status: 400 });
      }

      // Check for duplicate name
      const { data: existing } = await supabase
        .from('folders')
        .select('id')
        .eq('name', name)
        .eq('created_by', folder.created_by)
        .eq('organization_id', orgId)
        .eq('parent_folder_id', folder.parent_folder_id || null)
        .neq('id', id)
        .single();

      if (existing) {
        return NextResponse.json(
          { error: 'A folder with this name already exists in this location' },
          { status: 400 }
        );
      }

      updateData.name = name;
    }

    // Handle org sharing (admin only)
    if (is_org_shared !== undefined) {
      if (!userIsAdmin) {
        return NextResponse.json(
          { error: 'Only admins can change folder sharing settings' },
          { status: 403 }
        );
      }

      updateData.is_org_shared = is_org_shared;
    }

    // Perform update
    const { data: updatedFolder, error: updateError } = await supabase
      .from('folders')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Database error updating folder:', updateError);
      throw updateError;
    }

    return NextResponse.json({ folder: updatedFolder });
  } catch (error) {
    console.error('Error updating folder:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to update folder' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/folders/[id]
 *
 * Delete a folder
 *
 * Note: Mockups in the folder will have their folder_id set to NULL (unsorted)
 * due to ON DELETE SET NULL constraint
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, orgId } = await getUserContext();
    const { id } = await context.params;

    // Get the folder to check ownership
    const { data: folder, error: fetchError } = await supabase
      .from('folders')
      .select('*')
      .eq('id', id)
      .eq('organization_id', orgId)
      .single();

    if (fetchError || !folder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    // Check permissions
    const userIsAdmin = await isAdmin();
    const canDelete = folder.created_by === userId || (userIsAdmin && folder.is_org_shared);

    if (!canDelete) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this folder' },
        { status: 403 }
      );
    }

    // Delete the folder (cascades to subfolders, mockups set to NULL)
    const { error: deleteError } = await supabase
      .from('folders')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Database error deleting folder:', deleteError);
      throw deleteError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting folder:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to delete folder' },
      { status: 500 }
    );
  }
}
