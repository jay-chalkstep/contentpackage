import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

// Mark as dynamic to prevent build-time evaluation
export const dynamic = 'force-dynamic';

interface StageBreakdown {
  stageOrder: number;
  stageName: string;
  stageColor: string;
  mockupCount: number;
}

interface ReviewerActivity {
  reviewerId: string;
  reviewerName: string;
  action: 'approved' | 'changes_requested';
  stageName: string;
  mockupName: string;
  timestamp: string;
  notes?: string;
}

interface TimelineEvent {
  id: string;
  type: 'mockup_added' | 'stage_changed' | 'comment_added';
  description: string;
  timestamp: string;
  userName: string;
  metadata?: any;
}

/**
 * GET /api/projects/[id]/metrics
 *
 * Get comprehensive project metrics including:
 * - Mockup counts by workflow stage
 * - Overall progress percentage
 * - Recent reviewer activity
 * - Activity timeline
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
      .select('*, workflows(*)')
      .eq('id', id)
      .eq('organization_id', orgId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get all mockups for this project
    const { data: mockups, error: mockupsError } = await supabase
      .from('card_mockups')
      .select('id, mockup_name, created_at, created_by')
      .eq('project_id', id)
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });

    if (mockupsError) {
      console.error('Error fetching mockups:', mockupsError);
      throw mockupsError;
    }

    const totalMockups = mockups?.length || 0;

    // Rename workflows to workflow
    const { workflows, ...projectData } = project;
    const workflow = Array.isArray(workflows) ? workflows[0] : workflows;

    // Initialize metrics response
    let stageBreakdown: StageBreakdown[] = [];
    let progressPercentage = 0;
    let reviewerActivity: ReviewerActivity[] = [];

    // If project has a workflow, calculate stage-based metrics
    if (workflow && mockups && mockups.length > 0) {
      const mockupIds = mockups.map(m => m.id);

      // Fetch all stage progress
      const { data: allProgress, error: progressError } = await supabase
        .from('mockup_stage_progress')
        .select('*')
        .in('mockup_id', mockupIds)
        .eq('project_id', id)
        .order('updated_at', { ascending: false });

      if (progressError) {
        console.error('Error fetching stage progress:', progressError);
      }

      // Group progress by mockup
      const progressByMockup: Record<string, any[]> = {};
      (allProgress || []).forEach((p: any) => {
        if (!progressByMockup[p.mockup_id]) {
          progressByMockup[p.mockup_id] = [];
        }
        progressByMockup[p.mockup_id].push(p);
      });

      // Calculate stage breakdown
      const stageCounts: Record<number, number> = {};
      const stages = workflow.stages || [];

      // Initialize all stages with 0 count
      stages.forEach((stage: any) => {
        stageCounts[stage.order] = 0;
      });

      // Determine current stage for each mockup
      mockups.forEach((mockup) => {
        const progress = progressByMockup[mockup.id] || [];

        if (progress.length === 0) {
          // Not started, assign to first stage
          stageCounts[1] = (stageCounts[1] || 0) + 1;
        } else {
          // Find current stage (in_review or last approved)
          const inReviewStage = progress.find((p: any) => p.status === 'in_review');
          if (inReviewStage) {
            stageCounts[inReviewStage.stage_order] = (stageCounts[inReviewStage.stage_order] || 0) + 1;
          } else {
            const approvedStages = progress.filter((p: any) => p.status === 'approved');
            if (approvedStages.length > 0) {
              const maxStage = Math.max(...approvedStages.map((p: any) => p.stage_order));
              // If all stages approved, they're "done" - count in last stage
              if (maxStage === stages.length) {
                stageCounts[maxStage] = (stageCounts[maxStage] || 0) + 1;
              } else {
                // Move to next stage
                const nextStage = maxStage + 1;
                stageCounts[nextStage] = (stageCounts[nextStage] || 0) + 1;
              }
            } else {
              // Has progress but nothing approved - assign to first stage
              stageCounts[1] = (stageCounts[1] || 0) + 1;
            }
          }
        }
      });

      // Build stage breakdown array
      stageBreakdown = stages.map((stage: any) => ({
        stageOrder: stage.order,
        stageName: stage.name,
        stageColor: stage.color,
        mockupCount: stageCounts[stage.order] || 0,
      }));

      // Calculate progress percentage
      // Progress = (sum of (mockups_completed_stage_X * stage_order)) / (total_mockups * total_stages)
      let totalProgress = 0;
      mockups.forEach((mockup) => {
        const progress = progressByMockup[mockup.id] || [];
        const approvedStages = progress.filter((p: any) => p.status === 'approved');
        totalProgress += approvedStages.length;
      });

      const maxPossibleProgress = totalMockups * stages.length;
      progressPercentage = maxPossibleProgress > 0
        ? Math.round((totalProgress / maxPossibleProgress) * 100)
        : 0;

      // Get recent reviewer activity (last 20 actions)
      const recentProgress = (allProgress || [])
        .filter((p: any) => p.status === 'approved' || p.status === 'changes_requested')
        .filter((p: any) => p.reviewed_by && p.reviewed_at)
        .slice(0, 20);

      // Build reviewer activity list
      reviewerActivity = await Promise.all(
        recentProgress.map(async (p: any) => {
          const mockup = mockups.find(m => m.id === p.mockup_id);
          const stage = stages.find((s: any) => s.order === p.stage_order);

          return {
            reviewerId: p.reviewed_by,
            reviewerName: p.reviewed_by, // Will be enhanced with actual names from Clerk
            action: p.status as 'approved' | 'changes_requested',
            stageName: stage?.name || `Stage ${p.stage_order}`,
            mockupName: mockup?.mockup_name || 'Unknown',
            timestamp: p.reviewed_at,
            notes: p.review_notes || undefined,
          };
        })
      );
    }

    // Build activity timeline (last 20 events)
    const timeline: TimelineEvent[] = [];

    // Add mockup creation events
    (mockups || []).slice(0, 10).forEach((mockup) => {
      timeline.push({
        id: `mockup-${mockup.id}`,
        type: 'mockup_added',
        description: `Added mockup "${mockup.mockup_name}"`,
        timestamp: mockup.created_at,
        userName: mockup.created_by,
        metadata: { mockupId: mockup.id },
      });
    });

    // Add stage change events from reviewer activity
    reviewerActivity.slice(0, 10).forEach((activity, idx) => {
      timeline.push({
        id: `review-${idx}`,
        type: 'stage_changed',
        description: activity.action === 'approved'
          ? `Approved "${activity.mockupName}" at ${activity.stageName}`
          : `Requested changes for "${activity.mockupName}" at ${activity.stageName}`,
        timestamp: activity.timestamp,
        userName: activity.reviewerName,
        metadata: activity,
      });
    });

    // Fetch recent comments
    if (mockups && mockups.length > 0) {
      const mockupIds = mockups.map(m => m.id);
      const { data: comments } = await supabase
        .from('mockup_comments')
        .select('id, comment_text, created_at, created_by, mockup_id')
        .in('mockup_id', mockupIds)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(10);

      (comments || []).forEach((comment) => {
        const mockup = mockups.find(m => m.id === comment.mockup_id);
        timeline.push({
          id: `comment-${comment.id}`,
          type: 'comment_added',
          description: `Commented on "${mockup?.mockup_name || 'Unknown'}"`,
          timestamp: comment.created_at,
          userName: comment.created_by,
          metadata: {
            commentId: comment.id,
            commentText: comment.comment_text.slice(0, 100),
          },
        });
      });
    }

    // Sort timeline by timestamp (most recent first)
    timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Return metrics
    return NextResponse.json({
      metrics: {
        projectId: id,
        projectName: project.name,
        totalMockups,
        stageBreakdown,
        progressPercentage,
        reviewerActivity,
        timeline: timeline.slice(0, 20), // Limit to 20 most recent events
      },
    });
  } catch (error) {
    console.error('Error fetching project metrics:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch project metrics' },
      { status: 500 }
    );
  }
}
