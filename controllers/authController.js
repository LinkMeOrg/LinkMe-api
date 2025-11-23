const { User } = require("../models");
const jwt = require("jsonwebtoken");
const SECRET_KEY = process.env.JWT_SECRET;
const { Op } = require("sequelize");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const crypto = require("crypto");
const { sendTemplatedEmail, sendEmail } = require("../utils/email");

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
  jwt.sign({ id: user.id }, SECRET_KEY, { expiresIn: "1w" });

const sendOtpEmail = async (email, otp, userName) => {
  await sendEmail({
    to: email,
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
};

const sendPasswordResetEmail = async (email, resetToken, userName) => {
  const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

  await sendEmail({
    to: email,
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
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔒 Password Reset Request</h1>
            </div>
            <div class="content">
              <h2>Hello ${userName || "there"},</h2>
              <p>We received a request to reset your password for your LinkMe account. Click the button below to create a new password:</p>
              
              <center>
                <a href="${resetLink}" class="button">Reset Password</a>
              </center>

              <div class="warning">
                <strong>⚠️ Important Security Information</strong>
                <p>• This link will expire in 1 hour</p>
                <p>• If you didn't request this password reset, please ignore this email</p>
                <p>• This link can only be used once</p>
                <p>• Never share this link with anyone</p>
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
    text: `Password Reset Request\n\nHello ${
      userName || "there"
    },\n\nWe received a request to reset your password. Click the link below to create a new password:\n\n${resetLink}\n\nThis link expires in 1 hour and can only be used once.\n\nIf you didn't request this password reset, please ignore this email.\n\nBest regards,\nThe LinkMe Security Team`,
  });
};

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
      sendOtpEmail(email, otp, firstName).catch((error) => {
        console.error("Error sending OTP email:", error);
      });

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
      await user.save();

      // Send welcome email after successful verification
      sendTemplatedEmail(user.email, "welcome", user.firstName).catch(
        (error) => {
          console.error("Error sending welcome email:", error);
        }
      );

      const token = generateToken(user);
      res.status(200).json({
        token,
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
      res.status(200).json({
        token,
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

      res.status(200).json({
        token,
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

      sendPasswordResetEmail(user.email, resetToken, user.firstName).catch(
        (error) => {
          console.error("Error sending password reset email:", error);
        }
      );

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

      // Send confirmation email
      sendEmail({
        to: user.email,
        subject: "Password Changed Successfully ✅",
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>✅ Password Changed Successfully</h1>
                </div>
                <div class="content">
                  <h2>Hello ${user.firstName},</h2>
                  <p>Your password has been successfully changed.</p>
                  <p>If you didn't make this change, please contact our support team immediately.</p>
                  <p>Best regards,<br><strong>The LinkMe Security Team</strong></p>
                </div>
              </div>
            </body>
          </html>
        `,
        text: `Password Changed Successfully\n\nHello ${user.firstName},\n\nYour password has been successfully changed.\n\nIf you didn't make this change, please contact our support team immediately.\n\nBest regards,\nThe LinkMe Security Team`,
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
    (req, res) => {
      const token = jwt.sign({ id: req.user.id }, SECRET_KEY, {
        expiresIn: "1w",
      });

      const user = {
        id: req.user.id,
        firstName: req.user.firstName,
        email: req.user.email,
        role: req.user.role,
      };

      const userEncoded = encodeURIComponent(JSON.stringify(user));
      res.redirect(
        `${process.env.FRONTEND_URL}/oauth-success?token=${token}&user=${userEncoded}`
      );
    },
  ],

  facebookAuth: passport.authenticate("facebook", { scope: ["email"] }),
  facebookAuthCallback: [
    passport.authenticate("facebook", { failureRedirect: "/login" }),
    (req, res) => {
      const token = jwt.sign({ id: req.user.id }, SECRET_KEY, {
        expiresIn: "1w",
      });

      const user = {
        id: req.user.id,
        firstName: req.user.firstName,
        email: req.user.email,
        role: req.user.role,
      };

      const userEncoded = encodeURIComponent(JSON.stringify(user));
      res.redirect(
        `${process.env.FRONTEND_URL}/oauth-success?token=${token}&user=${userEncoded}`
      );
    },
  ],
};

module.exports = authController;
