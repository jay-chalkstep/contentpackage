import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';

// Mark as dynamic to prevent build-time evaluation
export const dynamic = 'force-dynamic';

/**
 * PATCH /api/mockups/[mockupId]/reviewers/[reviewerId]
 *
 * Update reviewer status (approve or request changes)
 *
 * Body:
 * {
 *   status: 'approved' | 'changes_requested',
 *   response_note?: string
 * }
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ mockupId: string; reviewerId: string }> }
) {
  try {
    const { userId, orgId } = await auth();
    const { mockupId, reviewerId } = await context.params;

    if (!userId || !orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { status, response_note } = body;

    if (!status || !['approved', 'changes_requested'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be "approved" or "changes_requested"' },
        { status: 400 }
      );
    }

    // Get the reviewer record
    const { data: reviewer, error: fetchError } = await supabase
      .from('mockup_reviewers')
      .select('*')
      .eq('id', reviewerId)
      .eq('organization_id', orgId)
      .single();

    if (fetchError || !reviewer) {
      return NextResponse.json(
        { error: 'Reviewer record not found' },
        { status: 404 }
      );
    }

    // Verify user is the reviewer
    if (reviewer.reviewer_id !== userId) {
      return NextResponse.json(
        { error: 'You can only update your own review status' },
        { status: 403 }
      );
    }

    // Update reviewer record
    const { data: updatedReviewer, error: updateError } = await supabase
      .from('mockup_reviewers')
      .update({
        status,
        response_note: response_note || null,
        responded_at: new Date().toISOString(),
        viewed_at: reviewer.viewed_at || new Date().toISOString() // Mark as viewed if not already
      })
      .eq('id', reviewerId)
      .select()
      .single();

    if (updateError) throw updateError;

    // TODO: Send notification email to mockup creator
    // This can be added later using the SendGrid integration

    return NextResponse.json({ reviewer: updatedReviewer });
  } catch (error) {
    console.error('Error updating reviewer status:', error);
    return NextResponse.json(
      { error: 'Failed to update reviewer status' },
      { status: 500 }
    );
  }
}
