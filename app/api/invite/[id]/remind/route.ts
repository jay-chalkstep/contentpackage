import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, getCurrentUser } from '@/lib/auth/server'

export async function POST(
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

    // Get the invitation details
    const { data: invitation, error: fetchError } = await supabase
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

    if (fetchError || !invitation) {
      return NextResponse.json(
        { message: 'Invitation not found' },
        { status: 404 }
      )
    }

    // Check if the invitation belongs to the admin's organization
    if (invitation.organization_id !== currentUser.profile.organization_id) {
      return NextResponse.json(
        { message: 'Unauthorized: Cannot send reminders for other organizations' },
        { status: 403 }
      )
    }

    // Check if invitation has expired
    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json(
        { message: 'Cannot send reminder for expired invitation' },
        { status: 400 }
      )
    }

    // Check if we should throttle reminders (e.g., max once per hour)
    if (invitation.last_reminder_sent_at) {
      const hoursSinceLastReminder = (Date.now() - new Date(invitation.last_reminder_sent_at).getTime()) / (1000 * 60 * 60)
      if (hoursSinceLastReminder < 1) {
        return NextResponse.json(
          { message: 'Please wait at least 1 hour between reminders' },
          { status: 429 }
        )
      }
    }

    // Update the invitation with reminder information
    const { error: updateError } = await supabase
      .from('organization_invitations')
      .update({
        last_reminder_sent_at: new Date().toISOString(),
        reminder_count: (invitation.reminder_count || 0) + 1
      })
      .eq('id', params.id)

    if (updateError) {
      console.error('Error updating invitation:', updateError)
      return NextResponse.json(
        { message: 'Failed to update invitation' },
        { status: 500 }
      )
    }

    // Create invitation link
    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/invite/${invitation.token}`

    // Prepare email content
    const emailContent = {
      to: invitation.email,
      subject: `Reminder: You're invited to join ${invitation.organizations.name}`,
      body: `
Hi there!

This is a friendly reminder that you've been invited to join ${invitation.organizations.name} on Approval Orbit.

Your invitation is still valid, but it will expire on ${new Date(invitation.expires_at).toLocaleDateString()}.

Click the link below to accept the invitation and create your account:
${inviteLink}

If you have any questions, please don't hesitate to reach out.

Best regards,
The Approval Orbit Team
      `.trim()
    }

    // TODO: Send actual reminder email using your email service
    // For now, we'll just return success and log the email content
    console.log('Reminder email would be sent:', emailContent)

    return NextResponse.json({
      success: true,
      message: 'Reminder sent successfully',
      // Remove this in production - just for testing
      emailContent
    })

  } catch (error) {
    console.error('Error sending reminder:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}