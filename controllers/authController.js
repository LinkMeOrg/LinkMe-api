const { User } = require("../models");
const jwt = require("jsonwebtoken");
const SECRET_KEY = process.env.JWT_SECRET;
const { Op } = require("sequelize");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const crypto = require("crypto");
const {
  sendTemplatedEmail,
  sendEmail,
  emailTemplates,
} = require("../utils/email");

// ==================== PASSPORT CONFIGURATION ====================

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.BACKEND_URL}/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ where: { googleId: profile.id } });

        if (!user) {
          user = await User.create({
            googleId: profile.id,
            firstName: profile.displayName,
            secondName: null,
            lastName: null,
            email: profile.emails?.[0]?.value,
            role: "user",
            isVerified: true, // Auto-verify OAuth users
          });

          // Send welcome email to OAuth user
          sendTemplatedEmail(user.email, "welcome", user.firstName).catch(
            (error) => {
              console.error("Error sending welcome email:", error);
            }
          );
        }

        done(null, user);
      } catch (error) {
        done(error, null);
      }
    }
  )
);

passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: `${process.env.BACKEND_URL}/auth/facebook/callback`,
      profileFields: ["id", "displayName", "email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ where: { facebookId: profile.id } });

        if (!user) {
          user = await User.create({
            facebookId: profile.id,
            firstName: profile.displayName,
            secondName: null,
            lastName: null,
            email: profile.emails?.[0]?.value || `${profile.id}@facebook.com`,
            role: "user",
            isVerified: true, // Auto-verify OAuth users
          });

          // Send welcome email to OAuth user
          if (user.email && !user.email.includes("@facebook.com")) {
            sendTemplatedEmail(user.email, "welcome", user.firstName).catch(
              (error) => {
                console.error("Error sending welcome email:", error);
              }
            );
          }
        }

        done(null, user);
      } catch (error) {
        done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// ==================== HELPER FUNCTIONS ====================

const generateToken = (user) =>
  jwt.sign({ id: user.id }, SECRET_KEY, { expiresIn: "2h" });

const generateRefreshToken = (user) =>
  jwt.sign({ id: user.id }, SECRET_KEY, { expiresIn: "7d" });

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
            text-align: center;
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
          .otp-box {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            font-size: 48px;
            font-weight: bold;
            letter-spacing: 10px;
            padding: 20px;
            border-radius: 12px;
            margin: 30px 0;
            display: inline-block;
          }
          .info-box {
            background-color: #FEF2F2;
            border-left: 4px solid #EF4444;
            padding: 16px;
            margin: 24px 0;
            border-radius: 4px;
            text-align: left;
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
            <h1>✉️ Email Verification</h1>
          </div>
          <div class="content">
            <h2>Hello ${userName || "there"}!</h2>
            <p>Thank you for signing up with LinkMe. To complete your registration, please use the following OTP code:</p>
            
            <div class="otp-box">${otp}</div>

            <div class="info-box">
              <p style="margin: 0;"><strong>⚠️ Important:</strong></p>
              <p style="margin: 8px 0 0 0; font-size: 14px;">
                • This code will expire in 10 minutes<br>
                • Do not share this code with anyone<br>
                • If you didn't request this code, please ignore this email
              </p>
            </div>

            <p>Best regards,<br><strong>The LinkMe Team</strong></p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} LinkMe. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `,
  text: `Email Verification\n\nHello ${
    userName || "there"
  }!\n\nYour OTP code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nBest regards,\nThe LinkMe Team`,
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

/**
 * Password validation
 */
const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  if (password.length < minLength) {
    return {
      isValid: false,
      message: "Password must be at least 8 characters long",
    };
  }
  if (!hasUpperCase) {
    return {
      isValid: false,
      message: "Password must contain at least one uppercase letter",
    };
  }
  if (!hasLowerCase) {
    return {
      isValid: false,
      message: "Password must contain at least one lowercase letter",
    };
  }
  if (!hasNumber) {
    return {
      isValid: false,
      message: "Password must contain at least one number",
    };
  }
  if (!hasSpecialChar) {
    return {
      isValid: false,
      message: "Password must contain at least one special character",
    };
  }

  return { isValid: true };
};

// ==================== AUTH CONTROLLER ====================

const authController = {
  async signUp(req, res) {
    try {
      const {
        firstName,
        secondName,
        lastName,
        email,
        password,
        phoneNumber,
        dateOfBirth,
      } = req.body;

      if (!firstName || !email || !password || !phoneNumber || !dateOfBirth) {
        return res.status(400).json({
          message:
            "firstName, email, password, phoneNumber, and dateOfBirth are required",
        });
      }

      const passwordValidation = validatePassword(password.trim());
      if (!passwordValidation.isValid) {
        return res.status(400).json({
          message: passwordValidation.message,
        });
      }

      const dob = new Date(dateOfBirth);
      if (isNaN(dob.getTime())) {
        return res.status(400).json({ message: "Invalid dateOfBirth format" });
      }

      if (!/^\+?\d{7,15}$/.test(phoneNumber)) {
        return res.status(400).json({
          message:
            "Invalid phone number format. Use digits only, optionally start with '+', length 7–15 digits.",
        });
      }

      const userExists = await User.findOne({
        where: { email: email.trim() },
      });
      if (userExists)
        return res.status(400).json({ message: "User already exists" });

      const otp = crypto.randomInt(100000, 999999).toString();

      const user = await User.create({
        firstName: firstName.trim(),
        secondName: secondName ? secondName.trim() : null,
        lastName: lastName ? lastName.trim() : null,
        email: email.trim(),
        password: password.trim(),
        phoneNumber: phoneNumber.trim(),
        dateOfBirth: dob,
        isVerified: false,
        otp,
      });

      // Send OTP email
      console.log("📧 Starting email send process...");
      console.log("📧 Email:", email);
      console.log("📧 OTP:", otp);
      console.log(
        "📧 RESEND_API_KEY:",
        process.env.RESEND_API_KEY ? "EXISTS" : "MISSING"
      );
      console.log("📧 EMAIL_FROM:", process.env.EMAIL_FROM);

      try {
        await sendOtpEmail(email, otp, firstName);
        console.log("✅ OTP email sent successfully to:", email);
      } catch (error) {
        console.error("❌ CRITICAL: Email sending failed!");
        console.error("Error name:", error.name);
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
        console.error("Full error:", JSON.stringify(error, null, 2));
      }

      return res.status(201).json({
        message:
          "Signup successful. Please verify your OTP sent to your email.",
      });
    } catch (error) {
      console.error("Signup error:", error);
      return res.status(500).json({
        message: "Error signing up",
        error: error.message,
      });
    }
  },

  async verifyOtp(req, res) {
    try {
      const { email, otp } = req.body;
      const user = await User.findOne({ where: { email: email.trim() } });

      if (!user) return res.status(404).json({ message: "User not found" });

      if (user.otp.trim() !== otp.trim()) {
        return res.status(400).json({ message: "Invalid OTP" });
      }

      user.isVerified = true;
      user.otp = null;

      const token = generateToken(user);
      const refreshToken = generateRefreshToken(user);

      user.refreshToken = refreshToken;
      await user.save();

      // Send welcome email after successful verification using template
      sendTemplatedEmail(user.email, "welcome", user.firstName).catch(
        (error) => {
          console.error("Error sending welcome email:", error);
        }
      );

      res.status(200).json({
        token,
        refreshToken,
        user: { id: user.id, email: user.email },
        message: "Email verified successfully! Welcome to LinkMe.",
      });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error verifying OTP", error: error.message });
    }
  },

  async resendOtp(req, res) {
    try {
      const { email } = req.body;

      const user = await User.findOne({ where: { email: email.trim() } });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.isVerified) {
        return res.status(400).json({
          message: "Your account is already verified. No need to resend OTP.",
        });
      }

      const otp = crypto.randomInt(100000, 999999).toString();
      user.otp = otp;
      await user.save();

      sendOtpEmail(email, otp, user.firstName).catch((error) => {
        console.error("Error sending OTP email:", error);
      });

      res.status(200).json({
        message: "OTP resent successfully. Please check your email.",
      });
    } catch (error) {
      res.status(500).json({
        message: "Error resending OTP",
        error: error.message,
      });
    }
  },

  async login(req, res) {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ where: { email: email.trim() } });

      if (!user || !(await user.comparePassword(password.trim()))) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      // Check if the user is verified
      if (!user.isVerified) {
        return res
          .status(400)
          .json({ message: "Please verify your email first" });
      }

      const token = generateToken(user);
      const refreshToken = generateRefreshToken(user);

      user.refreshToken = refreshToken;
      await user.save();

      res.status(200).json({
        token,
        refreshToken,
        user: { id: user.id, email: user.email, role: user.role },
      });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error logging in", error: error.message });
    }
  },

  async adminLogin(req, res) {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ where: { email: email.trim() } });

      if (!user || !(await user.comparePassword(password.trim()))) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      if (user.role !== "admin") {
        return res
          .status(403)
          .json({ message: "Access denied. Not an admin." });
      }

      const token = generateToken(user);
      const refreshToken = generateRefreshToken(user);

      user.refreshToken = refreshToken;
      await user.save();

      res.status(200).json({
        token,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      res.status(500).json({
        message: "Error logging in as admin",
        error: error.message,
      });
    }
  },

  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          message: "Refresh token is required",
        });
      }

      // Verify the refresh token
      let decoded;
      try {
        decoded = jwt.verify(refreshToken, SECRET_KEY);
      } catch (error) {
        return res.status(401).json({
          message: "Invalid or expired refresh token",
        });
      }

      // Find the user and verify the refresh token matches
      const user = await User.findOne({
        where: {
          id: decoded.id,
          refreshToken: refreshToken,
        },
      });

      if (!user) {
        return res.status(401).json({
          message: "Invalid refresh token",
        });
      }

      // Generate new tokens
      const newAccessToken = generateToken(user);
      const newRefreshToken = generateRefreshToken(user);

      // Update the refresh token in database
      user.refreshToken = newRefreshToken;
      await user.save();

      res.status(200).json({
        token: newAccessToken,
        refreshToken: newRefreshToken,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      console.error("Refresh token error:", error);
      res.status(500).json({
        message: "Error refreshing token",
        error: error.message,
      });
    }
  },

  async logout(req, res) {
    try {
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({
          message: "User ID is required",
        });
      }

      // Clear the refresh token from database
      const user = await User.findByPk(userId);

      if (user) {
        user.refreshToken = null;
        await user.save();
      }

      res.status(200).json({
        message: "Logged out successfully",
      });
    } catch (error) {
      res.status(500).json({
        message: "Error logging out",
        error: error.message,
      });
    }
  },

  async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      const user = await User.findOne({ where: { email: email.trim() } });
      if (!user) return res.status(404).json({ message: "User not found" });

      const resetToken = jwt.sign({ id: user.id }, SECRET_KEY, {
        expiresIn: "1h",
      });
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
      await user.save();

      // Use the resetPassword template from emailTemplates
      const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
      const template = emailTemplates.resetPassword(
        user.firstName,
        resetLink,
        60
      );

      await sendEmail({
        to: user.email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      }).catch((error) => {
        console.error("Error sending password reset email:", error);
      });

      res.status(200).json({
        message:
          "Password reset email sent successfully. Please check your email.",
      });
    } catch (error) {
      res.status(500).json({
        message: "Error sending password reset email",
        error: error.message,
      });
    }
  },

  async resetPassword(req, res) {
    try {
      const { token, newPassword } = req.body;

      const passwordValidation = validatePassword(newPassword.trim());
      if (!passwordValidation.isValid) {
        return res.status(400).json({
          message: passwordValidation.message,
        });
      }

      const decoded = jwt.verify(token, SECRET_KEY);

      const user = await User.findOne({
        where: {
          id: decoded.id,
          resetPasswordToken: token,
          resetPasswordExpires: { [Op.gt]: Date.now() },
        },
      });

      if (!user)
        return res.status(400).json({ message: "Invalid or expired token" });

      user.password = newPassword.trim();
      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;
      await user.save();

      // Send password change confirmation using notification template
      const message =
        "Your password has been successfully changed. If you didn't make this change, please contact our support team immediately.";
      const template = emailTemplates.notification(
        user.firstName,
        "Password Changed Successfully ✅",
        message,
        `${process.env.DASHBOARD_URL || process.env.FRONTEND_URL}/support`,
        "Contact Support"
      );

      sendEmail({
        to: user.email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      }).catch((error) => {
        console.error("Error sending password confirmation email:", error);
      });

      res.status(200).json({ message: "Password reset successfully" });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error resetting password", error: error.message });
    }
  },

  googleAuth: passport.authenticate("google", { scope: ["profile", "email"] }),
  googleAuthCallback: [
    passport.authenticate("google", { failureRedirect: "/login" }),
    async (req, res) => {
      const token = jwt.sign({ id: req.user.id }, SECRET_KEY, {
        expiresIn: "2h",
      });

      const refreshToken = generateRefreshToken(req.user);

      req.user.refreshToken = refreshToken;
      await req.user.save();

      const user = {
        id: req.user.id,
        firstName: req.user.firstName,
        email: req.user.email,
        role: req.user.role,
      };

      const userEncoded = encodeURIComponent(JSON.stringify(user));
      res.redirect(
        `${process.env.FRONTEND_URL}/oauth-success?token=${token}&refreshToken=${refreshToken}&user=${userEncoded}`
      );
    },
  ],

  facebookAuth: passport.authenticate("facebook", { scope: ["email"] }),
  facebookAuthCallback: [
    passport.authenticate("facebook", { failureRedirect: "/login" }),
    async (req, res) => {
      const token = jwt.sign({ id: req.user.id }, SECRET_KEY, {
        expiresIn: "2h",
      });

      const refreshToken = generateRefreshToken(req.user);

      req.user.refreshToken = refreshToken;
      await req.user.save();

      const user = {
        id: req.user.id,
        firstName: req.user.firstName,
        email: req.user.email,
        role: req.user.role,
      };

      const userEncoded = encodeURIComponent(JSON.stringify(user));
      res.redirect(
        `${process.env.FRONTEND_URL}/oauth-success?token=${token}&refreshToken=${refreshToken}&user=${userEncoded}`
      );
    },
  ],
};

module.exports = authController;
