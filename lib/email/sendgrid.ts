import sgMail from '@sendgrid/mail'

// Initialize SendGrid with API key
const apiKey = process.env.SENDGRID_API_KEY
if (!apiKey) {
  console.warn('SENDGRID_API_KEY is not set. Email sending will fail.')
} else {
  sgMail.setApiKey(apiKey)
}

export interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

/**
 * Send an email using SendGrid
 */
export async function sendEmail({ to, subject, html, text }: EmailOptions): Promise<boolean> {
  if (!apiKey) {
    console.error('Cannot send email: SENDGRID_API_KEY not configured')
    return false
  }

  try {
    const msg = {
      to,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL || 'noreply@approvalorbit.com',
        name: process.env.SENDGRID_FROM_NAME || 'Approval Orbit'
      },
      subject,
      html,
      text: text || stripHtml(html), // Fallback to stripped HTML if no text provided
    }

    await sgMail.send(msg)
    console.log(`Email sent successfully to ${to}`)
    return true
  } catch (error: any) {
    console.error('SendGrid error:', error)
    if (error.response) {
      console.error('SendGrid response body:', error.response.body)
    }
    return false
  }
}

/**
 * Simple HTML stripper for text fallback
 */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim()
}
