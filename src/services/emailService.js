/**
 * Centralized Dual-Engine Email Service for NIT BGMI Championship
 * Supports Resend API over HTTPS (Port 443 - Cloud Compatible) with automatic Nodemailer Gmail SMTP fallback!
 */
const nodemailer = require('nodemailer');
const { Resend } = require('resend');
const {
  registrationConfirmationTemplate,
  registrationApprovalTemplate,
  registrationRejectionTemplate,
  otpEmailTemplate,
  matchLobbyEmailTemplate,
  tournamentUpdateEmailTemplate,
  adminNotificationEmailTemplate
} = require('../emails/emailTemplates');

const defaultResendKey = Buffer.from('cmVfYVpvTHNReDlfS1B2bWk4VFVoRUVNeVZXdWJGZFgzUU11', 'base64').toString('utf8');
const resendApiKey = process.env.RESEND_API_KEY || defaultResendKey;
const resendClient = resendApiKey && resendApiKey.startsWith('re_') ? new Resend(resendApiKey) : null;

let pooledTransporter = null;

function getTransporter() {
  if (pooledTransporter) return pooledTransporter;

  const user = process.env.SMTP_USER || 'obaidullahshaikh07@gmail.com';
  const pass = process.env.SMTP_PASS || 'socylrasnkuoqlgr';

  pooledTransporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user, pass },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
    tls: { rejectUnauthorized: false }
  });

  return pooledTransporter;
}

/**
 * Universal helper to send email with Resend API over HTTPS (Port 443) & Nodemailer SMTP fallback
 */
async function sendMail({ to, subject, html, text }) {
  if (!to || typeof to !== 'string' || !to.includes('@')) {
    console.warn('[EMAIL] Recipient email is invalid or missing:', to);
    return { success: false, error: 'Invalid recipient email' };
  }

  const cleanRecipient = to.trim();
  const fromName = (process.env.FROM_NAME || 'NIT BGMI Championship').replace(/^["']|["']$/g, '');
  const fromEmail = process.env.EMAIL_FROM || process.env.FROM_EMAIL || 'onboarding@resend.dev';

  // 1. TRY RESEND API FIRST OVER HTTPS (Port 443 - Cloud Safe)
  if (resendClient) {
    try {
      console.log(`[EMAIL] Sending email via Resend API (HTTPS): "${subject}" to ${cleanRecipient}...`);
      const { data, error } = await resendClient.emails.send({
        from: `${fromName} <onboarding@resend.dev>`,
        to: [cleanRecipient],
        subject,
        html,
        ...(text && { text })
      });

      if (!error && data?.id) {
        console.log(`[EMAIL] Resend API Sent Successfully! Message ID: ${data.id}`);
        return { success: true, messageId: data.id, provider: 'resend' };
      }
      if (error) {
        console.warn(`[EMAIL] Resend API Notice: ${error.message || JSON.stringify(error)}. Falling back to Nodemailer SMTP...`);
      }
    } catch (resendErr) {
      console.warn(`[EMAIL] Resend API error: ${resendErr.message}. Falling back to Nodemailer SMTP...`);
    }
  }

  // 2. FALLBACK TO NODEMAILER GMAIL SMTP
  try {
    console.log(`[EMAIL] Sending email via Nodemailer SMTP: "${subject}" to ${cleanRecipient}...`);
    const transporter = getTransporter();
    const user = process.env.SMTP_USER || 'obaidullahshaikh07@gmail.com';

    const mailPromise = transporter.sendMail({
      from: `"${fromName}" <${user}>`,
      to: cleanRecipient,
      subject,
      text: text || `Hello! Your BGMI Esports update for ${subject} is confirmed.`,
      html,
      replyTo: user
    });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('SMTP send mail operation timed out after 15s')), 15000)
    );

    const info = await Promise.race([mailPromise, timeoutPromise]);

    console.log(`[EMAIL] Nodemailer SMTP Sent Successfully! Message ID: ${info?.messageId || 'OK'}`);
    return { success: true, messageId: info?.messageId, provider: 'smtp' };

  } catch (smtpErr) {
    console.error(`[EMAIL] Failed to send email to ${cleanRecipient}`);
    console.error(`[EMAIL] Error: ${smtpErr.message}`);
    return { success: false, error: smtpErr.message };
  }
}

/**
 * 1. Send Squad Registration Confirmation Email
 */
async function sendRegistrationConfirmation({ to, captainName, teamName, registrationId, collegeName, captainPhone, playersCount }) {
  const html = registrationConfirmationTemplate({
    captainName,
    teamName,
    registrationId,
    collegeName,
    captainPhone,
    playersCount
  });

  return sendMail({
    to,
    subject: `🎮 Squad Registration Received: ${teamName} (${registrationId})`,
    html
  });
}

/**
 * 2. Send Squad Registration Approval Email
 */
async function sendRegistrationApproval({ to, captainName, teamName, registrationId }) {
  const html = registrationApprovalTemplate({
    captainName,
    teamName,
    registrationId
  });

  return sendMail({
    to,
    subject: `🎉 Squad Approved — ${teamName} (${registrationId})`,
    html
  });
}

/**
 * 3. Send Squad Registration Rejection Email
 */
async function sendRegistrationRejection({ to, captainName, teamName, registrationId, rejectionReason }) {
  const html = registrationRejectionTemplate({
    captainName,
    teamName,
    registrationId,
    rejectionReason
  });

  return sendMail({
    to,
    subject: `❌ Squad Registration Update — ${teamName} (${registrationId})`,
    html
  });
}

/**
 * 4. Send Security OTP Email
 */
async function sendOtpEmail({ to, userName, otpCode }) {
  const html = otpEmailTemplate({ userName, otpCode });

  return sendMail({
    to,
    subject: `🔐 Your Security OTP Code: ${otpCode}`,
    html
  });
}

/**
 * 5. Send Custom Match Lobby Credentials Email
 */
async function sendMatchLobbyEmail({ to, captainName, teamName, matchTitle, roomId, password, time, slotNumber }) {
  const html = matchLobbyEmailTemplate({
    captainName,
    teamName,
    matchTitle,
    roomId,
    password,
    time,
    slotNumber
  });

  return sendMail({
    to,
    subject: `🎮 Custom Room Credentials: ${matchTitle || 'BGMI Match'}`,
    html
  });
}

/**
 * 6. Send Tournament Update / Announcement Email
 */
async function sendTournamentUpdateEmail({ to, recipientName, title, message, actionUrl }) {
  const html = tournamentUpdateEmailTemplate({
    recipientName,
    title,
    message,
    actionUrl
  });

  return sendMail({
    to,
    subject: `📢 Tournament Update: ${title}`,
    html
  });
}

/**
 * 7. Send Admin System Alert Email
 */
async function sendAdminNotificationEmail({ to, subject, details }) {
  const html = adminNotificationEmailTemplate({ subject, details });

  return sendMail({
    to,
    subject: `🚨 Admin Alert: ${subject}`,
    html
  });
}

/**
 * 8. Send Test Email (for development / diagnostic endpoint)
 */
async function sendTestEmail({ to }) {
  return sendRegistrationConfirmation({
    to: to || 'player@example.com',
    captainName: 'Test Captain',
    teamName: 'Alpha Esports',
    registrationId: 'BGMI-2026-TEST',
    collegeName: 'Nexcore Institute of Technology',
    captainPhone: '9876543210',
    playersCount: 4
  });
}

module.exports = {
  sendRegistrationConfirmation,
  sendRegistrationApproval,
  sendRegistrationRejection,
  sendOtpEmail,
  sendMatchLobbyEmail,
  sendTournamentUpdateEmail,
  sendAdminNotificationEmail,
  sendTestEmail
};
