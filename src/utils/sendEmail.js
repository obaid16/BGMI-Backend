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
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      await transporter.sendMail({
        from: `"${process.env.FROM_NAME || 'BGMI Championship'}" <${process.env.FROM_EMAIL || 'no-reply@bgmi-esports.in'}>`,
        to,
        subject,
        text,
        html
      });
      console.log(`[EMAIL DISPATCHED VIA SMTP] To: ${to} | Subject: ${subject}`);
    } else {
      // Clean console log fallback when SMTP is not configured locally
      console.log(`\n======================================================`);
      console.log(`📧 [EMAIL NOTIFICATION LOGGED]`);
      console.log(`To Captain: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Body:\n${text || html}`);
      console.log(`======================================================\n`);
    }
    return true;
  } catch (error) {
    console.error(`[EMAIL DISPATCH FAILED] Error sending email to ${to}:`, error.message);
    return false;
  }
};

module.exports = sendEmail;
