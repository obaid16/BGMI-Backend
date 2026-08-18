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

  if (nodemailer && user && pass) {
    if (host && host.includes('gmail.com')) {
      pooledTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user,
          pass
        },
        connectionTimeout: 8000,
        greetingTimeout: 8000,
        socketTimeout: 8000
      });
    } else if (host) {
      pooledTransporter = nodemailer.createTransport({
        host,
        port,
        secure: process.env.SMTP_SECURE === 'true' || port === 465,
        auth: {
          user,
          pass
        },
        connectionTimeout: 8000,
        greetingTimeout: 8000,
        socketTimeout: 8000,
        tls: {
          rejectUnauthorized: false
        }
      });
    }
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

      // 10-second max timeout guard for sending mail
      const mailPromise = transporter.sendMail({
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

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('SMTP send mail operation timed out after 10s')), 10000)
      );

      await Promise.race([mailPromise, timeoutPromise]);
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
