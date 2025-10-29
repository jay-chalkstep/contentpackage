import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import type { MockupStageProgressWithDetails, WorkflowStage } from '@/lib/supabase';

// Mark as dynamic to prevent build-time evaluation
export const dynamic = 'force-dynamic';

/**
 * GET /api/mockups/[id]/stage-progress
 *
 * Get all stage progress for a mockup with workflow stage details
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, orgId } = await getUserContext();
    const { id } = await context.params;

    // Verify mockup exists and belongs to organization
    const { data: mockup, error: mockupError } = await supabase
      .from('assets')
      .select('id, project_id, organization_id')
      .eq('id', id)
      .eq('organization_id', orgId)
      .single();

    if (mockupError || !mockup) {
      return NextResponse.json({ error: 'Mockup not found' }, { status: 404 });
    }

    // If mockup is not in a project, return empty progress
    if (!mockup.project_id) {
      return NextResponse.json({ progress: [] });
    }

    // Fetch project with workflow
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, workflow_id, workflows(*)')
      .eq('id', mockup.project_id)
      .eq('organization_id', orgId)
      .single();

    if (projectError || !project || !project.workflow_id) {
      return NextResponse.json({ progress: [] });
    }

    // Fetch stage progress for this mockup
    const { data: stageProgress, error: progressError } = await supabase
      .from('mockup_stage_progress')
      .select('*')
      .eq('mockup_id', id)
      .eq('project_id', mockup.project_id)
      .order('stage_order', { ascending: true });

    if (progressError) {
      console.error('Database error fetching stage progress:', progressError);
      throw progressError;
    }

    // Combine progress with workflow stage details
    const workflow = project.workflows as any;
    const stages = workflow?.stages as WorkflowStage[] || [];

    const progressWithDetails: MockupStageProgressWithDetails[] = (stageProgress || []).map((progress) => {
      const stage = stages.find((s) => s.order === progress.stage_order);
      return {
        ...progress,
        stage_name: stage?.name,
        stage_color: stage?.color,
      };
    });

    return NextResponse.json({
      progress: progressWithDetails,
      workflow: {
        id: workflow?.id,
        name: workflow?.name,
        stages: stages
      }
    });
  } catch (error) {
    console.error('Error fetching stage progress:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch stage progress' },
      { status: 500 }
    );
  }
}
