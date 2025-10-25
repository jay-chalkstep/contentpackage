import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import type { ProjectStageReviewer } from '@/lib/supabase';

// Mark as dynamic to prevent build-time evaluation
export const dynamic = 'force-dynamic';

/**
 * GET /api/projects/[id]/reviewers
 *
 * Get all stage reviewers for a project, grouped by stage_order
 *
 * Returns: { stage_order: number, reviewers: ProjectStageReviewer[] }[]
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, orgId } = await getUserContext();
    const { id: projectId } = await context.params;

    // Verify project exists and user has access
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('organization_id', orgId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Fetch all reviewers for this project
    const { data: reviewers, error } = await supabase
      .from('project_stage_reviewers')
      .select('*')
      .eq('project_id', projectId)
      .order('stage_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Database error fetching reviewers:', error);
      throw error;
    }

    // Group reviewers by stage_order
    const reviewersByStage: Record<number, ProjectStageReviewer[]> = {};
    (reviewers || []).forEach((reviewer) => {
      if (!reviewersByStage[reviewer.stage_order]) {
        reviewersByStage[reviewer.stage_order] = [];
      }
      reviewersByStage[reviewer.stage_order].push(reviewer);
    });

    // Convert to array format
    const groupedReviewers = Object.entries(reviewersByStage).map(([stage_order, reviewers]) => ({
      stage_order: parseInt(stage_order, 10),
      reviewers,
    }));

    return NextResponse.json({ reviewers: groupedReviewers });
  } catch (error) {
    console.error('Error fetching reviewers:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch reviewers' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/projects/[id]/reviewers
 *
 * Add a reviewer to a specific stage
 *
 * Body:
 * {
 *   stage_order: number (required),
 *   user_id: string (required),
 *   user_name: string (required),
 *   user_image_url?: string (optional)
 * }
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, orgId } = await getUserContext();
    const { id: projectId } = await context.params;

    // Verify project exists and has a workflow
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*, workflows(*)')
      .eq('id', projectId)
      .eq('organization_id', orgId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (!project.workflow_id) {
      return NextResponse.json(
        { error: 'Project does not have a workflow assigned' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { stage_order, user_id, user_name, user_image_url } = body;

    // Validate required fields
    if (typeof stage_order !== 'number' || stage_order < 1) {
      return NextResponse.json(
        { error: 'stage_order must be a positive number' },
        { status: 400 }
      );
    }

    if (!user_id || typeof user_id !== 'string') {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      );
    }

    if (!user_name || typeof user_name !== 'string') {
      return NextResponse.json(
        { error: 'user_name is required' },
        { status: 400 }
      );
    }

    // Validate that stage_order exists in the workflow
    // Handle workflows as array or object (Supabase JOIN quirk)
    const workflows = project.workflows;
    const workflow = Array.isArray(workflows) ? workflows[0] : workflows;
    const stages = Array.isArray(workflow?.stages) ? workflow.stages : [];
    const stageExists = stages.some((stage: any) => stage.order === stage_order);

    if (!stageExists) {
      return NextResponse.json(
        { error: `Stage ${stage_order} does not exist in this project's workflow` },
        { status: 400 }
      );
    }

    // Check for duplicate reviewer in same stage (unique constraint will catch this too)
    const { data: existingReviewer } = await supabase
      .from('project_stage_reviewers')
      .select('*')
      .eq('project_id', projectId)
      .eq('stage_order', stage_order)
      .eq('user_id', user_id)
      .maybeSingle();

    if (existingReviewer) {
      return NextResponse.json(
        { error: 'User is already a reviewer for this stage' },
        { status: 400 }
      );
    }

    // Add reviewer
    const { data: reviewer, error } = await supabase
      .from('project_stage_reviewers')
      .insert({
        project_id: projectId,
        stage_order,
        user_id,
        user_name,
        user_image_url: user_image_url || null,
        added_by: userId,
      })
      .select()
      .single();

    if (error) {
      console.error('Database error adding reviewer:', error);
      throw error;
    }

    return NextResponse.json({ reviewer }, { status: 201 });
  } catch (error) {
    console.error('Error adding reviewer:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to add reviewer' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/projects/[id]/reviewers?reviewer_id=xxx
 *
 * Remove a reviewer from a stage
 *
 * Query param:
 * - reviewer_id: UUID of the reviewer to remove
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, orgId } = await getUserContext();
    const { id: projectId } = await context.params;
    const { searchParams } = new URL(request.url);
    const reviewerId = searchParams.get('reviewer_id');

    if (!reviewerId) {
      return NextResponse.json(
        { error: 'reviewer_id query parameter is required' },
        { status: 400 }
      );
    }

    // Verify project exists
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('organization_id', orgId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Verify reviewer exists and belongs to this project
    const { data: reviewer, error: reviewerError } = await supabase
      .from('project_stage_reviewers')
      .select('*')
      .eq('id', reviewerId)
      .eq('project_id', projectId)
      .single();

    if (reviewerError || !reviewer) {
      return NextResponse.json({ error: 'Reviewer not found' }, { status: 404 });
    }

    // Delete the reviewer
    const { error: deleteError } = await supabase
      .from('project_stage_reviewers')
      .delete()
      .eq('id', reviewerId);

    if (deleteError) {
      console.error('Database error deleting reviewer:', deleteError);
      throw deleteError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing reviewer:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to remove reviewer' },
      { status: 500 }
    );
  }
}
