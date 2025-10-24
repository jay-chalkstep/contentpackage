import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { supabaseServer } from '@/lib/supabase-server';

// Mark as dynamic to prevent build-time evaluation
export const dynamic = 'force-dynamic';

/**
 * PATCH /api/comments/[id]
 *
 * Update a comment (edit comment text)
 *
 * Body:
 * {
 *   comment_text: string
 * }
 */
export async function PATCH(
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
    const { comment_text, annotation_data, position_x, position_y } = body;

    // Require at least one field to update
    if (!comment_text && !annotation_data && position_x === undefined && position_y === undefined) {
      return NextResponse.json(
        { error: 'At least one field to update is required' },
        { status: 400 }
      );
    }

    // Get the comment to verify ownership
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

    // Verify user owns this comment
    if (comment.user_id !== userId) {
      return NextResponse.json(
        { error: 'You can only edit your own comments' },
        { status: 403 }
      );
    }

    // Build update object
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    // Handle annotation/position updates (no edit history needed)
    if (annotation_data !== undefined) {
      updateData.annotation_data = annotation_data;
    }
    if (position_x !== undefined) {
      updateData.position_x = position_x;
    }
    if (position_y !== undefined) {
      updateData.position_y = position_y;
    }

    // Handle comment text updates (with edit history)
    if (comment_text) {
      if (comment_text.trim().length === 0) {
        return NextResponse.json(
          { error: 'comment_text cannot be empty' },
          { status: 400 }
        );
      }

      // Get user details from Clerk
      const client = await clerkClient();
      const user = await client.users.getUser(userId);
      const firstName = user.firstName || '';
      const lastName = user.lastName || '';
      const fullName = `${firstName} ${lastName}`.trim() || 'Unknown User';

      // Build edit history entry
      const editHistory = comment.edit_history || [];
      editHistory.push({
        edited_at: new Date().toISOString(),
        edited_by: userId,
        edited_by_name: fullName,
        old_text: comment.comment_text,
        new_text: comment_text.trim()
      });

      updateData.comment_text = comment_text.trim();
      updateData.edit_history = editHistory;
    }

    // Update comment
    const { data: updatedComment, error: updateError } = await supabaseServer
      .from('mockup_comments')
      .update(updateData)
      .eq('id', commentId)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({ comment: updatedComment });
  } catch (error) {
    console.error('Error updating comment:', error);
    return NextResponse.json(
      { error: 'Failed to update comment' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/comments/[id]
 *
 * Delete a comment
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, orgId } = await auth();
    const { id: commentId } = await context.params;

    if (!userId || !orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the comment to verify ownership
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

    // Verify user owns this comment
    if (comment.user_id !== userId) {
      return NextResponse.json(
        { error: 'You can only delete your own comments' },
        { status: 403 }
      );
    }

    // Get user details from Clerk
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    const fullName = `${firstName} ${lastName}`.trim() || 'Unknown User';

    // Soft delete comment (preserve for audit trail)
    const { error: deleteError } = await supabaseServer
      .from('mockup_comments')
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: userId,
        deleted_by_name: fullName
      })
      .eq('id', commentId);

    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { error: 'Failed to delete comment' },
      { status: 500 }
    );
  }
}
