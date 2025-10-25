import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import type { MockupWithProgress, MockupStageProgress, StageStatus } from '@/lib/supabase';

// Mark as dynamic to prevent build-time evaluation
export const dynamic = 'force-dynamic';

/**
 * GET /api/projects/[id]/mockups
 *
 * Get all mockups for a specific project with stage progress
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, orgId } = await getUserContext();
    const { id } = await context.params;

    // Verify project exists and belongs to organization
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, workflow_id')
      .eq('id', id)
      .eq('organization_id', orgId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Fetch mockups for this project with logo and template data
    const { data: mockups, error: mockupsError } = await supabase
      .from('card_mockups')
      .select(`
        *,
        logo:logo_variants!logo_id (
          id,
          logo_url
        ),
        template:card_templates!template_id (
          id,
          template_name,
          template_url
        )
      `)
      .eq('project_id', id)
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });

    if (mockupsError) {
      console.error('Database error fetching project mockups:', mockupsError);
      throw mockupsError;
    }

    // If project has a workflow, fetch stage progress for all mockups
    if (project.workflow_id && mockups && mockups.length > 0) {
      const mockupIds = mockups.map(m => m.id);

      const { data: allProgress, error: progressError } = await supabase
        .from('mockup_stage_progress')
        .select('*')
        .in('mockup_id', mockupIds)
        .eq('project_id', id)
        .order('mockup_id', { ascending: true })
        .order('stage_order', { ascending: true });

      if (progressError) {
        console.error('Error fetching stage progress:', progressError);
        // Continue without progress data rather than failing
      }

      // Group progress by mockup_id
      const progressByMockup = (allProgress || []).reduce((acc, p) => {
        if (!acc[p.mockup_id]) {
          acc[p.mockup_id] = [];
        }
        acc[p.mockup_id].push(p);
        return acc;
      }, {} as Record<string, MockupStageProgress[]>);

      // Enhance mockups with progress data
      const mockupsWithProgress: MockupWithProgress[] = mockups.map((mockup) => {
        const progress = progressByMockup[mockup.id] || [];

        // Calculate current_stage (the stage that is in_review or last approved)
        let currentStage = 1;
        const inReviewStage = progress.find(p => p.status === 'in_review');
        if (inReviewStage) {
          currentStage = inReviewStage.stage_order;
        } else {
          const approvedStages = progress.filter(p => p.status === 'approved');
          if (approvedStages.length > 0) {
            currentStage = Math.max(...approvedStages.map(p => p.stage_order));
          }
        }

        // Calculate overall_status
        let overallStatus: 'not_started' | 'in_progress' | 'approved' | 'changes_requested' = 'not_started';
        if (progress.length > 0) {
          const hasChangesRequested = progress.some(p => p.status === 'changes_requested');
          const allApproved = progress.length > 0 && progress.every(p => p.status === 'approved');
          const someInReview = progress.some(p => p.status === 'in_review');

          if (hasChangesRequested) {
            overallStatus = 'changes_requested';
          } else if (allApproved) {
            overallStatus = 'approved';
          } else if (someInReview) {
            overallStatus = 'in_progress';
          }
        }

        return {
          ...mockup,
          progress,
          current_stage: currentStage,
          overall_status: overallStatus
        };
      });

      return NextResponse.json({ mockups: mockupsWithProgress });
    }

    return NextResponse.json({ mockups: mockups || [] });
  } catch (error) {
    console.error('Error fetching project mockups:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch project mockups' },
      { status: 500 }
    );
  }
}
