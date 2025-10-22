import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';

// Mark as dynamic to prevent build-time evaluation
export const dynamic = 'force-dynamic';

// Predefined colors for reviewer annotations (rotates through list)
const REVIEWER_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#FFE66D', // Yellow
  '#95E1D3', // Mint
  '#A29BFE', // Purple
  '#FD79A8'  // Pink
];

/**
 * POST /api/mockups/[id]/reviewers
 *
 * Invite reviewers to provide feedback on a mockup
 *
 * Body:
 * {
 *   reviewer_ids: string[] (Clerk user IDs),
 *   message?: string (optional invitation message)
 * }
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, orgId } = await auth();
    const { id: mockupId } = await context.params;

    if (!userId || !orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { reviewer_ids, message } = body;

    if (!reviewer_ids || !Array.isArray(reviewer_ids) || reviewer_ids.length === 0) {
      return NextResponse.json(
        { error: 'reviewer_ids must be a non-empty array' },
        { status: 400 }
      );
    }

    // Verify mockup exists and user is the creator
    const { data: mockup, error: mockupError } = await supabase
      .from('card_mockups')
      .select('*')
      .eq('id', mockupId)
      .eq('organization_id', orgId)
      .eq('created_by', userId)
      .single();

    if (mockupError || !mockup) {
      return NextResponse.json(
        { error: 'Mockup not found or you do not have permission' },
        { status: 404 }
      );
    }

    // Get reviewer details from Clerk
    const client = await clerkClient();
    const reviewerDetails = await Promise.all(
      reviewer_ids.map(async (reviewerId, index) => {
        try {
          const user = await client.users.getUser(reviewerId);
          const firstName = user.firstName || '';
          const lastName = user.lastName || '';
          const fullName = `${firstName} ${lastName}`.trim() || 'Unknown User';

          return {
            reviewer_id: reviewerId,
            reviewer_name: fullName,
            reviewer_email: user.emailAddresses[0]?.emailAddress || '',
            reviewer_avatar: user.imageUrl,
            reviewer_color: REVIEWER_COLORS[index % REVIEWER_COLORS.length]
          };
        } catch (error) {
          console.error(`Error fetching user ${reviewerId}:`, error);
          return null;
        }
      })
    );

    const validReviewers = reviewerDetails.filter(r => r !== null);

    if (validReviewers.length === 0) {
      return NextResponse.json(
        { error: 'No valid reviewers found' },
        { status: 400 }
      );
    }

    // Create reviewer records
    const reviewerRecords = validReviewers.map(reviewer => ({
      mockup_id: mockupId,
      ...reviewer,
      invited_by: userId,
      invitation_message: message || null,
      organization_id: orgId
    }));

    const { data: createdReviewers, error: createError } = await supabase
      .from('mockup_reviewers')
      .insert(reviewerRecords)
      .select();

    if (createError) {
      // Check for duplicate invitations
      if (createError.code === '23505') {
        return NextResponse.json(
          { error: 'One or more reviewers have already been invited' },
          { status: 409 }
        );
      }
      throw createError;
    }

    // Send email notifications
    try {
      const currentUser = await client.users.getUser(userId);
      const currentUserName = `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || 'A team member';

      // Import sendEmail dynamically to avoid build issues if not configured
      const { sendReviewRequestEmail } = await import('@/lib/email/collaboration');

      await Promise.all(
        validReviewers.map(reviewer =>
          sendReviewRequestEmail({
            to: reviewer!.reviewer_email,
            reviewerName: reviewer!.reviewer_name,
            inviterName: currentUserName,
            mockupName: mockup.mockup_name,
            mockupId: mockupId,
            message: message || undefined
          }).catch(error => {
            console.error(`Failed to send email to ${reviewer!.reviewer_email}:`, error);
            // Don't fail the whole operation if email fails
          })
        )
      );
    } catch (emailError) {
      console.error('Error sending email notifications:', emailError);
      // Continue even if emails fail
    }

    return NextResponse.json({
      reviewers: createdReviewers,
      message: `Invited ${createdReviewers.length} reviewer(s)`
    });
  } catch (error) {
    console.error('Error creating reviewers:', error);
    return NextResponse.json(
      { error: 'Failed to invite reviewers' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/mockups/[id]/reviewers
 *
 * Get all reviewers for a mockup
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, orgId } = await auth();
    const { id: mockupId } = await context.params;

    if (!userId || !orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: reviewers, error } = await supabase
      .from('mockup_reviewers')
      .select('*')
      .eq('mockup_id', mockupId)
      .eq('organization_id', orgId)
      .order('invited_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ reviewers: reviewers || [] });
  } catch (error) {
    console.error('Error fetching reviewers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviewers' },
      { status: 500 }
    );
  }
}
