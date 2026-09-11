/**
 * Professional HTML Email Templates for NIT BGMI Championship
 * Theme: Modern Premium Light Theme (#f1f5f9 outer, #ffffff card, #0f172a text, #dc2626 red accent)
 */

const getBaseUrl = () => {
  const url = process.env.FRONTEND_URL || process.env.CLIENT_URL || 'https://bgmi-frontend-pied.vercel.app';
  return url.replace(/\/$/, '');
};

const WHATSAPP_GROUP_LINK = 'https://chat.whatsapp.com/Bqcb3HLgbup9vEmCauLfOF?s=cl&p=a&mlu=4&ilr=4';

function baseWrapper(contentHtml, subtitle = 'OFFICIAL ESPORTS NOTIFICATION') {
  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NIT BGMI Championship</title>
    <!--[if mso]>
    <noscript>
      <xml>
        <o:OfficeDocumentSettings>
          <o:PixelsPerInch>96</o:PixelsPerInch>
        </o:OfficeDocumentSettings>
      </xml>
    </noscript>
    <![endif]-->
  </head>
  <body style="background-color: #f1f5f9; margin: 0; padding: 28px 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #334155;">
    <div style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);">
      
      <!-- Top Metallic Accent Line -->
      <div style="height: 5px; background: linear-gradient(90deg, #dc2626 0%, #d97706 50%, #059669 100%);"></div>

      <!-- Header Banner -->
      <div style="padding: 28px 32px 20px 32px; text-align: center; border-bottom: 1px solid #f1f5f9; background-color: #ffffff;">
        <h1 style="font-size: 21px; font-weight: 900; color: #0f172a; letter-spacing: 2px; margin: 0; text-transform: uppercase;">
          NIT BGMI CHAMPIONSHIP
        </h1>
        <div style="display: inline-block; margin-top: 8px; padding: 4px 14px; background: #fee2e2; border: 1px solid #fca5a5; border-radius: 12px; font-size: 10px; font-weight: 700; color: #dc2626; letter-spacing: 1.5px; text-transform: uppercase;">
          ${subtitle}
        </div>
      </div>

      <!-- Main Body Content -->
      <div style="padding: 32px 32px; color: #334155; font-size: 14px; line-height: 1.6;">
        ${contentHtml}
      </div>

      <!-- Footer Banner -->
      <div style="padding: 20px 32px 28px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #64748b;">
        <p style="margin: 0 0 6px 0; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #475569;">
          NIT BGMI Esports Committee • Tournament Operations
        </p>
        <p style="margin: 0 0 8px 0; color: #64748b;">
          Nexcore Institute of Technology • Custom Room Referees Active
        </p>
        <p style="margin: 0; color: #94a3b8; font-size: 10px;">
          This is an automated operational notification. Please keep your Registration ID confidential.
        </p>
      </div>

    </div>
  </body>
</html>
  `;
}

/**
 * 1. Squad Registration Received Confirmation Template
 */
function registrationConfirmationTemplate({ captainName, teamName, registrationId, collegeName, captainPhone, playersCount }) {
  const baseUrl = getBaseUrl();
  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="display: inline-block; padding: 6px 16px; background: #fef3c7; border: 1px solid #fde68a; border-radius: 20px; color: #b45309; font-weight: 700; font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase;">
        ⏳ REGISTRATION RECEIVED
      </span>
      <h2 style="font-size: 24px; font-weight: 800; color: #0f172a; margin: 12px 0 0 0; letter-spacing: -0.5px;">
        APPLICATION UNDER REVIEW
      </h2>
    </div>

    <p style="font-size: 15px; color: #0f172a; margin-bottom: 16px;">Hello <strong style="color: #2563eb;">${captainName}</strong>,</p>
    <p style="font-size: 14px; color: #475569; line-height: 1.6; margin-bottom: 20px;">
      Your squad <strong style="color: #0f172a;">"${teamName}"</strong> has successfully submitted its registration for the <strong>NIT BGMI Championship 2026</strong>. Our tournament referees are currently reviewing your roster and student verification documents.
    </p>

    <!-- Pass Box -->
    <div style="background-color: #f8fafc; padding: 22px; border-radius: 12px; border: 1px solid #e2e8f0; text-align: center; margin: 24px 0;">
      <p style="margin: 0; font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 2px;">Official Registration ID</p>
      <p style="margin: 8px 0 0 0; font-size: 28px; font-weight: 900; color: #2563eb; letter-spacing: 4px; font-family: 'Courier New', Courier, monospace;">${registrationId}</p>
      <p style="margin: 8px 0 0 0; font-size: 11px; color: #b45309; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">● STATUS: PENDING REFEREE REVIEW</p>
    </div>

    <!-- Roster Details Box -->
    <div style="background-color: #f8fafc; padding: 18px 20px; border-radius: 10px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
      <h3 style="font-size: 11px; color: #b45309; text-transform: uppercase; margin: 0 0 12px 0; letter-spacing: 1.5px; font-weight: 800;">Submitted Roster Summary</h3>
      <p style="font-size: 13px; color: #334155; margin: 6px 0;"><strong>Squad Name:</strong> <strong style="color: #0f172a;">${teamName}</strong></p>
      <p style="font-size: 13px; color: #334155; margin: 6px 0;"><strong>College / Campus:</strong> ${collegeName || 'Campus Squad'}</p>
      <p style="font-size: 13px; color: #334155; margin: 6px 0;"><strong>Captain Contact:</strong> ${captainPhone}</p>
      <p style="font-size: 13px; color: #334155; margin: 6px 0;"><strong>Roster Size:</strong> ${playersCount || 4} Starters Submitted</p>
    </div>

    <p style="font-size: 13px; color: #475569; line-height: 1.6; margin-bottom: 28px;">
      You will receive a follow-up email notification as soon as your squad verification is completed by the tournament administration.
    </p>

    <!-- Action Buttons -->
    <div style="text-align: center; margin: 28px 0 12px 0;">
      <a href="${baseUrl}/matches" target="_blank" style="background-color: #2563eb; color: #ffffff; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; padding: 14px 26px; border-radius: 8px; text-decoration: none; display: inline-block; margin: 4px; box-shadow: 0 4px 10px rgba(37, 99, 235, 0.2);">
        View Match Schedule
      </a>
      <a href="${WHATSAPP_GROUP_LINK}" target="_blank" style="background-color: #16a34a; color: #ffffff; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; padding: 14px 26px; border-radius: 8px; text-decoration: none; display: inline-block; margin: 4px; box-shadow: 0 4px 10px rgba(22, 163, 74, 0.2);">
        Join WhatsApp Community
      </a>
    </div>
  `;
  return baseWrapper(content, 'REGISTRATION SUBMITTED');
}

/**
 * 2. Squad Registration Approval Template
 */
function registrationApprovalTemplate({ captainName, teamName, registrationId }) {
  const baseUrl = getBaseUrl();
  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="display: inline-block; padding: 6px 16px; background: #dcfce7; border: 1px solid #86efac; border-radius: 20px; color: #15803d; font-weight: 700; font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase;">
        ✓ APPROVED & LOBBY READY
      </span>
      <h2 style="font-size: 26px; font-weight: 800; color: #0f172a; margin: 12px 0 0 0; letter-spacing: -0.5px;">
        SQUAD APPROVED!
      </h2>
    </div>

    <p style="font-size: 15px; color: #0f172a; margin-bottom: 16px;">Hello <strong style="color: #15803d;">${captainName}</strong>,</p>
    <p style="font-size: 14px; color: #475569; line-height: 1.6; margin-bottom: 24px;">
      Great news! Your squad application for <strong style="color: #0f172a;">"${teamName}"</strong> has been officially <span style="color: #15803d; font-weight: 700;">VERIFIED AND APPROVED</span> for the NIT BGMI Championship 2026.
    </p>

    <!-- Pass Box -->
    <div style="background-color: #f8fafc; padding: 24px 20px; border-radius: 12px; border: 1px solid #86efac; text-align: center; margin: 24px 0; box-shadow: inset 0 1px 0 #ffffff;">
      <p style="margin: 0; font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 2px;">Official Tournament Pass ID</p>
      <p style="margin: 10px 0 4px 0; font-size: 32px; font-weight: 900; color: #d97706; letter-spacing: 4px; font-family: 'Courier New', Courier, monospace;">${registrationId}</p>
      <p style="margin: 8px 0 0 0; font-size: 11px; color: #15803d; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;">● STATUS: APPROVED & LOBBY READY</p>
    </div>

    <p style="font-size: 13px; color: #475569; line-height: 1.6; margin-bottom: 28px;">
      Please stay tuned to the official match schedule. Custom room IDs and passwords will be dispatched prior to your scheduled match slot.
    </p>

    <!-- Action Buttons -->
    <div style="text-align: center; margin: 28px 0 12px 0;">
      <a href="${baseUrl}/matches" target="_blank" style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: #ffffff; font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px; padding: 16px 34px; border-radius: 8px; text-decoration: none; display: inline-block; margin: 4px; box-shadow: 0 4px 14px rgba(220, 38, 38, 0.3);">
        View Tournament Schedule →
      </a>
      <a href="${WHATSAPP_GROUP_LINK}" target="_blank" style="background-color: #16a34a; color: #ffffff; font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px; padding: 16px 34px; border-radius: 8px; text-decoration: none; display: inline-block; margin: 4px; box-shadow: 0 4px 14px rgba(22, 163, 74, 0.3);">
        Join WhatsApp Community
      </a>
    </div>
  `;
  return baseWrapper(content, 'SQUAD VERIFIED & APPROVED');
}

/**
 * 3. Squad Registration Rejection Template
 */
function registrationRejectionTemplate({ captainName, teamName, registrationId, rejectionReason }) {
  const baseUrl = getBaseUrl();
  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="display: inline-block; padding: 6px 16px; background: #fee2e2; border: 1px solid #fca5a5; border-radius: 20px; color: #b91c1c; font-weight: 700; font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase;">
        ✕ APPLICATION STATUS UPDATE
      </span>
      <h2 style="font-size: 26px; font-weight: 800; color: #0f172a; margin: 12px 0 0 0; letter-spacing: -0.5px;">
        APPLICATION REJECTED
      </h2>
    </div>

    <p style="font-size: 15px; color: #0f172a; margin-bottom: 16px;">Hello <strong style="color: #b91c1c;">${captainName}</strong>,</p>
    <p style="font-size: 14px; color: #475569; line-height: 1.6; margin-bottom: 20px;">
      Your squad application for <strong style="color: #0f172a;">"${teamName}"</strong> (ID: <code style="color: #d97706; font-family: monospace;">${registrationId}</code>) was reviewed by tournament referees and was <span style="color: #b91c1c; font-weight: 700;">REJECTED</span>.
    </p>

    <!-- Reason Box -->
    <div style="background-color: #fef2f2; padding: 20px; border-radius: 10px; border-left: 4px solid #ef4444; border: 1px solid #fca5a5; margin: 20px 0;">
      <p style="margin: 0; font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px;">Reason for Rejection</p>
      <p style="margin: 6px 0 0 0; font-size: 14px; font-weight: 700; color: #b91c1c;">${rejectionReason || 'Roster details or student verification proofs did not pass review.'}</p>
    </div>

    <p style="font-size: 13px; color: #475569; line-height: 1.6; margin-bottom: 28px;">
      You may re-register with updated student proofs or contact tournament support for assistance.
    </p>

    <div style="text-align: center; margin: 24px 0 12px 0;">
      <a href="${baseUrl}/register" target="_blank" style="background-color: #0f172a; color: #ffffff; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; padding: 14px 28px; border-radius: 8px; text-decoration: none; display: inline-block; box-shadow: 0 4px 10px rgba(15, 23, 42, 0.2);">
        Re-Register Squad Roster
      </a>
    </div>
  `;
  return baseWrapper(content, 'APPLICATION REJECTED');
}

/**
 * 4. OTP Verification Email Template
 */
function otpEmailTemplate({ userName, otpCode }) {
  const content = `
    <p style="font-size: 15px; color: #0f172a; margin-bottom: 16px;">Hello <strong style="color: #2563eb;">${userName || 'Player'}</strong>,</p>
    <p style="font-size: 14px; color: #475569; line-height: 1.6; margin-bottom: 20px;">
      Use the following One-Time Password (OTP) to verify your account or complete your action on the NIT BGMI Championship platform:
    </p>

    <div style="background-color: #f8fafc; padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0; text-align: center; margin: 24px 0;">
      <p style="margin: 0; font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 2px;">Verification OTP Code</p>
      <p style="margin: 10px 0 0 0; font-size: 38px; font-weight: 900; color: #dc2626; letter-spacing: 8px; font-family: 'Courier New', Courier, monospace;">${otpCode}</p>
      <p style="margin: 8px 0 0 0; font-size: 11px; color: #64748b;">Valid for 10 minutes. Do not share this code with anyone.</p>
    </div>
  `;
  return baseWrapper(content, 'SECURITY OTP VERIFICATION');
}

/**
 * 5. Custom Match Lobby Credentials Email Template
 */
function matchLobbyEmailTemplate({ captainName, teamName, matchTitle, roomId, password, time, slotNumber }) {
  const baseUrl = getBaseUrl();
  const content = `
    <p style="font-size: 15px; color: #0f172a; margin-bottom: 16px;">Attention Captain <strong style="color: #dc2626;">${captainName}</strong> (${teamName}),</p>
    <p style="font-size: 14px; color: #475569; line-height: 1.6; margin-bottom: 20px;">
      Here are the custom room credentials for your upcoming match: <strong style="color: #0f172a;">${matchTitle || 'BGMI Custom Match'}</strong>.
    </p>

    <div style="background-color: #f8fafc; padding: 22px; border-radius: 12px; border: 1px solid #e2e8f0; margin: 20px 0;">
      <h3 style="font-size: 11px; color: #d97706; text-transform: uppercase; margin: 0 0 16px 0; letter-spacing: 1.5px; font-weight: 800;">Match Lobby Entry Details</h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr>
          <td style="padding: 8px 0; color: #64748b; border-bottom: 1px solid #e2e8f0;">Room ID:</td>
          <td style="padding: 8px 0; color: #0f172a; font-weight: 900; font-family: monospace; font-size: 20px; border-bottom: 1px solid #e2e8f0;">${roomId}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b; border-bottom: 1px solid #e2e8f0;">Password:</td>
          <td style="padding: 8px 0; color: #d97706; font-weight: 900; font-family: monospace; font-size: 20px; border-bottom: 1px solid #e2e8f0;">${password}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b; border-bottom: 1px solid #e2e8f0;">Match Start Time:</td>
          <td style="padding: 8px 0; color: #0f172a; font-weight: 700; border-bottom: 1px solid #e2e8f0;">${time || 'Scheduled Time'}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b;">Assigned Slot:</td>
          <td style="padding: 8px 0; color: #15803d; font-weight: 900;">Slot #${slotNumber || 'Assigned'}</td>
        </tr>
      </table>
    </div>

    <p style="font-size: 12px; color: #dc2626; font-weight: 700; line-height: 1.5; margin-bottom: 24px;">
      ⚠️ Mandatory Rule: All players must join their designated slot 10 minutes before launch. Emulators and unauthorized tools will result in instant disqualification.
    </p>

    <div style="text-align: center; margin: 24px 0 12px 0;">
      <a href="${baseUrl}/matches" target="_blank" style="background-color: #2563eb; color: #ffffff; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; padding: 14px 28px; border-radius: 8px; text-decoration: none; display: inline-block; box-shadow: 0 4px 10px rgba(37, 99, 235, 0.2);">
        View Match Schedule
      </a>
    </div>
  `;
  return baseWrapper(content, 'CUSTOM ROOM CREDENTIALS');
}

/**
 * 6. Tournament Update Email Template
 */
function tournamentUpdateEmailTemplate({ recipientName, title, message, actionUrl }) {
  const baseUrl = getBaseUrl();
  const finalActionUrl = actionUrl ? (actionUrl.startsWith('http') ? actionUrl : `${baseUrl}${actionUrl}`) : `${baseUrl}/matches`;
  
  const content = `
    <p style="font-size: 15px; color: #0f172a; margin-bottom: 16px;">Hello <strong style="color: #2563eb;">${recipientName || 'Esports Player'}</strong>,</p>
    <p style="font-size: 14px; color: #475569; line-height: 1.6; margin-bottom: 20px;">
      An important announcement has been published regarding the <strong>NIT BGMI Championship 2026</strong>.
    </p>

    <div style="background-color: #f8fafc; padding: 20px; border-radius: 10px; border-left: 4px solid #d97706; border: 1px solid #e2e8f0; margin: 20px 0;">
      <h3 style="font-size: 16px; font-weight: 800; color: #0f172a; margin: 0 0 10px 0;">${title}</h3>
      <p style="font-size: 13px; color: #334155; line-height: 1.6; margin: 0;">${message}</p>
    </div>

    <div style="text-align: center; margin: 28px 0 12px 0;">
      <a href="${finalActionUrl}" target="_blank" style="background-color: #dc2626; color: #ffffff; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; padding: 14px 28px; border-radius: 8px; text-decoration: none; display: inline-block; box-shadow: 0 4px 10px rgba(220, 38, 38, 0.2);">
        View Announcement
      </a>
    </div>
  `;
  return baseWrapper(content, 'TOURNAMENT ANNOUNCEMENT');
}

/**
 * 7. Admin Alert Notification Email Template
 */
function adminNotificationEmailTemplate({ subject, details }) {
  const content = `
    <h3 style="font-size: 16px; font-weight: 800; color: #d97706; margin: 0 0 12px 0;">ADMIN NOTIFICATION</h3>
    <p style="font-size: 14px; color: #0f172a; font-weight: 700;">${subject}</p>
    <div style="background-color: #f8fafc; padding: 18px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 13px; color: #334155; line-height: 1.5; margin: 16px 0;">
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
