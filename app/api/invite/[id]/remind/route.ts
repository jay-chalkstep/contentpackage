import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, getCurrentUser } from '@/lib/auth/server'
import { sendEmail } from '@/lib/email/sendgrid'
import { reminderEmail } from '@/lib/email/templates'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params
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
      .eq('id', id)
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
      .eq('id', id)

    if (updateError) {
      console.error('Error updating invitation:', updateError)
      return NextResponse.json(
        { message: 'Failed to update invitation' },
        { status: 500 }
      )
    }

    // Create invitation link
    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/invite/${invitation.token}`

    // Calculate days remaining until expiration
    const daysRemaining = Math.ceil((new Date(invitation.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))

    // Generate reminder email content
    const emailData = reminderEmail({
      recipientEmail: invitation.email,
      organizationName: invitation.organizations?.name || 'Approval Orbit',
      role: invitation.role as 'admin' | 'user',
      inviteLink,
      reminderCount: (invitation.reminder_count || 0) + 1,
      daysRemaining: Math.max(0, daysRemaining)
    })

    // Send reminder email via SendGrid
    const emailSent = await sendEmail({
      to: invitation.email,
      subject: `Reminder: You're invited to join ${invitation.organizations?.name || 'Approval Orbit'}`,
      html: emailData.html,
      text: emailData.text
    })

    if (!emailSent) {
      console.error(`Failed to send reminder email to ${invitation.email}`)
      return NextResponse.json({
        success: false,
        message: 'Failed to send reminder email'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      emailSent: true,
      message: 'Reminder sent successfully'
    })

  } catch (error) {
    console.error('Error sending reminder:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}