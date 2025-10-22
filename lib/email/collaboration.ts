import { sendEmail } from './sendgrid';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

interface ReviewRequestEmailOptions {
  to: string;
  reviewerName: string;
  inviterName: string;
  mockupName: string;
  mockupId: string;
  message?: string;
}

/**
 * Send review request email to invited reviewer
 */
export async function sendReviewRequestEmail({
  to,
  reviewerName,
  inviterName,
  mockupName,
  mockupId,
  message
}: ReviewRequestEmailOptions) {
  const mockupUrl = `${APP_URL}/mockups/${mockupId}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px 20px;
          border-radius: 8px 8px 0 0;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
        }
        .content {
          background: #ffffff;
          padding: 30px;
          border: 1px solid #e0e0e0;
          border-top: none;
        }
        .message-box {
          background: #f8f9fa;
          border-left: 4px solid #667eea;
          padding: 15px;
          margin: 20px 0;
          font-style: italic;
        }
        .button {
          display: inline-block;
          background: #667eea;
          color: white;
          text-decoration: none;
          padding: 12px 30px;
          border-radius: 6px;
          margin: 20px 0;
          font-weight: 600;
        }
        .button:hover {
          background: #5568d3;
        }
        .footer {
          text-align: center;
          padding: 20px;
          color: #666;
          font-size: 12px;
        }
        .mockup-info {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 6px;
          margin: 15px 0;
        }
        .mockup-info strong {
          color: #667eea;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🎨 Review Request</h1>
      </div>

      <div class="content">
        <p>Hi ${reviewerName},</p>

        <p><strong>${inviterName}</strong> has invited you to review a mockup:</p>

        <div class="mockup-info">
          <strong>Mockup:</strong> ${mockupName}
        </div>

        ${message ? `
        <div class="message-box">
          <strong>Message from ${inviterName}:</strong><br>
          "${message}"
        </div>
        ` : ''}

        <p>You can view the mockup, add visual annotations with drawing tools, leave comments, and approve or request changes.</p>

        <div style="text-align: center;">
          <a href="${mockupUrl}" class="button">View & Review Mockup</a>
        </div>

        <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666; font-size: 14px;">
          This is a collaboration request from Asset Studio. If you have any questions, please contact ${inviterName}.
        </p>
      </div>

      <div class="footer">
        <p>© ${new Date().getFullYear()} Asset Studio. All rights reserved.</p>
        <p>Powered by Choice Digital</p>
      </div>
    </body>
    </html>
  `;

  const text = `
Hi ${reviewerName},

${inviterName} has invited you to review a mockup: "${mockupName}"

${message ? `Message from ${inviterName}: "${message}"` : ''}

View and review the mockup here: ${mockupUrl}

You can add visual annotations, leave comments, and approve or request changes.

---
© ${new Date().getFullYear()} Asset Studio
Powered by Choice Digital
  `;

  return sendEmail({
    to,
    subject: `[Asset Studio] ${inviterName} invited you to review: ${mockupName}`,
    html,
    text
  });
}

interface CommentNotificationEmailOptions {
  to: string;
  recipientName: string;
  commenterName: string;
  mockupName: string;
  mockupId: string;
  commentText: string;
}

/**
 * Send notification when someone comments on a mockup
 */
export async function sendCommentNotificationEmail({
  to,
  recipientName,
  commenterName,
  mockupName,
  mockupId,
  commentText
}: CommentNotificationEmailOptions) {
  const mockupUrl = `${APP_URL}/mockups/${mockupId}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px 20px;
          border-radius: 8px 8px 0 0;
          text-align: center;
        }
        .content {
          background: #ffffff;
          padding: 30px;
          border: 1px solid #e0e0e0;
          border-top: none;
        }
        .comment-box {
          background: #f8f9fa;
          border-left: 4px solid #667eea;
          padding: 15px;
          margin: 20px 0;
        }
        .button {
          display: inline-block;
          background: #667eea;
          color: white;
          text-decoration: none;
          padding: 12px 30px;
          border-radius: 6px;
          margin: 20px 0;
          font-weight: 600;
        }
        .footer {
          text-align: center;
          padding: 20px;
          color: #666;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>💬 New Comment</h1>
      </div>

      <div class="content">
        <p>Hi ${recipientName},</p>

        <p><strong>${commenterName}</strong> commented on <strong>${mockupName}</strong>:</p>

        <div class="comment-box">
          "${commentText}"
        </div>

        <div style="text-align: center;">
          <a href="${mockupUrl}" class="button">View Mockup & Reply</a>
        </div>
      </div>

      <div class="footer">
        <p>© ${new Date().getFullYear()} Asset Studio. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `[Asset Studio] New comment on: ${mockupName}`,
    html,
    text: `${commenterName} commented on ${mockupName}: "${commentText}"\n\nView and reply: ${mockupUrl}`
  });
}

interface ApprovalNotificationEmailOptions {
  to: string;
  creatorName: string;
  reviewerName: string;
  mockupName: string;
  mockupId: string;
  approved: boolean;
  note?: string;
}

/**
 * Send notification when a reviewer approves or requests changes
 */
export async function sendApprovalNotificationEmail({
  to,
  creatorName,
  reviewerName,
  mockupName,
  mockupId,
  approved,
  note
}: ApprovalNotificationEmailOptions) {
  const mockupUrl = `${APP_URL}/mockups/${mockupId}`;
  const action = approved ? 'approved' : 'requested changes on';
  const emoji = approved ? '✅' : '⚠️';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: ${approved ? 'linear-gradient(135deg, #56ab2f 0%, #a8e063 100%)' : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'};
          color: white;
          padding: 30px 20px;
          border-radius: 8px 8px 0 0;
          text-align: center;
        }
        .content {
          background: #ffffff;
          padding: 30px;
          border: 1px solid #e0e0e0;
          border-top: none;
        }
        .button {
          display: inline-block;
          background: #667eea;
          color: white;
          text-decoration: none;
          padding: 12px 30px;
          border-radius: 6px;
          margin: 20px 0;
          font-weight: 600;
        }
        .footer {
          text-align: center;
          padding: 20px;
          color: #666;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${emoji} ${approved ? 'Approved!' : 'Changes Requested'}</h1>
      </div>

      <div class="content">
        <p>Hi ${creatorName},</p>

        <p><strong>${reviewerName}</strong> ${action} <strong>${mockupName}</strong></p>

        ${note ? `<p style="background: #f8f9fa; padding: 15px; border-left: 4px solid #667eea; font-style: italic;">"${note}"</p>` : ''}

        <div style="text-align: center;">
          <a href="${mockupUrl}" class="button">View Mockup</a>
        </div>
      </div>

      <div class="footer">
        <p>© ${new Date().getFullYear()} Asset Studio. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `[Asset Studio] ${reviewerName} ${action} ${mockupName}`,
    html,
    text: `${reviewerName} ${action} ${mockupName}${note ? `\n\n"${note}"` : ''}\n\nView mockup: ${mockupUrl}`
  });
}
