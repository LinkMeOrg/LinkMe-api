const nodemailer = require("nodemailer");

// Create Nodemailer transporter using Gmail
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // Your Gmail address
    pass: process.env.EMAIL_PASSWORD, // Your Gmail App Password
  },
});

/**
 * Send email using Nodemailer with Gmail
 * @param {Object} options - Email options
 * @param {string|string[]} options.to - Recipient email(s)
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @param {string} options.text - Plain text content
 * @param {string} options.from - Sender email
 */
const sendEmail = async ({
  to,
  subject,
  html,
  text,
  from = process.env.EMAIL_FROM || process.env.EMAIL_USER,
}) => {
  try {
    console.log("📧 Sending email via Gmail...");

    const mailOptions = {
      from: from,
      to: Array.isArray(to) ? to.join(", ") : to,
      subject,
      html,
      text,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log("✅ Email sent successfully:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Error sending email:", error);
    console.error("Error details:", error.message);
    throw error;
  }
};

/**
 * Alternative send email method (same as above for consistency)
 */
const sendEmailResend = sendEmail;

/**
 * Base email template with consistent styling
 */
const getBaseTemplate = (headerIcon, headerTitle, headerColor, content) => `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body { 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        line-height: 1.6; 
        color: #0b0f19;
        background-color: #f5f5f5;
        padding: 20px;
      }
      
      .email-wrapper {
        max-width: 600px;
        margin: 0 auto;
        background-color: #ffffff;
      }
      
      .header {
        background: ${headerColor};
        padding: 48px 32px;
        text-align: center;
      }
      
      .header-icon {
        font-size: 64px;
        margin-bottom: 16px;
        display: block;
      }
      
      .header-title {
        color: #ffffff;
        font-size: 28px;
        font-weight: 600;
        margin: 0;
        letter-spacing: -0.5px;
      }
      
      .content {
        padding: 48px 32px;
        background-color: #ffffff;
      }
      
      .greeting {
        font-size: 24px;
        font-weight: 600;
        color: #0b0f19;
        margin-bottom: 24px;
      }
      
      .text {
        font-size: 16px;
        color: #4a5568;
        margin-bottom: 16px;
        line-height: 1.8;
      }
      
      .button-container {
        text-align: center;
        margin: 32px 0;
      }
      
      .button {
        display: inline-block;
        padding: 16px 40px;
        background-color: #0066ff;
        color: #ffffff !important;
        text-decoration: none;
        border-radius: 8px;
        font-weight: 600;
        font-size: 16px;
        transition: all 0.3s ease;
      }
      
      .button:hover {
        background-color: #0052cc;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 102, 255, 0.3);
      }
      
      .info-box {
        background-color: #f5f5f5;
        border-left: 4px solid #0066ff;
        padding: 20px;
        margin: 24px 0;
        border-radius: 4px;
      }
      
      .info-box-title {
        font-weight: 600;
        color: #0b0f19;
        margin-bottom: 8px;
        font-size: 16px;
      }
      
      .info-box-text {
        color: #4a5568;
        font-size: 14px;
        margin: 0;
      }
      
      .divider {
        height: 1px;
        background-color: #e2e8f0;
        margin: 32px 0;
      }
      
      .footer {
        background-color: #0b0f19;
        padding: 32px;
        text-align: center;
      }
      
      .footer-text {
        color: #a0aec0;
        font-size: 14px;
        margin-bottom: 16px;
      }
      
      .footer-links {
        margin-top: 16px;
      }
      
      .footer-link {
        color: #0066ff;
        text-decoration: none;
        margin: 0 12px;
        font-size: 14px;
      }
      
      .footer-link:hover {
        color: #f2a91d;
      }
      
      .signature {
        margin-top: 32px;
        padding-top: 24px;
        border-top: 1px solid #e2e8f0;
      }
      
      .signature-text {
        color: #4a5568;
        font-size: 16px;
      }
      
      .signature-team {
        color: #0b0f19;
        font-weight: 600;
        font-size: 16px;
      }
      
      .accent-text {
        color: #0066ff;
        font-weight: 600;
      }
      
      @media only screen and (max-width: 600px) {
        .header {
          padding: 32px 24px;
        }
        
        .content {
          padding: 32px 24px;
        }
        
        .header-title {
          font-size: 24px;
        }
        
        .greeting {
          font-size: 20px;
        }
        
        .button {
          padding: 14px 32px;
          font-size: 15px;
        }
      }
    </style>
  </head>
  <body>
    <div class="email-wrapper">
      <div class="header">
        <span class="header-icon">${headerIcon}</span>
        <h1 class="header-title">${headerTitle}</h1>
      </div>
      <div class="content">
        ${content}
      </div>
      <div class="footer">
        <p class="footer-text">© ${new Date().getFullYear()} LinkMe. All rights reserved.</p>
        <div class="footer-links">
          <a href="${
            process.env.FRONTEND_URL || "http://localhost:5173"
          }" class="footer-link">Visit Website</a>
          <a href="${
            process.env.FRONTEND_URL || "http://localhost:5173"
          }/support" class="footer-link">Support</a>
          <a href="${
            process.env.DASHBOARD_URL || "http://localhost:5174"
          }/settings" class="footer-link">Settings</a>
        </div>
      </div>
    </div>
  </body>
</html>
`;

/**
 * OTP Email template
 */
const otpEmailTemplate = (userName, otp) => ({
  subject: "Your OTP for Email Verification ✉️",
  html: `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6; 
            color: #0b0f19;
            background-color: #f5f5f5;
            padding: 20px;
          }
          
          .email-wrapper {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
          }
          
          .header {
            background: #0066ff;
            padding: 48px 32px;
            text-align: center;
          }
          
          .header-icon {
            font-size: 64px;
            margin-bottom: 16px;
            display: block;
          }
          
          .header-title {
            color: #ffffff;
            font-size: 28px;
            font-weight: 600;
            margin: 0;
            letter-spacing: -0.5px;
          }
          
          .content {
            padding: 48px 32px;
            background-color: #ffffff;
            text-align: center;
          }
          
          .greeting {
            font-size: 24px;
            font-weight: 600;
            color: #0b0f19;
            margin-bottom: 24px;
          }
          
          .text {
            font-size: 16px;
            color: #4a5568;
            margin-bottom: 16px;
            line-height: 1.8;
          }
          
          .otp-container {
            margin: 40px 0;
            padding: 32px;
            background: linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%);
            border-radius: 12px;
            border: 2px solid #0066ff;
          }
          
          .otp-label {
            font-size: 14px;
            color: #4a5568;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 600;
            margin-bottom: 16px;
          }
          
          .otp-box {
            background: #0066ff;
            color: #ffffff;
            font-size: 42px;
            font-weight: bold;
            letter-spacing: 12px;
            padding: 24px 32px;
            border-radius: 8px;
            display: inline-block;
            box-shadow: 0 4px 12px rgba(0, 102, 255, 0.3);
          }
          
          .info-box {
            background-color: #f5f5f5;
            border-left: 4px solid #f2a91d;
            padding: 20px;
            margin: 32px 0;
            border-radius: 4px;
            text-align: left;
          }
          
          .info-box-title {
            font-weight: 600;
            color: #0b0f19;
            margin-bottom: 12px;
            font-size: 16px;
            display: flex;
            align-items: center;
          }
          
          .info-box-text {
            color: #4a5568;
            font-size: 14px;
            margin: 0;
            line-height: 1.8;
          }
          
          .timer-notice {
            background: #fffbeb;
            border: 1px solid #f2a91d;
            color: #92400e;
            padding: 16px;
            border-radius: 8px;
            margin: 24px 0;
            font-size: 14px;
            font-weight: 500;
          }
          
          .signature {
            margin-top: 40px;
            padding-top: 24px;
            border-top: 1px solid #e2e8f0;
          }
          
          .signature-text {
            color: #4a5568;
            font-size: 16px;
          }
          
          .signature-team {
            color: #0b0f19;
            font-weight: 600;
            font-size: 16px;
          }
          
          .footer {
            background-color: #0b0f19;
            padding: 32px;
            text-align: center;
          }
          
          .footer-text {
            color: #a0aec0;
            font-size: 14px;
            margin-bottom: 16px;
          }
          
          .footer-links {
            margin-top: 16px;
          }
          
          .footer-link {
            color: #0066ff;
            text-decoration: none;
            margin: 0 12px;
            font-size: 14px;
          }
          
          .footer-link:hover {
            color: #f2a91d;
          }
          
          .security-badge {
            display: inline-flex;
            align-items: center;
            background: #ecfdf5;
            color: #065f46;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: 600;
            margin-top: 24px;
          }
          
          @media only screen and (max-width: 600px) {
            .header {
              padding: 32px 24px;
            }
            
            .content {
              padding: 32px 24px;
            }
            
            .header-title {
              font-size: 24px;
            }
            
            .greeting {
              font-size: 20px;
            }
            
            .otp-box {
              font-size: 32px;
              letter-spacing: 8px;
              padding: 20px 24px;
            }
            
            .otp-container {
              padding: 24px;
              margin: 32px 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="header">
            <span class="header-icon">🔐</span>
            <h1 class="header-title">Email Verification</h1>
          </div>
          
          <div class="content">
            <h2 class="greeting">Hello ${userName || "there"}! 👋</h2>
            <p class="text">Thank you for signing up with <strong style="color: #0066ff;">LinkMe</strong>. To complete your registration, please use the verification code below:</p>
            
            <div class="otp-container">
              <div class="otp-label">Your Verification Code</div>
              <div class="otp-box">${otp}</div>
            </div>

            <div class="timer-notice">
              ⏱️ This code will expire in <strong>10 minutes</strong>
            </div>

            <div class="info-box">
              <div class="info-box-title">
                🛡️ Security Tips
              </div>
              <div class="info-box-text">
                • Never share this code with anyone, including LinkMe staff<br>
                • This code is for one-time use only<br>
                • If you didn't request this code, please ignore this email<br>
                • For your security, this code will expire soon
              </div>
            </div>

            <div class="security-badge">
              ✓ Verified by LinkMe Security
            </div>

            <div class="signature">
              <p class="signature-text">Best regards,</p>
              <p class="signature-team">The LinkMe Team</p>
            </div>
          </div>
          
          <div class="footer">
            <p class="footer-text">© ${new Date().getFullYear()} LinkMe. All rights reserved.</p>
            <p class="footer-text" style="margin-top: 8px; font-size: 12px;">This is an automated security email. Please do not reply.</p>
            <div class="footer-links">
              <a href="${
                process.env.FRONTEND_URL || "http://localhost:5173"
              }" class="footer-link">Visit Website</a>
              <a href="${
                process.env.FRONTEND_URL || "http://localhost:5173"
              }/support" class="footer-link">Support</a>
            </div>
          </div>
        </div>
      </body>
    </html>
  `,
  text: `Email Verification\n\nHello ${
    userName || "there"
  }!\n\nYour OTP code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nNever share this code with anyone. If you didn't request this code, please ignore this email.\n\nBest regards,\nThe LinkMe Team\n\n© ${new Date().getFullYear()} LinkMe. All rights reserved.`,
});

/**
 * Send OTP email using template
 */
const sendOtpEmail = async (email, otp, userName) => {
  const template = otpEmailTemplate(userName, otp);
  await sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
};

// Email Templates
const emailTemplates = {
  /**
   * Welcome email template
   */
  welcome: (name) => {
    const content = `
      <h2 class="greeting">Hello ${name}! 👋</h2>
      <p class="text">Welcome to <span class="accent-text">LinkMe</span>! We're thrilled to have you join our community.</p>
      <p class="text">With LinkMe, you can create stunning digital profile cards, share all your important links in one place, and track your engagement with powerful analytics.</p>
      
      <div class="info-box">
        <p class="info-box-title">🚀 Get Started in Minutes:</p>
        <p class="info-box-text">• Create your personalized digital card<br>
        • Add your social links and contact info<br>
        • Customize with premium designs<br>
        • Share your unique profile URL<br>
        • Track views and engagement</p>
      </div>

      <div class="button-container">
        <a href="${process.env.FRONTEND_URL}" class="button">Go to Website</a>
      </div>

      <p class="text">Need help getting started? Our support team is here for you every step of the way.</p>

      <div class="signature">
        <p class="signature-text">Best regards,</p>
        <p class="signature-team">The LinkMe Team</p>
      </div>
    `;

    return {
      subject: "Welcome to LinkMe! 🎉",
      html: getBaseTemplate("🎉", "Welcome to LinkMe", "#0066ff", content),
      text: `Welcome to LinkMe, ${name}!\n\nThank you for joining our platform. We're excited to have you on board!\n\nGet started by visiting your profile: ${
        process.env.DASHBOARD_URL || "http://localhost:5173"
      }\n\nBest regards,\nThe LinkMe Team`,
    };
  },

  /**
   * Password reset email template
   */
  resetPassword: (name, resetLink, expirationMinutes = 60) => {
    const content = `
      <h2 class="greeting">Hello ${name},</h2>
      <p class="text">We received a request to reset your password for your LinkMe account.</p>
      <p class="text">Click the button below to create a new password:</p>

      <div class="button-container">
        <a href="${resetLink}" class="button">Reset Password</a>
      </div>

      <div class="info-box">
        <p class="info-box-title">🔒 Security Information:</p>
        <p class="info-box-text">• This link expires in ${expirationMinutes} minutes<br>
        • Can only be used once<br>
        • If you didn't request this, please ignore<br>
        • Never share this link with anyone</p>
      </div>

      <div class="divider"></div>

      <p class="text" style="font-size: 14px; color: #718096;">If the button doesn't work, copy and paste this link:</p>
      <p class="text" style="font-size: 12px; color: #a0aec0; word-break: break-all;">${resetLink}</p>

      <div class="signature">
        <p class="signature-text">Best regards,</p>
        <p class="signature-team">The LinkMe Security Team</p>
      </div>
    `;

    return {
      subject: "Reset Your LinkMe Password 🔒",
      html: getBaseTemplate("🔒", "Password Reset", "#0b0f19", content),
      text: `Password Reset Request\n\nHello ${name},\n\nWe received a request to reset your password. Click the link below to create a new password:\n\n${resetLink}\n\nThis link expires in ${expirationMinutes} minutes and can only be used once.\n\nIf you didn't request this password reset, please ignore this email.\n\nBest regards,\nThe LinkMe Security Team`,
    };
  },

  /**
   * Email verification template
   */
  emailVerification: (name, verificationLink) => {
    const content = `
      <h2 class="greeting">Hello ${name}! 👋</h2>
      <p class="text">Thank you for signing up for LinkMe! We're excited to have you on board.</p>
      <p class="text">To complete your registration and start using your account, please verify your email address:</p>

      <div class="button-container">
        <a href="${verificationLink}" class="button">Verify Email Address</a>
      </div>

      <div class="info-box">
        <p class="info-box-title">Why verify your email?</p>
        <p class="info-box-text">Email verification helps us ensure the security of your account and allows us to send you important updates about your LinkMe profile.</p>
      </div>

      <div class="divider"></div>

      <p class="text" style="font-size: 14px; color: #718096;">If the button doesn't work, copy and paste this link:</p>
      <p class="text" style="font-size: 12px; color: #a0aec0; word-break: break-all;">${verificationLink}</p>

      <p class="text" style="margin-top: 32px;">If you didn't create a LinkMe account, you can safely ignore this email.</p>

      <div class="signature">
        <p class="signature-text">Best regards,</p>
        <p class="signature-team">The LinkMe Team</p>
      </div>
    `;

    return {
      subject: "Verify Your Email Address ✉️",
      html: getBaseTemplate("✉️", "Verify Your Email", "#0066ff", content),
      text: `Verify Your Email Address\n\nHello ${name},\n\nThank you for signing up for LinkMe! Please verify your email address by clicking this link:\n\n${verificationLink}\n\nIf you didn't create an account, you can safely ignore this email.\n\nBest regards,\nThe LinkMe Team`,
    };
  },

  /**
   * General notification template
   */
  notification: (
    name,
    title,
    message,
    actionLink = null,
    actionText = null
  ) => {
    const content = `
      <h2 class="greeting">Hello ${name},</h2>
      <p class="text">${message}</p>

      ${
        actionLink && actionText
          ? `
        <div class="button-container">
          <a href="${actionLink}" class="button">${actionText}</a>
        </div>
      `
          : ""
      }

      <div class="signature">
        <p class="signature-text">Best regards,</p>
        <p class="signature-team">The LinkMe Team</p>
      </div>
    `;

    return {
      subject: title,
      html: getBaseTemplate("🔔", title, "#0066ff", content),
      text: `${title}\n\nHello ${name},\n\n${message}\n${
        actionLink ? `\n${actionText}: ${actionLink}` : ""
      }\n\nBest regards,\nThe LinkMe Team`,
    };
  },

  /**
   * Premium subscription confirmation
   */
  premiumActivated: (name, planName, features) => {
    const content = `
      <h2 class="greeting">Hello ${name}! 🎉</h2>
      <p class="text">Congratulations! Your <span class="accent-text">${planName}</span> subscription is now active.</p>

      <div class="info-box">
        <p class="info-box-title">✨ Your Premium Features:</p>
        <p class="info-box-text">${features
          .map((feature) => `• ${feature}`)
          .join("<br>")}</p>
      </div>

      <p class="text">You now have access to all premium features. Start customizing your profile with exclusive designs and advanced analytics!</p>

      <div class="button-container">
        <a href="${
          process.env.DASHBOARD_URL || "http://localhost:5174"
        }" class="button">Explore Premium Features</a>
      </div>

      <p class="text">Thank you for upgrading to premium! If you have any questions, our support team is here to help.</p>

      <div class="signature">
        <p class="signature-text">Best regards,</p>
        <p class="signature-team">The LinkMe Team</p>
      </div>
    `;

    return {
      subject: "🎉 Your Premium Plan is Active!",
      html: getBaseTemplate("✨", "Welcome to Premium", "#f2a91d", content),
      text: `Welcome to Premium!\n\nHello ${name},\n\nYour ${planName} subscription is now active!\n\nPremium Features:\n${features
        .map((f) => `• ${f}`)
        .join("\n")}\n\nVisit your dashboard: ${
        process.env.DASHBOARD_URL || "http://localhost:5174"
      }\n\nBest regards,\nThe LinkMe Team`,
    };
  },

  /**
   * Profile view notification
   */
  profileViewed: (name, viewCount, viewerInfo) => {
    const content = `
      <h2 class="greeting">Hello ${name}! 👀</h2>
      <p class="text">Great news! Someone just viewed your LinkMe profile.</p>
      
      ${
        viewerInfo
          ? `<p class="text"><span class="accent-text">Viewer details:</span> ${viewerInfo}</p>`
          : ""
      }

      <div class="info-box">
        <div style="text-align: center;">
          <p style="font-size: 48px; font-weight: bold; color: #0066ff; margin: 0;">${viewCount}</p>
          <p class="info-box-text" style="margin-top: 8px;">Total Profile Views</p>
        </div>
      </div>

      <p class="text">Keep your profile updated to make a great impression on your visitors!</p>

      <div class="button-container">
        <a href="${
          process.env.DASHBOARD_URL || "http://localhost:5174"
        }/analytics" class="button">View Analytics</a>
      </div>

      <div class="signature">
        <p class="signature-text">Best regards,</p>
        <p class="signature-team">The LinkMe Team</p>
      </div>
    `;

    return {
      subject: "👀 Someone viewed your LinkMe profile!",
      html: getBaseTemplate(
        "👀",
        "Profile View Notification",
        "#0066ff",
        content
      ),
      text: `Profile View Notification\n\nHello ${name},\n\nSomeone just viewed your LinkMe profile!\n${
        viewerInfo ? `Viewer: ${viewerInfo}\n` : ""
      }\nTotal views: ${viewCount}\n\nView analytics: ${
        process.env.DASHBOARD_URL || "http://localhost:5174"
      }/analytics\n\nBest regards,\nThe LinkMe Team`,
    };
  },

  /**
   * Contact form submission notification
   */
  contactFormSubmission: (name, email, message, subject = "New Contact") => {
    const content = `
      <h2 class="greeting">New Contact Form Submission</h2>
      
      <div class="info-box">
        <p class="info-box-title">Contact Details:</p>
        <p class="info-box-text">
          <strong>Name:</strong> ${name}<br>
          <strong>Email:</strong> ${email}<br>
          <strong>Subject:</strong> ${subject}
        </p>
      </div>

      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 4px; margin: 24px 0;">
        <p class="info-box-title">Message:</p>
        <p class="text" style="margin: 8px 0 0 0;">${message}</p>
      </div>

      <div class="button-container">
        <a href="mailto:${email}" class="button">Reply to ${name}</a>
      </div>
    `;

    return {
      subject: `📬 New Contact: ${subject}`,
      html: getBaseTemplate("📬", "New Contact Message", "#0066ff", content),
      text: `New Contact Form Submission\n\nName: ${name}\nEmail: ${email}\nSubject: ${subject}\n\nMessage:\n${message}`,
    };
  },

  /**
   * Account deletion confirmation
   */
  accountDeleted: (name) => {
    const content = `
      <h2 class="greeting">Goodbye ${name},</h2>
      <p class="text">Your LinkMe account has been successfully deleted as requested.</p>
      
      <div class="info-box">
        <p class="info-box-title">What happens now:</p>
        <p class="info-box-text">
          • All your profile data has been removed<br>
          • Your custom URL is now available<br>
          • Your subscription has been cancelled<br>
          • This action cannot be undone
        </p>
      </div>

      <p class="text">We're sorry to see you go. If you change your mind, you're always welcome to create a new account.</p>

      <div class="button-container">
        <a href="${
          process.env.FRONTEND_URL || "http://localhost:5173"
        }/register" class="button">Create New Account</a>
      </div>

      <div class="signature">
        <p class="signature-text">Best wishes,</p>
        <p class="signature-team">The LinkMe Team</p>
      </div>
    `;

    return {
      subject: "Your LinkMe Account Has Been Deleted",
      html: getBaseTemplate("👋", "Account Deleted", "#0b0f19", content),
      text: `Account Deletion Confirmation\n\nGoodbye ${name},\n\nYour LinkMe account has been successfully deleted as requested.\n\nAll your data has been removed and this action cannot be undone.\n\nBest wishes,\nThe LinkMe Team`,
    };
  },
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
 * Verify Gmail connection
 */
const verifyEmailConnection = async () => {
  try {
    // Check if Gmail credentials are configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.error("❌ EMAIL_USER or EMAIL_PASSWORD is not configured");
      return false;
    }

    // Verify the transporter
    await transporter.verify();
    console.log("✅ Gmail SMTP connection verified successfully");
    return true;
  } catch (error) {
    console.error("❌ Gmail SMTP connection failed:", error.message);
    return false;
  }
};

module.exports = {
  sendEmail,
  sendEmailResend,
  emailTemplates,
  sendTemplatedEmail,
  verifyEmailConnection,
  otpEmailTemplate,
  sendOtpEmail,
};
