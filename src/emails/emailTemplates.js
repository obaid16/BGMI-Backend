/**
 * Professional HTML Email Templates for NIT BGMI Championship
 * Theme: Dark Esports (#0a0b0e background, #e50914 BGMI red, #c8aa6e gold accents, white text)
 */

function baseHeader(subtitle = 'OFFICIAL ESPORTS NOTIFICATION') {
  return `
    <div style="text-align: center; padding-bottom: 24px; border-bottom: 1px solid rgba(255,255,255,0.1);">
      <h1 style="font-family: 'Montserrat', 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 24px; font-weight: 900; color: #ffffff; letter-spacing: 3px; margin: 0; text-transform: uppercase;">
        NIT BGMI CHAMPIONSHIP
      </h1>
      <p style="font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 11px; color: #e50914; font-weight: 800; letter-spacing: 3px; margin-top: 6px; text-transform: uppercase;">
        ${subtitle}
      </p>
    </div>
  `;
}

function baseFooter() {
  return `
    <div style="text-align: center; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.1); font-size: 11px; color: #64748b; font-family: sans-serif;">
      <p style="margin: 0; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">NIT BGMI Esports Committee • Tournament Operations</p>
      <p style="margin: 6px 0 0 0; color: #475569;">Nexcore Institute of Technology • Custom Room Referees Active</p>
      <p style="margin: 6px 0 0 0; color: #334155; font-size: 10px;">This is an automated operational notification. Please keep your Registration ID confidential.</p>
    </div>
  `;
}

function baseWrapper(contentHtml, subtitle) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>NIT BGMI Championship Notification</title>
      </head>
      <body style="background-color: #050608; margin: 0; padding: 24px 12px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
        <div style="background-color: #0a0b0e; color: #f4f5f8; padding: 32px 24px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid rgba(229, 9, 20, 0.3); box-shadow: 0 10px 30px rgba(0,0,0,0.8);">
          ${baseHeader(subtitle)}
          <div style="padding: 24px 0;">
            ${contentHtml}
          </div>
          ${baseFooter()}
        </div>
      </body>
    </html>
  `;
}

/**
 * 1. Squad Registration Received Confirmation Template
 */
function registrationConfirmationTemplate({ captainName, teamName, registrationId, collegeName, captainPhone, playersCount }) {
  const content = `
    <p style="font-size: 16px; color: #ffffff; margin-bottom: 16px;">Hello <strong style="color: #e50914;">${captainName}</strong>,</p>
    <p style="font-size: 14px; color: #94a3b8; line-height: 1.6; margin-bottom: 20px;">
      Your squad <strong style="color: #ffffff;">"${teamName}"</strong> has successfully registered for the official <strong>NIT BGMI Esports Championship 2026</strong>.
    </p>

    <div style="background-color: #12141c; padding: 20px; border-radius: 8px; border-left: 4px solid #22c55e; margin: 20px 0;">
      <p style="margin: 0; font-size: 10px; color: #c8aa6e; font-weight: 800; text-transform: uppercase; letter-spacing: 2px;">Official Squad Pass ID</p>
      <p style="margin: 6px 0 0 0; font-size: 28px; font-weight: 900; color: #ffffff; letter-spacing: 3px;">${registrationId}</p>
      <p style="margin: 8px 0 0 0; font-size: 11px; color: #22c55e; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">● STATUS: VERIFIED & CONFIRMED</p>
    </div>

    <div style="background-color: #12141c; padding: 18px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.06); margin-bottom: 24px;">
      <h3 style="font-size: 12px; color: #c8aa6e; text-transform: uppercase; margin: 0 0 12px 0; letter-spacing: 1.5px;">Registered Squad Roster Details</h3>
      <p style="font-size: 13px; color: #cbd5e1; margin: 6px 0;"><strong>Squad Name:</strong> <strong style="color: #ffffff;">${teamName}</strong></p>
      <p style="font-size: 13px; color: #cbd5e1; margin: 6px 0;"><strong>College / Campus:</strong> ${collegeName || 'Campus Squad'}</p>
      <p style="font-size: 13px; color: #cbd5e1; margin: 6px 0;"><strong>Captain Contact:</strong> ${captainPhone}</p>
      <p style="font-size: 13px; color: #cbd5e1; margin: 6px 0;"><strong>Roster Size:</strong> ${playersCount || 4} Starters Submitted</p>
    </div>

    <p style="font-size: 13px; color: #94a3b8; line-height: 1.6; margin-bottom: 24px;">
      Your squad registration and player roster have been <strong style="color: #22c55e;">VERIFIED</strong>. Please keep your Squad Pass ID handy for custom room lobby entry.
    </p>

    <div style="text-align: center; margin: 28px 0;">
      <a href="https://chat.whatsapp.com/E8vPQ1JZOPV4BNPF9FPLKG" target="_blank" style="background-color: #16a34a; color: #ffffff; font-weight: 900; font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; padding: 14px 28px; border-radius: 6px; text-decoration: none; display: inline-block;">
        Join Captains WhatsApp Community
      </a>
    </div>
  `;
  return baseWrapper(content, 'SQUAD REGISTRATION VERIFIED');
}

/**
 * 2. Squad Registration Approval Template
 */
function registrationApprovalTemplate({ captainName, teamName, registrationId }) {
  const content = `
    <div style="text-align: center; margin-bottom: 20px;">
      <span style="font-size: 42px;">🎉</span>
      <h2 style="font-size: 22px; font-weight: 900; color: #22c55e; margin: 8px 0; text-transform: uppercase; letter-spacing: 1px;">SQUAD APPROVED!</h2>
    </div>

    <p style="font-size: 15px; color: #ffffff; margin-bottom: 16px;">Hello <strong style="color: #22c55e;">${captainName}</strong>,</p>
    <p style="font-size: 14px; color: #94a3b8; line-height: 1.6; margin-bottom: 20px;">
      Great news! Your squad application for <strong style="color: #ffffff;">"${teamName}"</strong> has been officially <span style="color: #22c55e; font-weight: bold;">VERIFIED AND APPROVED</span> for the NIT BGMI Championship 2026.
    </p>

    <div style="background-color: #12141c; padding: 20px; border-radius: 8px; border: 1px solid #22c55e; text-align: center; margin: 20px 0;">
      <p style="margin: 0; font-size: 11px; color: #c8aa6e; font-weight: 800; text-transform: uppercase; letter-spacing: 2px;">Official Tournament Pass ID</p>
      <p style="margin: 6px 0 0 0; font-size: 32px; font-weight: 900; color: #fbbf24; letter-spacing: 3px;">${registrationId}</p>
      <p style="margin: 6px 0 0 0; font-size: 11px; color: #22c55e; font-weight: bold;">● STATUS: APPROVED & LOBBY READY</p>
    </div>

    <p style="font-size: 13px; color: #94a3b8; line-height: 1.6; margin-bottom: 24px;">
      Please stay tuned to the official match schedule. Custom room IDs and passwords will be dispatched prior to your scheduled match slot.
    </p>

    <div style="text-align: center; margin: 24px 0;">
      <a href="http://localhost:3000/matches" target="_blank" style="background-color: #e50914; color: #ffffff; font-weight: 900; font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; padding: 14px 28px; border-radius: 6px; text-decoration: none; display: inline-block;">
        View Tournament Schedule
      </a>
    </div>
  `;
  return baseWrapper(content, 'SQUAD VERIFIED & APPROVED');
}

/**
 * 3. Squad Registration Rejection Template
 */
function registrationRejectionTemplate({ captainName, teamName, registrationId, rejectionReason }) {
  const content = `
    <div style="text-align: center; margin-bottom: 20px;">
      <span style="font-size: 42px;">❌</span>
      <h2 style="font-size: 22px; font-weight: 900; color: #ef4444; margin: 8px 0; text-transform: uppercase; letter-spacing: 1px;">SQUAD APPLICATION UPDATE</h2>
    </div>

    <p style="font-size: 15px; color: #ffffff; margin-bottom: 16px;">Hello <strong>${captainName}</strong>,</p>
    <p style="font-size: 14px; color: #94a3b8; line-height: 1.6; margin-bottom: 20px;">
      Your squad application for <strong style="color: #ffffff;">"${teamName}"</strong> (ID: <code style="color: #fbbf24;">${registrationId}</code>) was reviewed by tournament referees and was <span style="color: #ef4444; font-weight: bold;">REJECTED</span>.
    </p>

    <div style="background-color: #12141c; padding: 18px; border-radius: 8px; border-left: 4px solid #ef4444; margin: 20px 0;">
      <p style="margin: 0; font-size: 10px; color: #94a3b8; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px;">Reason for Rejection</p>
      <p style="margin: 6px 0 0 0; font-size: 14px; font-weight: bold; color: #f87171;">${rejectionReason || 'Roster details or student verification proofs did not pass review.'}</p>
    </div>

    <p style="font-size: 13px; color: #94a3b8; line-height: 1.6;">
      You may re-register with updated student proofs or contact tournament support for assistance.
    </p>
  `;
  return baseWrapper(content, 'APPLICATION REJECTED');
}

/**
 * 4. OTP Verification Email Template
 */
function otpEmailTemplate({ userName, otpCode }) {
  const content = `
    <p style="font-size: 15px; color: #ffffff; margin-bottom: 16px;">Hello <strong>${userName || 'Player'}</strong>,</p>
    <p style="font-size: 14px; color: #94a3b8; line-height: 1.6; margin-bottom: 20px;">
      Use the following One-Time Password (OTP) to verify your account or complete your action on the NIT BGMI Championship platform:
    </p>

    <div style="background-color: #12141c; padding: 24px; border-radius: 8px; border: 1px solid rgba(229,9,20,0.5); text-align: center; margin: 24px 0;">
      <p style="margin: 0; font-size: 10px; color: #c8aa6e; font-weight: 800; text-transform: uppercase; letter-spacing: 2px;">Verification OTP Code</p>
      <p style="margin: 8px 0 0 0; font-size: 36px; font-weight: 900; color: #e50914; letter-spacing: 8px;">${otpCode}</p>
      <p style="margin: 8px 0 0 0; font-size: 11px; color: #64748b;">Valid for 10 minutes. Do not share this code with anyone.</p>
    </div>
  `;
  return baseWrapper(content, 'SECURITY OTP VERIFICATION');
}

/**
 * 5. Custom Match Lobby Credentials Email Template
 */
function matchLobbyEmailTemplate({ captainName, teamName, matchTitle, roomId, password, time, slotNumber }) {
  const content = `
    <p style="font-size: 15px; color: #ffffff; margin-bottom: 16px;">Attention Captain <strong style="color: #e50914;">${captainName}</strong> (${teamName}),</p>
    <p style="font-size: 14px; color: #94a3b8; line-height: 1.6; margin-bottom: 20px;">
      Here are the custom room credentials for your upcoming match: <strong style="color: #ffffff;">${matchTitle || 'BGMI Custom Match'}</strong>.
    </p>

    <div style="background-color: #12141c; padding: 20px; border-radius: 8px; border: 1px solid #e50914; margin: 20px 0;">
      <h3 style="font-size: 12px; color: #c8aa6e; text-transform: uppercase; margin: 0 0 14px 0; letter-spacing: 1.5px;">Match Lobby Entry Details</h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr>
          <td style="padding: 6px 0; color: #94a3b8;">Room ID:</td>
          <td style="padding: 6px 0; color: #ffffff; font-weight: 900; font-family: monospace; font-size: 18px;">${roomId}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #94a3b8;">Password:</td>
          <td style="padding: 6px 0; color: #fbbf24; font-weight: 900; font-family: monospace; font-size: 18px;">${password}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #94a3b8;">Match Start Time:</td>
          <td style="padding: 6px 0; color: #ffffff; font-weight: bold;">${time || 'Scheduled Time'}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #94a3b8;">Assigned Slot:</td>
          <td style="padding: 6px 0; color: #22c55e; font-weight: 900;">Slot #${slotNumber || 'Assigned'}</td>
        </tr>
      </table>
    </div>

    <p style="font-size: 12px; color: #ef4444; font-weight: bold; line-height: 1.5;">
      ⚠️ Mandatory Rule: All players must join their designated slot 10 minutes before launch. Emulators and unauthorized tools will result in instant disqualification.
    </p>
  `;
  return baseWrapper(content, 'CUSTOM ROOM CREDENTIALS');
}

/**
 * 6. Tournament Update Email Template
 */
function tournamentUpdateEmailTemplate({ recipientName, title, message, actionUrl }) {
  const content = `
    <p style="font-size: 15px; color: #ffffff; margin-bottom: 16px;">Hello <strong>${recipientName || 'Esports Player'}</strong>,</p>
    <p style="font-size: 14px; color: #94a3b8; line-height: 1.6; margin-bottom: 20px;">
      An important announcement has been published regarding the <strong>NIT BGMI Championship 2026</strong>.
    </p>

    <div style="background-color: #12141c; padding: 20px; border-radius: 8px; border-left: 4px solid #c8aa6e; margin: 20px 0;">
      <h3 style="font-size: 16px; font-weight: 900; color: #ffffff; margin: 0 0 10px 0;">${title}</h3>
      <p style="font-size: 13px; color: #cbd5e1; line-height: 1.6; margin: 0;">${message}</p>
    </div>

    ${actionUrl ? `
      <div style="text-align: center; margin: 24px 0;">
        <a href="${actionUrl}" target="_blank" style="background-color: #e50914; color: #ffffff; font-weight: 900; font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; padding: 14px 28px; border-radius: 6px; text-decoration: none; display: inline-block;">
          View Official Announcement
        </a>
      </div>
    ` : ''}
  `;
  return baseWrapper(content, 'TOURNAMENT ANNOUNCEMENT');
}

/**
 * 7. Admin Alert Notification Email Template
 */
function adminNotificationEmailTemplate({ subject, details }) {
  const content = `
    <h3 style="font-size: 16px; font-weight: 900; color: #fbbf24; margin: 0 0 12px 0;">ADMIN NOTIFICATION</h3>
    <p style="font-size: 14px; color: #ffffff; font-weight: bold;">${subject}</p>
    <div style="background-color: #12141c; padding: 16px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1); font-size: 13px; color: #cbd5e1; line-height: 1.5; margin: 16px 0;">
      ${details}
    </div>
  `;
  return baseWrapper(content, 'ADMIN ALERT');
}

module.exports = {
  registrationConfirmationTemplate,
  registrationApprovalTemplate,
  registrationRejectionTemplate,
  otpEmailTemplate,
  matchLobbyEmailTemplate,
  tournamentUpdateEmailTemplate,
  adminNotificationEmailTemplate
};
