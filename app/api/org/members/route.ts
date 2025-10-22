import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';

// Mark as dynamic to prevent build-time evaluation
export const dynamic = 'force-dynamic';

/**
 * GET /api/org/members
 *
 * Get all members of the current user's organization
 *
 * Returns:
 * {
 *   members: [
 *     {
 *       id: string (Clerk user ID),
 *       name: string (full name),
 *       email: string,
 *       avatar: string (image URL),
 *       role: string (org:admin or org:member)
 *     }
 *   ]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return NextResponse.json(
        { error: 'Unauthorized: No user or organization found' },
        { status: 401 }
      );
    }

    // Fetch organization membership list from Clerk
    const client = await clerkClient();
    const { data: memberships } = await client.organizations.getOrganizationMembershipList({
      organizationId: orgId,
    });

    // Transform to simple member objects
    const members = memberships
      .map((membership) => {
        const user = membership.publicUserData;
        if (!user) return null;

        const firstName = user.firstName || '';
        const lastName = user.lastName || '';
        const fullName = `${firstName} ${lastName}`.trim() || user.identifier || 'Unknown User';

        return {
          id: user.userId,
          name: fullName,
          email: user.identifier || '',
          avatar: user.imageUrl,
          role: membership.role
        };
      })
      .filter(member => member !== null)
      .filter(member => member!.id !== userId); // Exclude current user

    return NextResponse.json({ members });
  } catch (error) {
    console.error('Error fetching org members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organization members' },
      { status: 500 }
    );
  }
}
