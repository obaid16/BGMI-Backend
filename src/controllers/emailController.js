const { sendTestEmail } = require('../services/emailService');

/**
 * @desc    Test email dispatch via Resend
 * @route   POST /api/email/test
 * @access  Public / Dev (safe diagnostic endpoint)
 */
const testEmailEndpoint = async (req, res, next) => {
  const { email } = req.body;

  try {
    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Please provide a valid recipient email address' });
    }

    console.log(`[EMAIL TEST ENDPOINT] Triggering Resend test email to: ${email}`);

    const result = await sendTestEmail({ to: email });

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'Test email sent successfully via Resend API',
        messageId: result.messageId || 'dev-mock-id',
        devMode: result.devMode || false
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Failed to send test email',
        error: result.error || 'Resend error'
      });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  testEmailEndpoint
};
