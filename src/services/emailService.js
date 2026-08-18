/**
 * Centralized Email Service for NIT BGMI Championship using Nodemailer Gmail SMTP
 * Sends real email notifications to ANY recipient (students, players, captains) without needing a domain!
 */
const nodemailer = require('nodemailer');
const {
  registrationConfirmationTemplate,
  registrationApprovalTemplate,
  registrationRejectionTemplate,
  otpEmailTemplate,
  matchLobbyEmailTemplate,
  tournamentUpdateEmailTemplate,
  adminNotificationEmailTemplate
} = require('../emails/emailTemplates');

let pooledTransporter = null;

function getTransporter() {
  if (pooledTransporter) return pooledTransporter;

  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const user = process.env.SMTP_USER || 'obaidullahshaikh07@gmail.com';
  const pass = process.env.SMTP_PASS || 'socylrasnkuoqlgr';
  const port = Number(process.env.SMTP_PORT) || 587;

  if (host.includes('gmail.com')) {
    pooledTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 8000
    });
  } else {
    pooledTransporter = nodemailer.createTransport({
      host,
      port,
      secure: process.env.SMTP_SECURE === 'true' || port === 465,
      auth: { user, pass },
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 8000,
      tls: { rejectUnauthorized: false }
    });
  }

  return pooledTransporter;
}

/**
 * Generic helper to send email with Nodemailer SMTP and clean error handling
 */
async function sendSmtpMail({ to, subject, html, text }) {
  if (!to || typeof to !== 'string' || !to.includes('@')) {
    console.warn('[EMAIL] Recipient email is invalid or missing:', to);
    return { success: false, error: 'Invalid recipient email' };
  }

  const cleanRecipient = to.trim();
  const transporter = getTransporter();
  const user = process.env.SMTP_USER || 'obaidullahshaikh07@gmail.com';
  const fromName = process.env.FROM_NAME || 'NIT BGMI Championship';
  const cleanFromName = fromName.replace(/^["']|["']$/g, '');
  const fromEmail = process.env.FROM_EMAIL || user;

  try {
    console.log(`[EMAIL] Sending email: "${subject}"...`);
    console.log(`[EMAIL] Recipient: ${cleanRecipient}`);

    const mailPromise = transporter.sendMail({
      from: `"${cleanFromName}" <${fromEmail}>`,
      to: cleanRecipient,
      subject,
      text,
      html,
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'high',
        'X-Mailer': 'NIT BGMI Esports Tournament Engine',
        'Reply-To': fromEmail
      }
    });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('SMTP send mail operation timed out after 10s')), 10000)
    );

    const info = await Promise.race([mailPromise, timeoutPromise]);

    console.log(`[EMAIL] Sent successfully`);
    console.log(`[EMAIL] Message ID: ${info?.messageId || 'OK'}`);
    return { success: true, messageId: info?.messageId };

  } catch (err) {
    console.error(`[EMAIL] Failed to send email to ${cleanRecipient}`);
    console.error(`[EMAIL] Error: ${err.message}`);
    return { success: false, error: err.message };
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

  return sendSmtpMail({
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

  return sendSmtpMail({
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

  return sendSmtpMail({
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

  return sendSmtpMail({
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

  return sendSmtpMail({
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

  return sendSmtpMail({
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

  return sendSmtpMail({
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
