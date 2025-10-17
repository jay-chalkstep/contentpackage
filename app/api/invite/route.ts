import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, getCurrentUser } from '@/lib/auth/server'
import { sendEmail } from '@/lib/email/sendgrid'
import { invitationEmail } from '@/lib/email/templates'

export async function POST(request: NextRequest) {
  try {
    // Get current user and verify they're an admin
    const currentUser = await getCurrentUser()

    if (!currentUser || currentUser.profile.role !== 'admin') {
      return NextResponse.json(
        { message: 'Unauthorized: Admin access required' },
        { status: 403 }
      )
    }

    const { email, role, message } = await request.json()

    // Validate input
    if (!email || !role) {
      return NextResponse.json(
        { message: 'Email and role are required' },
        { status: 400 }
      )
    }

    if (!['admin', 'user'].includes(role)) {
      return NextResponse.json(
        { message: 'Invalid role' },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabaseClient()

    // Check if user already exists in organization
    const { data: existingUser } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('email', email)
      .eq('organization_id', currentUser.profile.organization_id)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { message: 'User already exists in organization' },
        { status: 400 }
      )
    }

    // Check if there's already a pending invitation
    const { data: existingInvite } = await supabase
      .from('organization_invitations')
      .select('id')
      .eq('email', email)
      .eq('organization_id', currentUser.profile.organization_id)
      .gte('expires_at', new Date().toISOString())
      .single()

    if (existingInvite) {
      return NextResponse.json(
        { message: 'An invitation has already been sent to this email' },
        { status: 400 }
      )
    }

    // Check organization user limit
    const { data: userCount } = await supabase
      .from('user_profiles')
      .select('id', { count: 'exact' })
      .eq('organization_id', currentUser.profile.organization_id)

    const maxUsers = currentUser.organization?.max_users || 5
    if (maxUsers !== -1 && userCount && userCount.length >= maxUsers) {
      return NextResponse.json(
        { message: 'Organization has reached its user limit' },
        { status: 400 }
      )
    }

    // Generate secure invitation token
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days expiry

    // Create invitation record
    const { data: invitation, error: inviteError } = await supabase
      .from('organization_invitations')
      .insert({
        organization_id: currentUser.profile.organization_id,
        email,
        role,
        invited_by: currentUser.profile.id,
        token,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single()

    if (inviteError) {
      console.error('Error creating invitation:', inviteError)
      return NextResponse.json(
        { message: 'Failed to create invitation' },
        { status: 500 }
      )
    }

    // Create invitation link
    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/invite/${token}`

    // Generate email content
    const emailData = invitationEmail({
      recipientEmail: email,
      inviterName: currentUser.profile.full_name || currentUser.profile.email || 'A team member',
      organizationName: currentUser.organization?.name || 'Approval Orbit',
      role: role as 'admin' | 'user',
      inviteLink,
      personalMessage: message,
      expiresInDays: 7
    })

    // Send invitation email via SendGrid
    const emailSent = await sendEmail({
      to: email,
      subject: `You're invited to join ${currentUser.organization?.name} on Approval Orbit`,
      html: emailData.html,
      text: emailData.text
    })

    if (!emailSent) {
      // Email failed but invitation was created - still return success
      // with link for manual sharing
      console.warn(`Email failed to send to ${email}, but invitation created`)
      return NextResponse.json({
        success: true,
        emailSent: false,
        message: 'Invitation created but email delivery failed',
        invitation: {
          email,
          role,
          link: inviteLink,
          expires_at: expiresAt.toISOString()
        }
      })
    }

    return NextResponse.json({
      success: true,
      emailSent: true,
      message: 'Invitation sent successfully',
      invitation: {
        email,
        role,
        expires_at: expiresAt.toISOString()
      }
    })

  } catch (error) {
    console.error('Error in invite API:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}