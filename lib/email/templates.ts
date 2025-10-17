/**
 * Email template builder for Approval Orbit
 * Creates professional HTML emails with consistent branding
 */

interface InvitationEmailData {
  recipientEmail: string
  inviterName: string
  organizationName: string
  role: 'admin' | 'user'
  inviteLink: string
  personalMessage?: string
  expiresInDays: number
}

interface ReminderEmailData {
  recipientEmail: string
  organizationName: string
  role: 'admin' | 'user'
  inviteLink: string
  reminderCount: number
  daysRemaining: number
}

/**
 * Base HTML template wrapper for all emails
 */
function baseTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Approval Orbit</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: #374151; padding: 32px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Approval Orbit</h1>
              <p style="margin: 8px 0 0 0; color: #d1d5db; font-size: 14px;">Visual Asset Review & Approval Platform</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 32px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">
                This email was sent by Approval Orbit
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                If you didn't expect this email, you can safely ignore it.
              </p>
            </td>
          </tr>
        </table>

        <!-- Spacer -->
        <table width="600" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding: 20px; text-align: center;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                © ${new Date().getFullYear()} Approval Orbit. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

/**
 * Button component for CTAs
 */
function button(text: string, url: string): string {
  return `
<table cellpadding="0" cellspacing="0" style="margin: 32px 0;">
  <tr>
    <td style="background-color: #374151; border-radius: 8px; text-align: center;">
      <a href="${url}" style="display: inline-block; padding: 16px 32px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px;">
        ${text}
      </a>
    </td>
  </tr>
</table>
  `.trim()
}

/**
 * Generate invitation email HTML
 */
export function invitationEmail(data: InvitationEmailData): { html: string; text: string } {
  const roleDisplay = data.role === 'admin' ? 'Administrator' : 'Team Member'

  const content = `
<h2 style="margin: 0 0 16px 0; color: #111827; font-size: 24px; font-weight: 700;">
  You're Invited!
</h2>

<p style="margin: 0 0 16px 0; color: #374151; font-size: 16px; line-height: 1.6;">
  Hi there,
</p>

<p style="margin: 0 0 16px 0; color: #374151; font-size: 16px; line-height: 1.6;">
  <strong>${data.inviterName}</strong> has invited you to join <strong>${data.organizationName}</strong> on Approval Orbit as a <strong>${roleDisplay}</strong>.
</p>

${data.personalMessage ? `
<div style="background-color: #f3f4f6; border-left: 4px solid #374151; padding: 16px 20px; margin: 24px 0; border-radius: 4px;">
  <p style="margin: 0; color: #1f2937; font-size: 14px; font-style: italic; line-height: 1.6;">
    "${data.personalMessage}"
  </p>
</div>
` : ''}

<p style="margin: 24px 0 16px 0; color: #374151; font-size: 16px; line-height: 1.6;">
  Approval Orbit is a collaborative platform for creating, reviewing, and approving visual assets like prepaid cards, checks, and email templates. Click the button below to accept your invitation and get started:
</p>

${button('Accept Invitation', data.inviteLink)}

<div style="background-color: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 16px; margin: 24px 0;">
  <p style="margin: 0; color: #92400e; font-size: 14px;">
    ⏰ <strong>This invitation expires in ${data.expiresInDays} days.</strong>
  </p>
</div>

<p style="margin: 24px 0 8px 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
  If the button doesn't work, copy and paste this link into your browser:
</p>
<p style="margin: 0; word-break: break-all;">
  <a href="${data.inviteLink}" style="color: #374151; font-size: 13px;">${data.inviteLink}</a>
</p>

<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;" />

<p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
  Best regards,<br />
  The Approval Orbit Team
</p>
  `.trim()

  const text = `
You're Invited to ${data.organizationName} on Approval Orbit!

Hi there,

${data.inviterName} has invited you to join ${data.organizationName} on Approval Orbit as a ${roleDisplay}.

${data.personalMessage ? `Personal message from ${data.inviterName}:\n"${data.personalMessage}"\n\n` : ''}

Approval Orbit is a collaborative platform for creating, reviewing, and approving visual assets.

Click here to accept your invitation:
${data.inviteLink}

⏰ This invitation expires in ${data.expiresInDays} days.

Best regards,
The Approval Orbit Team

---
If you didn't expect this email, you can safely ignore it.
  `.trim()

  return {
    html: baseTemplate(content),
    text
  }
}

/**
 * Generate reminder email HTML
 */
export function reminderEmail(data: ReminderEmailData): { html: string; text: string } {
  const roleDisplay = data.role === 'admin' ? 'Administrator' : 'Team Member'
  const reminderText = data.reminderCount === 1 ? 'First reminder' : `Reminder #${data.reminderCount}`

  const content = `
<h2 style="margin: 0 0 16px 0; color: #111827; font-size: 24px; font-weight: 700;">
  Invitation Reminder
</h2>

<div style="background-color: #dbeafe; border-left: 4px solid #3b82f6; padding: 16px 20px; margin: 0 0 24px 0; border-radius: 4px;">
  <p style="margin: 0; color: #1e40af; font-size: 14px; font-weight: 600;">
    📬 ${reminderText}: Your invitation is still waiting
  </p>
</div>

<p style="margin: 0 0 16px 0; color: #374151; font-size: 16px; line-height: 1.6;">
  Hi there,
</p>

<p style="margin: 0 0 16px 0; color: #374151; font-size: 16px; line-height: 1.6;">
  You still have a pending invitation to join <strong>${data.organizationName}</strong> on Approval Orbit as a <strong>${roleDisplay}</strong>.
</p>

<p style="margin: 0 0 16px 0; color: #374151; font-size: 16px; line-height: 1.6;">
  Don't miss out on collaborating with your team! Click below to accept your invitation:
</p>

${button('Accept Invitation', data.inviteLink)}

<div style="background-color: ${data.daysRemaining <= 2 ? '#fee2e2' : '#fef3c7'}; border: 1px solid ${data.daysRemaining <= 2 ? '#fca5a5' : '#fcd34d'}; border-radius: 8px; padding: 16px; margin: 24px 0;">
  <p style="margin: 0; color: ${data.daysRemaining <= 2 ? '#991b1b' : '#92400e'}; font-size: 14px;">
    ${data.daysRemaining <= 2 ? '⚠️' : '⏰'} <strong>This invitation expires in ${data.daysRemaining} ${data.daysRemaining === 1 ? 'day' : 'days'}.</strong>
  </p>
</div>

<p style="margin: 24px 0 8px 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
  If the button doesn't work, copy and paste this link into your browser:
</p>
<p style="margin: 0; word-break: break-all;">
  <a href="${data.inviteLink}" style="color: #374151; font-size: 13px;">${data.inviteLink}</a>
</p>

<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;" />

<p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
  Best regards,<br />
  The Approval Orbit Team
</p>
  `.trim()

  const text = `
Invitation Reminder - ${data.organizationName}

${reminderText}: Your invitation is still waiting

Hi there,

You still have a pending invitation to join ${data.organizationName} on Approval Orbit as a ${roleDisplay}.

Don't miss out on collaborating with your team!

Click here to accept your invitation:
${data.inviteLink}

${data.daysRemaining <= 2 ? '⚠️' : '⏰'} This invitation expires in ${data.daysRemaining} ${data.daysRemaining === 1 ? 'day' : 'days'}.

Best regards,
The Approval Orbit Team

---
If you didn't expect this email, you can safely ignore it.
  `.trim()

  return {
    html: baseTemplate(content),
    text
  }
}
