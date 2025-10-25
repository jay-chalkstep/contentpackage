import { NextRequest, NextResponse } from 'next/server';
import { getUserContext, isAdmin } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import type { WorkflowStage } from '@/lib/supabase';

// Mark as dynamic to prevent build-time evaluation
export const dynamic = 'force-dynamic';

/**
 * GET /api/workflows/[id]
 *
 * Get a single workflow with stage count and project count
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, orgId } = await getUserContext();
    const { id } = await context.params;

    // Fetch workflow
    const { data: workflow, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('id', id)
      .eq('organization_id', orgId)
      .single();

    if (error || !workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    // Calculate stage count
    const stage_count = Array.isArray(workflow.stages) ? workflow.stages.length : 0;

    // Fetch project count using this workflow
    const { count } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('workflow_id', id)
      .eq('organization_id', orgId);

    return NextResponse.json({
      workflow: {
        ...workflow,
        stage_count,
        project_count: count || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching workflow:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch workflow' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/workflows/[id]
 *
 * Update a workflow (admin only)
 *
 * Body:
 * {
 *   name?: string,
 *   description?: string,
 *   stages?: WorkflowStage[],
 *   is_default?: boolean,
 *   is_archived?: boolean
 * }
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, orgId } = await getUserContext();
    const { id } = await context.params;

    // Check admin permission
    if (!(await isAdmin())) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Fetch workflow to check existence
    const { data: workflow, error: fetchError } = await supabase
      .from('workflows')
      .select('*')
      .eq('id', id)
      .eq('organization_id', orgId)
      .single();

    if (fetchError || !workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    const body = await request.json();
    const { name, description, stages, is_default, is_archived } = body;

    // Prepare update data
    const updateData: any = {};

    // Validate and add name
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json(
          { error: 'Workflow name cannot be empty' },
          { status: 400 }
        );
      }
      updateData.name = name.trim();
    }

    // Add description (can be null)
    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    // Validate and add stages
    if (stages !== undefined) {
      if (!Array.isArray(stages) || stages.length === 0) {
        return NextResponse.json(
          { error: 'Workflow must have at least one stage' },
          { status: 400 }
        );
      }

      // Validate each stage
      for (let i = 0; i < stages.length; i++) {
        const stage = stages[i] as WorkflowStage;

        if (!stage.name || typeof stage.name !== 'string' || stage.name.trim().length === 0) {
          return NextResponse.json(
            { error: `Stage ${i + 1} must have a name` },
            { status: 400 }
          );
        }

        if (typeof stage.order !== 'number' || stage.order !== i + 1) {
          return NextResponse.json(
            { error: 'Stage orders must be sequential starting from 1' },
            { status: 400 }
          );
        }

        const validColors = ['yellow', 'green', 'blue', 'purple', 'red', 'orange', 'gray'];
        if (!stage.color || !validColors.includes(stage.color)) {
          return NextResponse.json(
            { error: `Stage ${i + 1} has invalid color. Must be one of: ${validColors.join(', ')}` },
            { status: 400 }
          );
        }
      }

      updateData.stages = stages;
    }

    // Handle is_default toggle
    if (is_default !== undefined) {
      if (is_default && !workflow.is_default) {
        // Unset any existing default workflows before setting this one
        await supabase
          .from('workflows')
          .update({ is_default: false })
          .eq('organization_id', orgId)
          .eq('is_default', true);
      }
      updateData.is_default = is_default;
    }

    // Add is_archived
    if (is_archived !== undefined) {
      updateData.is_archived = is_archived;
    }

    // Perform update
    const { data: updatedWorkflow, error: updateError } = await supabase
      .from('workflows')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Database error updating workflow:', updateError);
      throw updateError;
    }

    return NextResponse.json({ workflow: updatedWorkflow });
  } catch (error) {
    console.error('Error updating workflow:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to update workflow' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/workflows/[id]
 *
 * Delete a workflow (admin only)
 *
 * Note: Projects using this workflow will have their workflow_id set to NULL
 * due to ON DELETE SET NULL constraint in the database
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, orgId } = await getUserContext();
    const { id } = await context.params;

    // Check admin permission
    if (!(await isAdmin())) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Fetch workflow to check existence
    const { data: workflow, error: fetchError } = await supabase
      .from('workflows')
      .select('*')
      .eq('id', id)
      .eq('organization_id', orgId)
      .single();

    if (fetchError || !workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    // Check if workflow is in use by any projects
    const { count } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('workflow_id', id)
      .eq('organization_id', orgId);

    if (count && count > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete workflow: ${count} project(s) are using this workflow. Please archive it instead or reassign the projects first.`,
        },
        { status: 400 }
      );
    }

    // Delete the workflow (projects will have workflow_id set to NULL automatically)
    const { error: deleteError } = await supabase
      .from('workflows')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Database error deleting workflow:', deleteError);
      throw deleteError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting workflow:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to delete workflow' },
      { status: 500 }
    );
  }
}
