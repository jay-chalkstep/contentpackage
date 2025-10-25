import { NextRequest, NextResponse } from 'next/server';
import { getUserContext, isAdmin } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import type { WorkflowStage } from '@/lib/supabase';

// Mark as dynamic to prevent build-time evaluation
export const dynamic = 'force-dynamic';

/**
 * GET /api/workflows
 *
 * Get all workflows for the current organization
 *
 * Query params:
 * - is_archived?: 'true' | 'false' (default: 'false' - only show active workflows)
 */
export async function GET(request: NextRequest) {
  try {
    const { userId, orgId } = await getUserContext();
    const { searchParams } = new URL(request.url);
    const includeArchived = searchParams.get('is_archived') === 'true';

    // Build query
    let query = supabase
      .from('workflows')
      .select('*')
      .eq('organization_id', orgId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    // Filter archived workflows unless explicitly requested
    if (!includeArchived) {
      query = query.eq('is_archived', false);
    }

    const { data: workflows, error } = await query;

    if (error) {
      console.error('Database error fetching workflows:', error);
      throw error;
    }

    // Calculate stage count for each workflow
    const workflowsWithCounts = (workflows || []).map((workflow) => ({
      ...workflow,
      stage_count: Array.isArray(workflow.stages) ? workflow.stages.length : 0,
    }));

    // Optionally fetch project count for each workflow
    const workflowsWithProjectCounts = await Promise.all(
      workflowsWithCounts.map(async (workflow) => {
        const { count } = await supabase
          .from('projects')
          .select('*', { count: 'exact', head: true })
          .eq('workflow_id', workflow.id)
          .eq('organization_id', orgId);

        return {
          ...workflow,
          project_count: count || 0,
        };
      })
    );

    return NextResponse.json({ workflows: workflowsWithProjectCounts });
  } catch (error) {
    console.error('Error fetching workflows:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch workflows' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/workflows
 *
 * Create a new workflow (admin only)
 *
 * Body:
 * {
 *   name: string (required),
 *   description?: string (optional),
 *   stages: WorkflowStage[] (required, min 1 stage),
 *   is_default?: boolean (default: false)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, orgId } = await getUserContext();

    // Check admin permission
    if (!(await isAdmin())) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, stages, is_default } = body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Workflow name is required' },
        { status: 400 }
      );
    }

    if (!stages || !Array.isArray(stages) || stages.length === 0) {
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

    // If setting as default, unset any existing default workflows
    if (is_default) {
      await supabase
        .from('workflows')
        .update({ is_default: false })
        .eq('organization_id', orgId)
        .eq('is_default', true);
    }

    // Create workflow
    const { data: workflow, error } = await supabase
      .from('workflows')
      .insert({
        name: name.trim(),
        description: description?.trim() || null,
        stages: stages,
        is_default: is_default || false,
        is_archived: false,
        organization_id: orgId,
        created_by: userId,
      })
      .select()
      .single();

    if (error) {
      console.error('Database error creating workflow:', error);
      throw error;
    }

    return NextResponse.json(
      {
        workflow: {
          ...workflow,
          stage_count: stages.length,
          project_count: 0,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating workflow:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to create workflow' },
      { status: 500 }
    );
  }
}
