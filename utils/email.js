const nodemailer = require("nodemailer");
const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

// Create Nodemailer transporter using Resend SMTP
// const transporter = nodemailer.createTransport({
//   host: "smtp.resend.com",
//   port: 465,
//   secure: true,
//   auth: {
//     user: "resend",
//     pass: process.env.RESEND_API_KEY,
//   },
// });

/**
 * Send email using Nodemailer with Resend SMTP
 * @param {Object} options - Email options
 * @param {string|string[]} options.to - Recipient email(s)
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @param {string} options.text - Plain text content
 * @param {string} options.from - Sender email
 */
/**
 * Send email using Resend SDK directly (works on all platforms)
 */
const sendEmail = async ({
  to,
  subject,
  html,
  text,
  from = process.env.EMAIL_FROM || "onboarding@resend.dev",
}) => {
  try {
    console.log("📧 Sending email via Resend SDK...");

    const data = await resend.emails.send({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
    });

    console.log("✅ Email sent successfully via Resend SDK:", data.id);
    return { success: true, messageId: data.id };
  } catch (error) {
    console.error("❌ Error sending email via Resend SDK:", error);
    console.error("Error details:", error.message);
    throw error;
  }
};

/**
 * Send email using Resend SDK directly (alternative method)
 */
const sendEmailResend = async ({
  to,
  subject,
  html,
  text,
  from = process.env.EMAIL_FROM || "noreply@yourdomain.com",
}) => {
  try {
    const data = await resend.emails.send({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
    });

    console.log("✅ Email sent successfully:", data.id);
    return { success: true, messageId: data.id };
  } catch (error) {
    console.error("❌ Error sending email:", error);
    throw error;
  }
};

// Email Templates
const emailTemplates = {
  /**
   * Welcome email template
   */
  welcome: (name) => ({
    subject: "Welcome to LinkMe! 🎉",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6; 
              color: #333; 
              margin: 0;
              padding: 0;
              background-color: #f5f5f5;
            }
            .container { 
              max-width: 600px; 
              margin: 40px auto; 
              background-color: white;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header { 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white; 
              padding: 40px 20px; 
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 600;
            }
            .content { 
              padding: 40px 30px;
              background-color: white;
            }
            .content h2 {
              color: #667eea;
              margin-top: 0;
              font-size: 24px;
            }
            .content p {
              color: #555;
              font-size: 16px;
              margin: 16px 0;
            }
            .button { 
              display: inline-block; 
              padding: 14px 32px; 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white !important; 
              text-decoration: none; 
              border-radius: 8px; 
              margin: 24px 0;
              font-weight: 600;
              transition: transform 0.2s;
            }
            .button:hover {
              transform: translateY(-2px);
            }
            .features {
              background-color: #f9fafb;
              border-radius: 8px;
              padding: 20px;
              margin: 24px 0;
            }
            .features ul {
              margin: 0;
              padding-left: 20px;
            }
            .features li {
              margin: 8px 0;
              color: #555;
            }
            .footer { 
              text-align: center; 
              padding: 30px 20px;
              background-color: #f9fafb;
              color: #6b7280; 
              font-size: 14px;
              border-top: 1px solid #e5e7eb;
            }
            .footer a {
              color: #667eea;
              text-decoration: none;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to LinkMe!</h1>
            </div>
            <div class="content">
              <h2>Hello ${name}!</h2>
              <p>We're thrilled to have you join our community! LinkMe makes it easy to create and manage your digital profile cards.</p>
              
              <div class="features">
                <strong>Here's what you can do with LinkMe:</strong>
                <ul>
                  <li>📱 Create beautiful digital profile cards</li>
                  <li>🔗 Share your links and social media in one place</li>
                  <li>✨ Customize your profile with premium designs</li>
                  <li>📊 Track your profile views and engagement</li>
                  <li>🎨 Choose from multiple card templates</li>
                </ul>
              </div>

              <center>
                <a href="${
                  process.env.DASHBOARD_URL || "http://localhost:5174"
                }" class="button">Go to Dashboard</a>
              </center>

              <p>If you have any questions or need help getting started, feel free to reach out to our support team. We're here to help!</p>
              
              <p>Best regards,<br><strong>The LinkMe Team</strong></p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} LinkMe. All rights reserved.</p>
              <p>
                <a href="${
                  process.env.FRONTEND_URL || "http://localhost:5173"
                }">Visit Website</a> | 
                <a href="${
                  process.env.FRONTEND_URL || "http://localhost:5173"
                }/support">Support</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Welcome to LinkMe, ${name}!\n\nThank you for joining our platform. We're excited to have you on board!\n\nGet started by visiting your dashboard: ${
      process.env.DASHBOARD_URL || "http://localhost:5174"
    }\n\nBest regards,\nThe LinkMe Team`,
  }),

  /**
   * Password reset email template
   */
  resetPassword: (name, resetLink, expirationMinutes = 60) => ({
    subject: "Reset Your LinkMe Password 🔒",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6; 
              color: #333; 
              margin: 0;
              padding: 0;
              background-color: #f5f5f5;
            }
            .container { 
              max-width: 600px; 
              margin: 40px auto; 
              background-color: white;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header { 
              background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
              color: white; 
              padding: 40px 20px; 
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 600;
            }
            .content { 
              padding: 40px 30px;
            }
            .content h2 {
              color: #EF4444;
              margin-top: 0;
              font-size: 24px;
            }
            .content p {
              color: #555;
              font-size: 16px;
              margin: 16px 0;
            }
            .button { 
              display: inline-block; 
              padding: 14px 32px; 
              background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
              color: white !important; 
              text-decoration: none; 
              border-radius: 8px; 
              margin: 24px 0;
              font-weight: 600;
            }
            .warning { 
              background-color: #FEF2F2; 
              border-left: 4px solid #EF4444; 
              padding: 16px; 
              margin: 24px 0;
              border-radius: 4px;
            }
            .warning strong {
              color: #DC2626;
              display: block;
              margin-bottom: 8px;
            }
            .warning p {
              margin: 4px 0;
              font-size: 14px;
            }
            .footer { 
              text-align: center; 
              padding: 30px 20px;
              background-color: #f9fafb;
              color: #6b7280; 
              font-size: 14px;
              border-top: 1px solid #e5e7eb;
            }
            .security-tips {
              background-color: #f9fafb;
              padding: 20px;
              border-radius: 8px;
              margin: 24px 0;
            }
            .security-tips h3 {
              margin-top: 0;
              color: #374151;
              font-size: 16px;
            }
            .security-tips ul {
              margin: 8px 0;
              padding-left: 20px;
              font-size: 14px;
            }
            .security-tips li {
              margin: 4px 0;
              color: #6b7280;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔒 Password Reset Request</h1>
            </div>
            <div class="content">
              <h2>Hello ${name},</h2>
              <p>We received a request to reset your password for your LinkMe account. Click the button below to create a new password:</p>
              
              <center>
                <a href="${resetLink}" class="button">Reset Password</a>
              </center>

              <div class="warning">
                <strong>⚠️ Important Security Information</strong>
                <p>• This link will expire in ${expirationMinutes} minutes</p>
                <p>• If you didn't request this password reset, please ignore this email</p>
                <p>• This link can only be used once</p>
                <p>• Never share this link with anyone</p>
              </div>

              <div class="security-tips">
                <h3>🛡️ Security Tips:</h3>
                <ul>
                  <li>Use a strong, unique password</li>
                  <li>Enable two-factor authentication if available</li>
                  <li>Don't reuse passwords across multiple sites</li>
                  <li>Consider using a password manager</li>
                </ul>
              </div>

              <p>If you're having trouble with the button above, copy and paste this link into your browser:</p>
              <p style="font-size: 12px; color: #6b7280; word-break: break-all;">${resetLink}</p>

              <p>Best regards,<br><strong>The LinkMe Security Team</strong></p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} LinkMe. All rights reserved.</p>
              <p>This is an automated security email. Please do not reply.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Password Reset Request\n\nHello ${name},\n\nWe received a request to reset your password. Click the link below to create a new password:\n\n${resetLink}\n\nThis link expires in ${expirationMinutes} minutes and can only be used once.\n\nIf you didn't request this password reset, please ignore this email.\n\nBest regards,\nThe LinkMe Security Team`,
  }),

  /**
   * Email verification template
   */
  emailVerification: (name, verificationLink) => ({
    subject: "Verify Your Email Address ✉️",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6; 
              color: #333; 
              margin: 0;
              padding: 0;
              background-color: #f5f5f5;
            }
            .container { 
              max-width: 600px; 
              margin: 40px auto; 
              background-color: white;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header { 
              background: linear-gradient(135deg, #10B981 0%, #059669 100%);
              color: white; 
              padding: 40px 20px; 
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 600;
            }
            .content { 
              padding: 40px 30px;
            }
            .content h2 {
              color: #10B981;
              margin-top: 0;
              font-size: 24px;
            }
            .content p {
              color: #555;
              font-size: 16px;
              margin: 16px 0;
            }
            .button { 
              display: inline-block; 
              padding: 14px 32px; 
              background: linear-gradient(135deg, #10B981 0%, #059669 100%);
              color: white !important; 
              text-decoration: none; 
              border-radius: 8px; 
              margin: 24px 0;
              font-weight: 600;
            }
            .info-box {
              background-color: #f0fdf4;
              border-left: 4px solid #10B981;
              padding: 16px;
              margin: 24px 0;
              border-radius: 4px;
            }
            .footer { 
              text-align: center; 
              padding: 30px 20px;
              background-color: #f9fafb;
              color: #6b7280; 
              font-size: 14px;
              border-top: 1px solid #e5e7eb;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✉️ Verify Your Email</h1>
            </div>
            <div class="content">
              <h2>Hello ${name},</h2>
              <p>Thank you for signing up for LinkMe! We're excited to have you on board.</p>
              <p>To complete your registration and start using your account, please verify your email address by clicking the button below:</p>
              
              <center>
                <a href="${verificationLink}" class="button">Verify Email Address</a>
              </center>

              <div class="info-box">
                <p style="margin: 0;"><strong>Why verify?</strong></p>
                <p style="margin: 8px 0 0 0; font-size: 14px;">Email verification helps us ensure the security of your account and allows us to send you important updates about your LinkMe profile.</p>
              </div>

              <p>If you're having trouble with the button above, copy and paste this link into your browser:</p>
              <p style="font-size: 12px; color: #6b7280; word-break: break-all;">${verificationLink}</p>

              <p>If you didn't create a LinkMe account, you can safely ignore this email.</p>

              <p>Best regards,<br><strong>The LinkMe Team</strong></p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} LinkMe. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Verify Your Email Address\n\nHello ${name},\n\nThank you for signing up for LinkMe! Please verify your email address by clicking this link:\n\n${verificationLink}\n\nIf you didn't create an account, you can safely ignore this email.\n\nBest regards,\nThe LinkMe Team`,
  }),

  /**
   * General notification template
   */
  notification: (
    name,
    title,
    message,
    actionLink = null,
    actionText = null
  ) => ({
    subject: title,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6; 
              color: #333; 
              margin: 0;
              padding: 0;
              background-color: #f5f5f5;
            }
            .container { 
              max-width: 600px; 
              margin: 40px auto; 
              background-color: white;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header { 
              background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
              color: white; 
              padding: 40px 20px; 
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 600;
            }
            .content { 
              padding: 40px 30px;
            }
            .content h2 {
              color: #3B82F6;
              margin-top: 0;
              font-size: 24px;
            }
            .content p {
              color: #555;
              font-size: 16px;
              margin: 16px 0;
            }
            .button { 
              display: inline-block; 
              padding: 14px 32px; 
              background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
              color: white !important; 
              text-decoration: none; 
              border-radius: 8px; 
              margin: 24px 0;
              font-weight: 600;
            }
            .footer { 
              text-align: center; 
              padding: 30px 20px;
              background-color: #f9fafb;
              color: #6b7280; 
              font-size: 14px;
              border-top: 1px solid #e5e7eb;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔔 ${title}</h1>
            </div>
            <div class="content">
              <h2>Hello ${name},</h2>
              <p>${message}</p>
              ${
                actionLink && actionText
                  ? `
                <center>
                  <a href="${actionLink}" class="button">${actionText}</a>
                </center>
              `
                  : ""
              }
              <p>Best regards,<br><strong>The LinkMe Team</strong></p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} LinkMe. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `${title}\n\nHello ${name},\n\n${message}\n${
      actionLink ? `\n${actionText}: ${actionLink}` : ""
    }\n\nBest regards,\nThe LinkMe Team`,
  }),

  /**
   * Premium subscription confirmation
   */
  premiumActivated: (name, planName, features) => ({
    subject: "🎉 Your Premium Plan is Active!",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6; 
              color: #333; 
              margin: 0;
              padding: 0;
              background-color: #f5f5f5;
            }
            .container { 
              max-width: 600px; 
              margin: 40px auto; 
              background-color: white;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header { 
              background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
              color: white; 
              padding: 40px 20px; 
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 600;
            }
            .content { 
              padding: 40px 30px;
            }
            .content h2 {
              color: #F59E0B;
              margin-top: 0;
              font-size: 24px;
            }
            .content p {
              color: #555;
              font-size: 16px;
              margin: 16px 0;
            }
            .button { 
              display: inline-block; 
              padding: 14px 32px; 
              background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
              color: white !important; 
              text-decoration: none; 
              border-radius: 8px; 
              margin: 24px 0;
              font-weight: 600;
            }
            .features {
              background-color: #FFFBEB;
              border-radius: 8px;
              padding: 20px;
              margin: 24px 0;
            }
            .features h3 {
              margin-top: 0;
              color: #D97706;
            }
            .features ul {
              margin: 8px 0;
              padding-left: 20px;
            }
            .features li {
              margin: 8px 0;
              color: #555;
            }
            .footer { 
              text-align: center; 
              padding: 30px 20px;
              background-color: #f9fafb;
              color: #6b7280; 
              font-size: 14px;
              border-top: 1px solid #e5e7eb;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to Premium!</h1>
            </div>
            <div class="content">
              <h2>Hello ${name},</h2>
              <p>Congratulations! Your <strong>${planName}</strong> subscription is now active.</p>
              
              <div class="features">
                <h3>✨ Your Premium Features:</h3>
                <ul>
                  ${features.map((feature) => `<li>${feature}</li>`).join("")}
                </ul>
              </div>

              <p>You now have access to all premium features. Start customizing your profile with exclusive designs and advanced analytics!</p>

              <center>
                <a href="${
                  process.env.DASHBOARD_URL || "http://localhost:5174"
                }" class="button">Explore Premium Features</a>
              </center>

              <p>Thank you for upgrading to premium! If you have any questions, our support team is here to help.</p>

              <p>Best regards,<br><strong>The LinkMe Team</strong></p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} LinkMe. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Welcome to Premium!\n\nHello ${name},\n\nYour ${planName} subscription is now active!\n\nPremium Features:\n${features
      .map((f) => `• ${f}`)
      .join("\n")}\n\nVisit your dashboard: ${
      process.env.DASHBOARD_URL || "http://localhost:5174"
    }\n\nBest regards,\nThe LinkMe Team`,
  }),

  /**
   * Profile view notification
   */
  profileViewed: (name, viewCount, viewerInfo) => ({
    subject: "👀 Someone viewed your LinkMe profile!",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6; 
              color: #333; 
              margin: 0;
              padding: 0;
              background-color: #f5f5f5;
            }
            .container { 
              max-width: 600px; 
              margin: 40px auto; 
              background-color: white;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header { 
              background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%);
              color: white; 
              padding: 40px 20px; 
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 600;
            }
            .content { 
              padding: 40px 30px;
            }
            .content h2 {
              color: #8B5CF6;
              margin-top: 0;
              font-size: 24px;
            }
            .content p {
              color: #555;
              font-size: 16px;
              margin: 16px 0;
            }
            .button { 
              display: inline-block; 
              padding: 14px 32px; 
              background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%);
              color: white !important; 
              text-decoration: none; 
              border-radius: 8px; 
              margin: 24px 0;
              font-weight: 600;
            }
            .stat-box {
              background-color: #FAF5FF;
              border-radius: 8px;
              padding: 20px;
              margin: 24px 0;
              text-align: center;
            }
            .stat-box .number {
              font-size: 48px;
              font-weight: bold;
              color: #8B5CF6;
              margin: 0;
            }
            .stat-box .label {
              color: #6b7280;
              margin: 8px 0 0 0;
            }
            .footer { 
              text-align: center; 
              padding: 30px 20px;
              background-color: #f9fafb;
              color: #6b7280; 
              font-size: 14px;
              border-top: 1px solid #e5e7eb;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>👀 Profile View Notification</h1>
            </div>
            <div class="content">
              <h2>Hello ${name},</h2>
              <p>Great news! Someone just viewed your LinkMe profile.</p>
              
              ${
                viewerInfo
                  ? `<p><strong>Viewer details:</strong> ${viewerInfo}</p>`
                  : ""
              }

              <div class="stat-box">
                <p class="number">${viewCount}</p>
                <p class="label">Total Profile Views</p>
              </div>

              <p>Keep your profile updated to make a great impression on your visitors!</p>

              <center>
                <a href="${
                  process.env.DASHBOARD_URL || "http://localhost:5174"
                }/analytics" class="button">View Analytics</a>
              </center>

              <p>Best regards,<br><strong>The LinkMe Team</strong></p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} LinkMe. All rights reserved.</p>
              <p><a href="${
                process.env.DASHBOARD_URL || "http://localhost:5174"
              }/settings/notifications">Manage notification preferences</a></p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Profile View Notification\n\nHello ${name},\n\nSomeone just viewed your LinkMe profile!\n${
      viewerInfo ? `Viewer: ${viewerInfo}\n` : ""
    }\nTotal views: ${viewCount}\n\nView analytics: ${
      process.env.DASHBOARD_URL || "http://localhost:5174"
    }/analytics\n\nBest regards,\nThe LinkMe Team`,
  }),
};

/**
 * Send templated email
 * @param {string|string[]} to - Recipient email(s)
 * @param {string} templateKey - Template key from emailTemplates
 * @param  {...any} args - Template arguments
 */
const sendTemplatedEmail = async (to, templateKey, ...args) => {
  if (!emailTemplates[templateKey]) {
    throw new Error(`Email template "${templateKey}" not found`);
  }

  const template = emailTemplates[templateKey](...args);
  return sendEmail({
    to,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
};

/**
 * Verify transporter connection
 */
/**
 * Verify Resend connection
 */
const verifyEmailConnection = async () => {
  try {
    // Test if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      console.error("❌ RESEND_API_KEY is not configured");
      return false;
    }
    
    console.log("✅ Resend API key is configured");
    return true;
  } catch (error) {
    console.error("❌ Email configuration check failed:", error);
    return false;
  }
};

module.exports = {
  sendEmail,
  sendEmailResend,
  emailTemplates,
  sendTemplatedEmail,
  verifyEmailConnection,
};
