import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseServer } from '@/lib/supabase-server';

// Mark as dynamic to prevent build-time evaluation
export const dynamic = 'force-dynamic';

/**
 * POST /api/comments/[id]/unresolve
 *
 * Mark a resolved comment as unresolved
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

    // Check if not resolved
    if (!comment.is_resolved) {
      return NextResponse.json(
        { error: 'Comment is not resolved' },
        { status: 400 }
      );
    }

    // Unresolve the comment (clear resolution fields)
    const { data: unresolvedComment, error: updateError } = await supabaseServer
      .from('mockup_comments')
      .update({
        is_resolved: false,
        resolved_by: null,
        resolved_by_name: null,
        resolved_at: null,
        resolution_note: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', commentId)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({ comment: unresolvedComment });
  } catch (error) {
    console.error('Error unresolving comment:', error);
    return NextResponse.json(
      { error: 'Failed to unresolve comment' },
      { status: 500 }
    );
  }
}
