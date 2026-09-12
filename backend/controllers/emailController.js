const nodemailer = require('nodemailer');
const ActivityLog = require('../models/ActivityLog');

const EmailController = {
  // @desc    Send custom email via SMTP
  sendEmail: async (req, res) => {
    try {
      const { to, subject, html, text } = req.body;

      if (!to || !subject || (!html && !text)) {
        return res.status(400).json({ success: false, message: 'Missing required fields: to, subject, and html/text' });
      }

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.SMTP_EMAIL || process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD || process.env.SMTP_PASS,
        },
      });

      const mailOptions = {
        from: process.env.SMTP_FROM || `"Verifitor" <${process.env.SMTP_EMAIL || process.env.SMTP_USER}>`,
        to,
        subject,
        html,
        text,
      };

      const info = await transporter.sendMail(mailOptions);

      try {
        await ActivityLog.create({
          userEmail: req.user.email,
          userName: req.user.name || 'User',
          action: 'Send Email',
          type: 'Email',
          status: 'Successful',
          details: `Sent custom email to ${to} with subject "${subject}"`
        });
      } catch (err) {
        console.error('Failed to log email action:', err);
      }

      res.status(200).json({
        success: true,
        message: 'Email sent successfully',
        messageId: info.messageId
      });
    } catch (error) {
      console.error('Email sending error:', error);
      res.status(500).json({ success: false, message: 'Server error during email sending', error: error.message });
    }
  }
};

module.exports = EmailController;
