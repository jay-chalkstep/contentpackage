import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, getCurrentUser } from '@/lib/auth/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get current user and verify they're an admin
    const currentUser = await getCurrentUser()

    if (!currentUser || currentUser.profile.role !== 'admin') {
      return NextResponse.json(
        { message: 'Unauthorized: Admin access required' },
        { status: 403 }
      )
    }

    const supabase = await createServerSupabaseClient()

    // First, verify the invitation belongs to the admin's organization
    const { data: invitation, error: fetchError } = await supabase
      .from('organization_invitations')
      .select('organization_id')
      .eq('id', params.id)
      .single()

    if (fetchError || !invitation) {
      return NextResponse.json(
        { message: 'Invitation not found' },
        { status: 404 }
      )
    }

    // Check if the invitation belongs to the admin's organization
    if (invitation.organization_id !== currentUser.profile.organization_id) {
      return NextResponse.json(
        { message: 'Unauthorized: Cannot revoke invitations from other organizations' },
        { status: 403 }
      )
    }

    // Delete the invitation
    const { error: deleteError } = await supabase
      .from('organization_invitations')
      .delete()
      .eq('id', params.id)

    if (deleteError) {
      console.error('Error deleting invitation:', deleteError)
      return NextResponse.json(
        { message: 'Failed to revoke invitation' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Invitation revoked successfully'
    })

  } catch (error) {
    console.error('Error in revoke invitation API:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Also add a GET endpoint to fetch invitation details if needed
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabaseClient()

    // Get invitation by ID (this can be accessed publicly for the acceptance flow)
    const { data: invitation, error } = await supabase
      .from('organization_invitations')
      .select(`
        *,
        organizations (
          name,
          slug
        )
      `)
      .eq('id', params.id)
      .single()

    if (error || !invitation) {
      return NextResponse.json(
        { message: 'Invitation not found' },
        { status: 404 }
      )
    }

    // Check if invitation has expired
    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json(
        { message: 'Invitation has expired' },
        { status: 410 }
      )
    }

    return NextResponse.json(invitation)

  } catch (error) {
    console.error('Error fetching invitation:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}