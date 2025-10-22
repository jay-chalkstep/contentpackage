import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

// Mark as dynamic to prevent build-time evaluation
export const dynamic = 'force-dynamic';

/**
 * PATCH /api/mockups/[id]
 *
 * Update a mockup (currently just for moving to a folder)
 *
 * Body:
 * {
 *   folder_id?: string | null (move to folder, null for unsorted)
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
    const { folder_id } = body;

    // Get the mockup to check ownership
    const { data: mockup, error: fetchError } = await supabase
      .from('card_mockups')
      .select('*')
      .eq('id', id)
      .eq('organization_id', orgId)
      .single();

    if (fetchError || !mockup) {
      return NextResponse.json({ error: 'Mockup not found' }, { status: 404 });
    }

    // Check if user owns this mockup (or if it's legacy data without created_by)
    if (mockup.created_by && mockup.created_by !== userId) {
      return NextResponse.json(
        { error: 'You do not have permission to modify this mockup' },
        { status: 403 }
      );
    }

    // If moving to a folder, verify the folder exists and user can access it
    if (folder_id) {
      const { data: folder, error: folderError } = await supabase
        .from('folders')
        .select('*')
        .eq('id', folder_id)
        .eq('organization_id', orgId)
        .single();

      if (folderError || !folder) {
        return NextResponse.json(
          { error: 'Target folder not found' },
          { status: 404 }
        );
      }

      // Check if user can access this folder (own folder or org-shared)
      if (folder.created_by !== userId && !folder.is_org_shared) {
        return NextResponse.json(
          { error: 'You do not have access to this folder' },
          { status: 403 }
        );
      }
    }

    // Update mockup folder
    const { data: updatedMockup, error: updateError } = await supabase
      .from('card_mockups')
      .update({ folder_id: folder_id || null })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Database error updating mockup:', updateError);
      throw updateError;
    }

    return NextResponse.json({ mockup: updatedMockup });
  } catch (error) {
    console.error('Error updating mockup:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to update mockup' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/mockups/[id]
 *
 * Delete a mockup
 *
 * Deletes both the database record and the file from storage
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, orgId } = await getUserContext();
    const { id } = await context.params;

    // Get the mockup to check ownership and get file URL
    const { data: mockup, error: fetchError } = await supabase
      .from('card_mockups')
      .select('*')
      .eq('id', id)
      .eq('organization_id', orgId)
      .single();

    if (fetchError || !mockup) {
      return NextResponse.json({ error: 'Mockup not found' }, { status: 404 });
    }

    // Check if user owns this mockup (or if it's legacy data without created_by)
    if (mockup.created_by && mockup.created_by !== userId) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this mockup' },
        { status: 403 }
      );
    }

    // Delete the mockup image from storage
    if (mockup.mockup_image_url) {
      // Extract filename from URL
      // URL format: https://[project].supabase.co/storage/v1/object/public/card-mockups/filename.png
      const url = mockup.mockup_image_url;
      const match = url.match(/\/card-mockups\/([^?]+)/);

      if (match && match[1]) {
        const { error: storageError } = await supabase.storage
          .from('card-mockups')
          .remove([match[1]]);

        if (storageError) {
          console.error('Error deleting storage file:', storageError);
          // Don't fail the whole operation if storage cleanup fails
        }
      }
    }

    // Delete the database record
    const { error: deleteError } = await supabase
      .from('card_mockups')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Database error deleting mockup:', deleteError);
      throw deleteError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting mockup:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to delete mockup' },
      { status: 500 }
    );
  }
}
