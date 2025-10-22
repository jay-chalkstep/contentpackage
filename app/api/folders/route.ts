import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { getUserFolders, validateFolderName } from '@/lib/folders';

// Mark as dynamic to prevent build-time evaluation
export const dynamic = 'force-dynamic';

/**
 * GET /api/folders
 *
 * Get all folders for the current user (personal + org-shared)
 * with mockup counts
 */
export async function GET(request: NextRequest) {
  try {
    const { userId, orgId } = await getUserContext();

    const folders = await getUserFolders(userId, orgId);

    return NextResponse.json({ folders });
  } catch (error) {
    console.error('Error fetching folders:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch folders' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/folders
 *
 * Create a new folder
 *
 * Body:
 * {
 *   name: string,
 *   parent_folder_id?: string (optional),
 *   is_org_shared?: boolean (optional, admin only)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, orgId } = await getUserContext();

    const body = await request.json();
    const { name, parent_folder_id, is_org_shared } = body;

    // Validate folder name
    const nameError = validateFolderName(name);
    if (nameError) {
      return NextResponse.json({ error: nameError }, { status: 400 });
    }

    // Check if folder with same name already exists for this user
    const { data: existing } = await supabase
      .from('folders')
      .select('id')
      .eq('name', name)
      .eq('created_by', userId)
      .eq('organization_id', orgId)
      .eq('parent_folder_id', parent_folder_id || null)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'A folder with this name already exists in this location' },
        { status: 400 }
      );
    }

    // Create folder
    const { data: folder, error } = await supabase
      .from('folders')
      .insert({
        name,
        created_by: userId,
        organization_id: orgId,
        parent_folder_id: parent_folder_id || null,
        is_org_shared: is_org_shared || false,
      })
      .select()
      .single();

    if (error) {
      console.error('Database error creating folder:', error);

      // Check if this is a depth limit error
      if (error.message.includes('Maximum folder nesting depth')) {
        return NextResponse.json(
          { error: 'Maximum folder nesting depth (5 levels) exceeded' },
          { status: 400 }
        );
      }

      throw error;
    }

    return NextResponse.json({ folder }, { status: 201 });
  } catch (error) {
    console.error('Error creating folder:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to create folder' },
      { status: 500 }
    );
  }
}
