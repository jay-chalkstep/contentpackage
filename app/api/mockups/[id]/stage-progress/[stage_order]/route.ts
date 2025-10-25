import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import {
  sendStageReviewNotification,
  sendChangesRequestedNotification,
  sendAllStagesApprovedNotification
} from '@/lib/email/stage-notifications';
import type { MockupStageProgress, WorkflowStage, ProjectStageReviewer } from '@/lib/supabase';

// Mark as dynamic to prevent build-time evaluation
export const dynamic = 'force-dynamic';

/**
 * POST /api/mockups/[id]/stage-progress/[stage_order]
 *
 * Approve or request changes for a specific stage
 *
 * Body: {
 *   action: 'approve' | 'request_changes',
 *   notes?: string
 * }
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string; stage_order: string }> }
) {
  try {
    const { userId, orgId } = await getUserContext();
    const { id: mockupId, stage_order: stageOrderStr } = await context.params;
    const stageOrder = parseInt(stageOrderStr, 10);

    if (isNaN(stageOrder)) {
      return NextResponse.json({ error: 'Invalid stage order' }, { status: 400 });
    }

    const body = await request.json();
    const { action, notes } = body;

    if (!action || !['approve', 'request_changes'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Fetch mockup with project and creator info
    const { data: mockup, error: mockupError } = await supabase
      .from('card_mockups')
      .select('id, mockup_name, project_id, organization_id, created_by')
      .eq('id', mockupId)
      .eq('organization_id', orgId)
      .single();

    if (mockupError || !mockup) {
      return NextResponse.json({ error: 'Mockup not found' }, { status: 404 });
    }

    if (!mockup.project_id) {
      return NextResponse.json({ error: 'Mockup not in a project with workflow' }, { status: 400 });
    }

    // Fetch project with workflow
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, name, workflow_id, workflows(*)')
      .eq('id', mockup.project_id)
      .eq('organization_id', orgId)
      .single();

    if (projectError || !project || !project.workflow_id) {
      return NextResponse.json({ error: 'Project does not have a workflow' }, { status: 400 });
    }

    const workflow = project.workflows as any;
    const stages = workflow?.stages as WorkflowStage[] || [];
    const currentStage = stages.find(s => s.order === stageOrder);

    if (!currentStage) {
      return NextResponse.json({ error: 'Invalid stage' }, { status: 400 });
    }

    // Verify user is assigned as reviewer for this stage
    const { data: stageReviewers, error: reviewersError } = await supabase
      .from('project_stage_reviewers')
      .select('*')
      .eq('project_id', mockup.project_id)
      .eq('stage_order', stageOrder);

    if (reviewersError) {
      console.error('Error fetching stage reviewers:', reviewersError);
      throw reviewersError;
    }

    const isReviewer = stageReviewers?.some((r: ProjectStageReviewer) => r.user_id === userId);

    if (!isReviewer) {
      return NextResponse.json(
        { error: 'You are not assigned as a reviewer for this stage' },
        { status: 403 }
      );
    }

    // Fetch current stage progress
    const { data: stageProgress, error: progressError } = await supabase
      .from('mockup_stage_progress')
      .select('*')
      .eq('mockup_id', mockupId)
      .eq('stage_order', stageOrder)
      .single();

    if (progressError || !stageProgress) {
      return NextResponse.json({ error: 'Stage progress not found' }, { status: 404 });
    }

    // Verify stage is in_review
    if (stageProgress.status !== 'in_review') {
      return NextResponse.json(
        { error: `Stage is not in review (current status: ${stageProgress.status})` },
        { status: 400 }
      );
    }

    // Get current user info from Clerk
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const currentUser = users?.find(u => u.id === userId);
    const userName = currentUser?.user_metadata?.name || currentUser?.email || 'Unknown User';

    if (action === 'approve') {
      // APPROVE LOGIC
      // Update current stage to approved
      const { error: updateError } = await supabase
        .from('mockup_stage_progress')
        .update({
          status: 'approved',
          reviewed_by: userId,
          reviewed_by_name: userName,
          reviewed_at: new Date().toISOString(),
          notes: notes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', stageProgress.id);

      if (updateError) {
        console.error('Error updating stage progress:', updateError);
        throw updateError;
      }

      // Check if there's a next stage
      const nextStage = stages.find(s => s.order === stageOrder + 1);

      if (nextStage) {
        // Advance to next stage using our database function
        const { data: hasNext, error: advanceError } = await supabase
          .rpc('advance_to_next_stage', {
            p_mockup_id: mockupId,
            p_current_stage_order: stageOrder
          });

        if (advanceError) {
          console.error('Error advancing to next stage:', advanceError);
          throw advanceError;
        }

        // Send email to next stage reviewers
        const { data: nextStageReviewers } = await supabase
          .from('project_stage_reviewers')
          .select('*')
          .eq('project_id', mockup.project_id)
          .eq('stage_order', nextStage.order);

        if (nextStageReviewers && nextStageReviewers.length > 0) {
          // Send notification to each reviewer (in parallel)
          await Promise.allSettled(
            nextStageReviewers.map((reviewer: ProjectStageReviewer) =>
              sendStageReviewNotification({
                to_email: reviewer.user_id, // Assuming Clerk user ID is email or we have email mapping
                to_name: reviewer.user_name,
                mockup_name: mockup.mockup_name,
                mockup_id: mockupId,
                project_name: project.name,
                stage_name: nextStage.name,
                stage_order: nextStage.order,
                submitted_by_name: userName
              }).catch(err => {
                console.error(`Failed to send email to ${reviewer.user_id}:`, err);
              })
            )
          );

          // Mark notifications as sent
          await supabase
            .from('mockup_stage_progress')
            .update({
              notification_sent: true,
              notification_sent_at: new Date().toISOString()
            })
            .eq('mockup_id', mockupId)
            .eq('stage_order', nextStage.order);
        }
      } else {
        // This was the last stage - all stages approved!
        // Send celebration email to creator
        const creatorEmail = mockup.created_by; // Assuming this is email or we have mapping
        const creatorName = 'Creator'; // TODO: Get actual name from Clerk

        await sendAllStagesApprovedNotification({
          to_email: creatorEmail,
          to_name: creatorName,
          mockup_name: mockup.mockup_name,
          mockup_id: mockupId,
          project_name: project.name,
          total_stages: stages.length
        }).catch(err => {
          console.error('Failed to send all approved email:', err);
        });

        // Optionally update project status to completed
        // await supabase
        //   .from('projects')
        //   .update({ status: 'completed' })
        //   .eq('id', mockup.project_id);
      }

      // Fetch updated progress for response
      const { data: updatedProgress } = await supabase
        .from('mockup_stage_progress')
        .select('*')
        .eq('mockup_id', mockupId)
        .order('stage_order', { ascending: true });

      return NextResponse.json({
        success: true,
        message: nextStage ? 'Stage approved, advanced to next stage' : 'All stages approved!',
        progress: updatedProgress || []
      });

    } else if (action === 'request_changes') {
      // REQUEST CHANGES LOGIC
      if (!notes || notes.trim() === '') {
        return NextResponse.json(
          { error: 'Notes are required when requesting changes' },
          { status: 400 }
        );
      }

      // Update current stage to changes_requested
      const { error: updateError } = await supabase
        .from('mockup_stage_progress')
        .update({
          status: 'changes_requested',
          reviewed_by: userId,
          reviewed_by_name: userName,
          reviewed_at: new Date().toISOString(),
          notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', stageProgress.id);

      if (updateError) {
        console.error('Error updating stage progress:', updateError);
        throw updateError;
      }

      // Reset to first stage using our database function
      const { error: resetError } = await supabase
        .rpc('reset_to_first_stage', {
          p_mockup_id: mockupId
        });

      if (resetError) {
        console.error('Error resetting to first stage:', resetError);
        throw resetError;
      }

      // Send email to mockup creator
      const creatorEmail = mockup.created_by; // Assuming this is email or we have mapping
      const creatorName = 'Creator'; // TODO: Get actual name from Clerk

      await sendChangesRequestedNotification({
        to_email: creatorEmail,
        to_name: creatorName,
        mockup_name: mockup.mockup_name,
        mockup_id: mockupId,
        project_name: project.name,
        stage_name: currentStage.name,
        stage_order: stageOrder,
        requested_by_name: userName,
        notes
      }).catch(err => {
        console.error('Failed to send changes requested email:', err);
      });

      // Fetch updated progress for response
      const { data: updatedProgress } = await supabase
        .from('mockup_stage_progress')
        .select('*')
        .eq('mockup_id', mockupId)
        .order('stage_order', { ascending: true });

      return NextResponse.json({
        success: true,
        message: 'Changes requested, mockup reset to Stage 1',
        progress: updatedProgress || []
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Error processing stage action:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to process stage action' },
      { status: 500 }
    );
  }
}
