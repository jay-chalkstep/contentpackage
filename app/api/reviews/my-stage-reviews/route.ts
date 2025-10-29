import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import type { Project, CardMockup, WorkflowStage, MockupStageProgress } from '@/lib/supabase';

// Mark as dynamic to prevent build-time evaluation
export const dynamic = 'force-dynamic';

interface PendingMockup {
  mockup: CardMockup;
  stage_order: number;
  stage_name: string;
  stage_color: string;
  stage_progress: MockupStageProgress;
}

interface ProjectWithPendingMockups {
  project: Project;
  pending_mockups: PendingMockup[];
}

/**
 * GET /api/reviews/my-stage-reviews
 *
 * Get all mockups awaiting review by the current user at their assigned workflow stages
 */
export async function GET(request: NextRequest) {
  try {
    const { userId, orgId } = await getUserContext();

    // Find all project stages where current user is a reviewer
    const { data: myReviewerAssignments, error: reviewerError } = await supabase
      .from('project_stage_reviewers')
      .select('*, projects!inner(*)')
      .eq('user_id', userId);

    if (reviewerError) {
      console.error('Error fetching reviewer assignments:', reviewerError);
      throw reviewerError;
    }

    if (!myReviewerAssignments || myReviewerAssignments.length === 0) {
      return NextResponse.json({ projects: [] });
    }

    // Group assignments by project
    const projectIds = [...new Set(myReviewerAssignments.map(r => r.project_id))];

    // Fetch all projects with workflows
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*, workflows(*)')
      .in('id', projectIds)
      .eq('organization_id', orgId);

    if (projectsError) {
      console.error('Error fetching projects:', projectsError);
      throw projectsError;
    }

    // For each project, find mockups in stages where user is reviewer AND status is in_review
    const projectsWithPendingMockups: ProjectWithPendingMockups[] = [];

    for (const project of projects || []) {
      const workflow = project.workflows as any;
      const stages = workflow?.stages as WorkflowStage[] || [];

      // Get stages where user is assigned as reviewer for this project
      const userStages = myReviewerAssignments
        .filter(r => r.project_id === project.id)
        .map(r => r.stage_order);

      if (userStages.length === 0) continue;

      // Find stage progress records that are in_review for this user's stages
      const { data: pendingStageProgress, error: progressError } = await supabase
        .from('mockup_stage_progress')
        .select('*')
        .eq('project_id', project.id)
        .eq('status', 'in_review')
        .in('stage_order', userStages);

      if (progressError) {
        console.error('Error fetching pending stage progress:', progressError);
        continue;
      }

      if (!pendingStageProgress || pendingStageProgress.length === 0) continue;

      // Fetch the mockups
      const mockupIds = pendingStageProgress.map(p => p.mockup_id);
      const { data: mockups, error: mockupsError } = await supabase
        .from('assets')
        .select(`
          *,
          logo:logo_variants!logo_id (
            id,
            logo_url
          ),
          template:templates!template_id (
            id,
            template_name,
            template_url
          )
        `)
        .in('id', mockupIds)
        .eq('organization_id', orgId);

      if (mockupsError) {
        console.error('Error fetching mockups:', mockupsError);
        continue;
      }

      // Build pending mockups with stage details
      const pendingMockups: PendingMockup[] = (mockups || []).map(mockup => {
        const progress = pendingStageProgress.find(p => p.mockup_id === mockup.id);
        const stage = stages.find(s => s.order === progress?.stage_order);

        return {
          mockup,
          stage_order: progress?.stage_order || 1,
          stage_name: stage?.name || 'Unknown',
          stage_color: stage?.color || 'gray',
          stage_progress: progress as MockupStageProgress
        };
      });

      if (pendingMockups.length > 0) {
        projectsWithPendingMockups.push({
          project: project as Project,
          pending_mockups: pendingMockups
        });
      }
    }

    return NextResponse.json({ projects: projectsWithPendingMockups });
  } catch (error) {
    console.error('Error fetching my stage reviews:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch stage reviews' },
      { status: 500 }
    );
  }
}
