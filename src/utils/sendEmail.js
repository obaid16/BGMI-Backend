/**
 * Utility to send email notifications (e.g. Squad Approval Email to Team Captain)
 */
if (!process.env.SMTP_HOST) {
  try {
    require('dotenv').config();
  } catch (e) {}
}

let pooledTransporter = null;

function getTransporter() {
  if (pooledTransporter) return pooledTransporter;

  let nodemailer;
  try {
    nodemailer = require('nodemailer');
  } catch (e) {
    return null;
  }

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = Number(process.env.SMTP_PORT) || 587;

  if (nodemailer && host && user) {
    pooledTransporter = nodemailer.createTransport({
      host,
      port,
      secure: process.env.SMTP_SECURE === 'true' || port === 465,
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      auth: {
        user,
        pass
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  return pooledTransporter;
}

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    if (!to || typeof to !== 'string' || !to.includes('@')) {
      console.warn('[EMAIL WARNING] Invalid recipient email address provided:', to);
      return false;
    }

    const transporter = getTransporter();
    const user = process.env.SMTP_USER;

    // If SMTP credentials exist in environment variables and nodemailer is installed, use transporter
    if (transporter) {
      const rawFromName = process.env.FROM_NAME || 'BGMI Esports Championship';
      const cleanFromName = rawFromName.replace(/^["']|["']$/g, '');
      const fromEmail = process.env.FROM_EMAIL || user;

      await transporter.sendMail({
        from: `"${cleanFromName}" <${fromEmail}>`,
        to: to.trim(),
        subject,
        text,
        html,
        headers: {
          'X-Priority': '1',
          'X-MSMail-Priority': 'High',
          'Importance': 'high',
          'X-Mailer': 'BGMI Esports Tournament Engine',
          'Reply-To': fromEmail
        }
      });
      console.log(`[EMAIL DISPATCHED VIA SMTP] To: ${to} | Subject: ${subject}`);
    } else {
      // Clean console log fallback when SMTP is not configured locally
      console.log(`\n======================================================`);
      console.log(`📧 [EMAIL NOTIFICATION LOGGED - CONFIG SMTP IN BACKEND .env FOR LIVE DELIVERY]`);
      console.log(`To Captain: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Body Snippet: ${text ? text.substring(0, 150) : 'HTML Template Delivered'}`);
      console.log(`======================================================\n`);
    }
    return true;

  } catch (error) {
    console.error(`[EMAIL DISPATCH FAILED] Error sending email to ${to}:`, error.message);
    return false;
  }
};

module.exports = sendEmail;
