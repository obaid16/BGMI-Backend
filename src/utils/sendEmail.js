/**
 * Utility to send email notifications (e.g. Squad Approval Email to Team Captain)
 */
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    let nodemailer;
    try {
      nodemailer = require('nodemailer');
    } catch (e) {
      nodemailer = null;
    }

    // If SMTP credentials exist in environment variables and nodemailer is installed, use transporter
    if (nodemailer && process.env.SMTP_HOST && process.env.SMTP_USER) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true' || Number(process.env.SMTP_PORT) === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      const fromName = process.env.FROM_NAME || 'NIT BGMI Esports Championship';
      const fromEmail = process.env.FROM_EMAIL || process.env.SMTP_USER;

      await transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to,
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
