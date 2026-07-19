'use strict';

const nodemailer = require('nodemailer');
const { EMAIL_USER, EMAIL_PASSWORD } = require('../config');

/**
 * Send a task-assignment email via Gmail SMTP.
 * Silently skips if credentials are not configured.
 */
async function sendTaskEmail({ toEmail, employeeName, task, deadline, priority, meetingTitle, senderName, senderEmail }) {
  if (!EMAIL_USER || !EMAIL_PASSWORD) {
    console.log('[Email] Credentials not configured — skipping notification.');
    return false;
  }

  const priorityColor = { High: '#ef4444', Medium: '#f59e0b', Low: '#10b981' }[priority] || '#94a3b8';

  const html = `
  <html>
  <body style="font-family: Inter, Arial, sans-serif; background: #0f172a; margin: 0; padding: 32px;">
    <div style="max-width: 520px; margin: 0 auto; background: #1e293b; border-radius: 12px; border: 1px solid #334155; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #6366f1, #818cf8); padding: 24px; color: white;">
        <div style="font-size: 20px; margin-bottom: 4px;">⚡ ActionFlow</div>
        <div style="font-size: 13px; opacity: 0.8;">AI Meeting Automation</div>
      </div>
      <div style="padding: 28px;">
        <h2 style="color: #f1f5f9; margin: 0 0 8px; font-size: 18px;">Hi ${employeeName},</h2>
        <p style="color: #94a3b8; margin: 0 0 24px; font-size: 14px;">
          You've been assigned a task from the meeting: <strong style="color: #f1f5f9;">${meetingTitle}</strong>
        </p>
        <div style="background: #0f172a; border-radius: 8px; padding: 20px; margin-bottom: 24px; border: 1px solid #334155;">
          <p style="margin: 0 0 14px;">
            <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; font-weight: 600;">Task</span><br>
            <span style="color: #f1f5f9; font-size: 15px; font-weight: 600;">${task}</span>
          </p>
          <p style="margin: 0 0 14px;">
            <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; font-weight: 600;">Deadline</span><br>
            <span style="color: #f1f5f9;">${deadline}</span>
          </p>
          <p style="margin: 0;">
            <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; font-weight: 600;">Priority</span><br>
            <span style="color: ${priorityColor}; font-weight: 600;">${priority}</span>
          </p>
        </div>
        <p style="color: #475569; font-size: 12px; margin: 0;">
          This email was sent automatically by AI Meeting ActionFlow.
        </p>
      </div>
    </div>
  </body>
  </html>`;

  const fromHeader = senderName ? `"${senderName} via ActionFlow" <${EMAIL_USER}>` : `"${EMAIL_USER}" <${EMAIL_USER}>`;
  const replyToHeader = senderEmail || EMAIL_USER;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: EMAIL_USER, pass: EMAIL_PASSWORD },
  });

  try {
    await transporter.sendMail({
      from: fromHeader,
      replyTo: replyToHeader,
      to: toEmail,
      subject: `Task Assigned: ${task.substring(0, 60)}`,
      html,
    });
    console.log(`[Email] Sent → ${toEmail}`);
    return true;
  } catch (err) {
    console.error(`[Email] Failed → ${toEmail}:`, err.message);
    return false;
  }
}

module.exports = { sendTaskEmail };
