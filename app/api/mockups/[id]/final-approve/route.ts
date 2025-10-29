import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { clerkClient } from '@clerk/nextjs/server';

// Mark as dynamic to prevent build-time evaluation
export const dynamic = 'force-dynamic';

/**
 * POST /api/mockups/[id]/final-approve
 *
 * Records final approval by project owner after all workflow stages are complete
 * Only project creator or org admin can give final approval
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, orgId } = await getUserContext();
    const { id: mockupId } = await context.params;
    const body = await request.json();
    const { notes } = body;

    // Fetch mockup with project
    const { data: mockup, error: mockupError } = await supabase
      .from('assets')
      .select('*, project:projects(*)')
      .eq('id', mockupId)
      .eq('organization_id', orgId)
      .single();

    if (mockupError || !mockup) {
      return NextResponse.json({ error: 'Mockup not found' }, { status: 404 });
    }

    if (!mockup.project_id || !mockup.project) {
      return NextResponse.json(
        { error: 'Mockup must be assigned to a project' },
        { status: 400 }
      );
    }

    const project = mockup.project as any;

    // Verify user is project creator or org admin
    const isProjectCreator = project.created_by === userId;

    // Check if user is org admin
    const client = await clerkClient();
    const memberships = await client.users.getOrganizationMembershipList({
      userId: userId
    });

    const membership = memberships.data.find(
      (m) => m.organization.id === orgId
    );

    const isOrgAdmin = membership?.role === 'org:admin';

    if (!isProjectCreator && !isOrgAdmin) {
      return NextResponse.json(
        { error: 'Only project creator or organization admin can give final approval' },
        { status: 403 }
      );
    }

    // Check that mockup is in pending_final_approval status
    const { data: stageProgress, error: progressError } = await supabase
      .from('mockup_stage_progress')
      .select('*')
      .eq('asset_id', mockupId)
      .eq('project_id', mockup.project_id)
      .order('stage_order', { ascending: false })
      .limit(1)
      .single();

    if (progressError || !stageProgress) {
      return NextResponse.json(
        { error: 'No stage progress found for this mockup' },
        { status: 404 }
      );
    }

    if (stageProgress.status !== 'pending_final_approval') {
      return NextResponse.json(
        {
          error: `Cannot give final approval. Current status: ${stageProgress.status}`,
          current_status: stageProgress.status
        },
        { status: 400 }
      );
    }

    // Get user's name for display
    const user = await client.users.getUser(userId);
    const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.emailAddresses[0]?.emailAddress || 'Unknown User';

    // Record final approval using database function
    await supabase.rpc('record_final_approval', {
      p_asset_id: mockupId,
      p_user_id: userId,
      p_user_name: userName,
      p_notes: notes || null
    });

    // Fetch updated asset and progress
    const { data: updatedMockup } = await supabase
      .from('assets')
      .select('*')
      .eq('id', mockupId)
      .single();

    const { data: updatedProgress } = await supabase
      .from('mockup_stage_progress')
      .select('*')
      .eq('asset_id', mockupId)
      .order('stage_order', { ascending: true });

    // TODO: Send "Asset Approved" email to all stakeholders

    return NextResponse.json({
      success: true,
      message: 'Final approval recorded successfully',
      mockup: updatedMockup,
      progress: updatedProgress,
      final_approval: {
        approved_by: updatedMockup?.final_approved_by,
        approved_at: updatedMockup?.final_approved_at,
        notes: updatedMockup?.final_approval_notes
      }
    });
  } catch (error) {
    console.error('Error recording final approval:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to record final approval' },
      { status: 500 }
    );
  }
}
