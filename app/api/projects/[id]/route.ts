import { NextRequest, NextResponse } from 'next/server';
import { getUserContext, isAdmin } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import type { ProjectStatus } from '@/lib/supabase';

// Mark as dynamic to prevent build-time evaluation
export const dynamic = 'force-dynamic';

/**
 * GET /api/projects/[id]
 *
 * Get a single project with mockup count and preview thumbnails
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, orgId } = await getUserContext();
    const { id } = await context.params;

    // Fetch project with workflow JOIN
    const { data: project, error } = await supabase
      .from('projects')
      .select('*, workflows(*)')
      .eq('id', id)
      .eq('organization_id', orgId)
      .single();

    if (error || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Fetch mockup count
    const { count } = await supabase
      .from('card_mockups')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', id)
      .eq('organization_id', orgId);

    // Fetch up to 4 mockup previews
    const { data: mockupPreviews } = await supabase
      .from('card_mockups')
      .select('id, mockup_name, mockup_image_url')
      .eq('project_id', id)
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .limit(4);

    // Rename workflows (table name) to workflow (expected by UI)
    // Supabase may return workflows as an array or object depending on the relationship
    const { workflows, ...projectData } = project;
    const workflowData = Array.isArray(workflows) ? workflows[0] : workflows;

    return NextResponse.json({
      project: {
        ...projectData,
        workflow: workflowData || null, // Rename to match Project interface
        mockup_count: count || 0,
        mockup_previews: mockupPreviews || [],
      },
    });
  } catch (error) {
    console.error('Error fetching project:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/projects/[id]
 *
 * Update a project
 *
 * Body:
 * {
 *   name?: string,
 *   client_name?: string,
 *   description?: string,
 *   status?: 'active' | 'completed' | 'archived',
 *   color?: string
 * }
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, orgId } = await getUserContext();
    const { id } = await context.params;

    // Fetch project to check ownership
    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .eq('organization_id', orgId)
      .single();

    if (fetchError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check permissions - only creator or admin can edit
    const userIsAdmin = await isAdmin();
    const canEdit = project.created_by === userId || userIsAdmin;

    if (!canEdit) {
      return NextResponse.json(
        { error: 'You do not have permission to edit this project' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, client_name, description, status, color, workflow_id } = body;

    // Prepare update data
    const updateData: any = {};

    // Validate and add name
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json(
          { error: 'Project name cannot be empty' },
          { status: 400 }
        );
      }
      if (name.trim().length > 100) {
        return NextResponse.json(
          { error: 'Project name must be less than 100 characters' },
          { status: 400 }
        );
      }
      updateData.name = name.trim();
    }

    // Add client_name (can be null)
    if (client_name !== undefined) {
      updateData.client_name = client_name?.trim() || null;
    }

    // Add description (can be null)
    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    // Validate and add status
    if (status !== undefined) {
      const validStatuses: ProjectStatus[] = ['active', 'completed', 'archived'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status. Must be: active, completed, or archived' },
          { status: 400 }
        );
      }
      updateData.status = status;
    }

    // Validate and add color
    if (color !== undefined) {
      if (!/^#[0-9A-F]{6}$/i.test(color)) {
        return NextResponse.json(
          { error: 'Invalid color format. Must be a hex color (e.g., #3B82F6)' },
          { status: 400 }
        );
      }
      updateData.color = color;
    }

    // Handle workflow_id update
    if (workflow_id !== undefined) {
      // If changing workflow (including to null), clear all stage reviewers
      if (workflow_id !== project.workflow_id) {
        // Delete all existing stage reviewers for this project
        await supabase
          .from('project_stage_reviewers')
          .delete()
          .eq('project_id', id);
      }

      // Validate workflow exists if not null
      if (workflow_id !== null) {
        const { data: workflow, error: workflowError } = await supabase
          .from('workflows')
          .select('id')
          .eq('id', workflow_id)
          .eq('organization_id', orgId)
          .single();

        if (workflowError || !workflow) {
          return NextResponse.json(
            { error: 'Workflow not found' },
            { status: 404 }
          );
        }
      }

      updateData.workflow_id = workflow_id;
    }

    // Perform update
    const { data: updatedProject, error: updateError } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Database error updating project:', updateError);
      throw updateError;
    }

    return NextResponse.json({ project: updatedProject });
  } catch (error) {
    console.error('Error updating project:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/projects/[id]
 *
 * Delete a project
 *
 * Note: Mockups in the project will have their project_id set to NULL
 * due to ON DELETE SET NULL constraint in the database
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, orgId } = await getUserContext();
    const { id } = await context.params;

    // Fetch project to check ownership
    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .eq('organization_id', orgId)
      .single();

    if (fetchError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check permissions - only creator or admin can delete
    const userIsAdmin = await isAdmin();
    const canDelete = project.created_by === userId || userIsAdmin;

    if (!canDelete) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this project' },
        { status: 403 }
      );
    }

    // Delete the project (mockups will have project_id set to NULL automatically)
    const { error: deleteError } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Database error deleting project:', deleteError);
      throw deleteError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}
