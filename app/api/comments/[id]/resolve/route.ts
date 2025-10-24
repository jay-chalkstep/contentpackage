import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { supabaseServer } from '@/lib/supabase-server';

// Mark as dynamic to prevent build-time evaluation
export const dynamic = 'force-dynamic';

/**
 * POST /api/comments/[id]/resolve
 *
 * Mark a comment as resolved with a resolution note
 *
 * Body:
 * {
 *   resolution_note?: string (optional explanation)
 * }
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, orgId } = await auth();
    const { id: commentId } = await context.params;

    if (!userId || !orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { resolution_note } = body;

    // Get the comment to verify it exists and user has permission
    const { data: comment, error: fetchError } = await supabaseServer
      .from('mockup_comments')
      .select('*')
      .eq('id', commentId)
      .eq('organization_id', orgId)
      .single();

    if (fetchError || !comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    // Check if already resolved
    if (comment.is_resolved) {
      return NextResponse.json(
        { error: 'Comment is already resolved' },
        { status: 400 }
      );
    }

    // Get user details from Clerk
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    const fullName = `${firstName} ${lastName}`.trim() || 'Unknown User';

    // Resolve the comment
    const { data: resolvedComment, error: updateError} = await supabaseServer
      .from('mockup_comments')
      .update({
        is_resolved: true,
        resolved_by: userId,
        resolved_by_name: fullName,
        resolved_at: new Date().toISOString(),
        resolution_note: resolution_note || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', commentId)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({ comment: resolvedComment });
  } catch (error) {
    console.error('Error resolving comment:', error);
    return NextResponse.json(
      { error: 'Failed to resolve comment' },
      { status: 500 }
    );
  }
}
