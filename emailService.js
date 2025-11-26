const nodemailer = require('nodemailer');

// Email service configuration
const EMAIL_CONFIG = {
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER || 'demo@example.com',
    pass: process.env.EMAIL_PASSWORD || 'demo-password'
  }
};

// Create transporter
const transporter = nodemailer.createTransport(EMAIL_CONFIG);

/**
 * Send a task reminder email
 * @param {string} to - Recipient email address
 * @param {object} task - Task object with title and description
 * @returns {Promise<object>} Email result
 */
async function sendTaskReminder(to, task) {
  const mailOptions = {
    from: `Task Manager <${EMAIL_CONFIG.auth.user}>`,
    to: to,
    subject: `Reminder: ${task.title}`,
    text: `
Hello,

This is a reminder about your task:

Title: ${task.title}
Description: ${task.description || 'No description'}
Status: ${task.status}

Please complete this task at your earliest convenience.

Best regards,
Task Manager System
    `,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #667eea;">Task Reminder</h2>
        <p>Hello,</p>
        <p>This is a reminder about your task:</p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Title:</strong> ${task.title}</p>
          <p><strong>Description:</strong> ${task.description || 'No description'}</p>
          <p><strong>Status:</strong> <span style="color: ${task.status === 'pending' ? '#f59e0b' : '#10b981'};">${task.status}</span></p>
        </div>
        <p>Please complete this task at your earliest convenience.</p>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          Best regards,<br>
          Task Manager System
        </p>
      </div>
    `
  };

  return await transporter.sendMail(mailOptions);
}

/**
 * Send a test email to verify configuration
 * @param {string} to - Recipient email address
 * @returns {Promise<object>} Email result
 */
async function sendTestEmail(to) {
  const mailOptions = {
    from: `Task Manager <${EMAIL_CONFIG.auth.user}>`,
    to: to,
    subject: 'Test Email from Task Manager',
    text: 'This is a test email to verify email service configuration.',
    html: '<p>This is a test email to verify email service configuration.</p>'
  };

  return await transporter.sendMail(mailOptions);
}

/**
 * Verify email service connection
 * @returns {Promise<boolean>} True if connection is successful
 */
async function verifyConnection() {
  try {
    await transporter.verify();
    return true;
  } catch (error) {
    console.error('Email service verification failed:', error.message);
    return false;
  }
}

module.exports = {
  sendTaskReminder,
  sendTestEmail,
  verifyConnection
};

