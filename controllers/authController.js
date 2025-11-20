const { User } = require("../models");
const jwt = require("jsonwebtoken");
const SECRET_KEY = process.env.JWT_SECRET;
const nodemailer = require("nodemailer");
const { Op } = require("sequelize");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const crypto = require("crypto");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  pool: true,
  maxConnections: 5,
  maxMessages: 10,
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:4000/auth/google/callback",
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
          });
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
      callbackURL: "http://localhost:4000/auth/facebook/callback",
      profileFields: ["id", "displayName", "email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ where: { facebookId: profile.id } });

        if (!user) {
          user = await User.create({
            facebookId: profile.id,
            firstName: profile.displayName, // UPDATED
            secondName: null,
            lastName: null,
            email: profile.emails?.[0]?.value || `${profile.id}@facebook.com`,
            role: "user",
          });
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

const generateToken = (user) =>
  jwt.sign({ id: user.id }, SECRET_KEY, { expiresIn: "1w" });

const sendOtpEmail = async (email, otp) => {
  await transporter.sendMail({
    to: email,
    from: process.env.EMAIL_USER,
    subject: "Your OTP for email verification",
    text: `Your OTP code is: ${otp}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Email Verification</h2>
        <p>Your OTP code is:</p>
        <h1 style="color: #4CAF50; letter-spacing: 5px;">${otp}</h1>
        <p>This code will expire in 10 minutes.</p>
      </div>
    `,
  });
};

const sendPasswordResetEmail = async (email, resetToken) => {
  await transporter.sendMail({
    to: email,
    from: process.env.EMAIL_USER,
    subject: "Password Reset",
    text: `Reset your password here: http://localhost:5173/reset-password/${resetToken}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Password Reset Request</h2>
        <p>Click the button below to reset your password:</p>
        <a href="http://localhost:5173/reset-password/${resetToken}" 
           style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
          Reset Password
        </a>
        <p>Or copy this link: http://localhost:5173/reset-password/${resetToken}</p>
        <p>This link will expire in 1 hour.</p>
      </div>
    `,
  });
};

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

      const dob = new Date(dateOfBirth);
      if (isNaN(dob.getTime())) {
        return res.status(400).json({ message: "Invalid dateOfBirth format" });
      }

      if (!/^\d{7,15}$/.test(phoneNumber)) {
        return res.status(400).json({
          message:
            "Invalid phone number format. Use digits only, length 7–15 characters.",
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

      sendOtpEmail(email, otp).catch((error) => {
        console.error("Error sending OTP email:", error);
      });

      return res.status(201).json({
        message: "Signup successful. Please verify your OTP.",
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

      const token = generateToken(user);
      res.status(200).json({
        token,
        user: { id: user.id, email: user.email },
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

      const otp = crypto.randomInt(100000, 999999).toString();

      user.otp = otp;
      await user.save();

      sendOtpEmail(email, otp).catch((error) => {
        console.error("Error sending OTP email:", error);
      });

      res
        .status(200)
        .json({ message: "OTP resent successfully. Please check your email." });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error resending OTP", error: error.message });
    }
  },

  async login(req, res) {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ where: { email: email.trim() } });
      if (!user || !(await user.comparePassword(password.trim()))) {
        return res.status(400).json({ message: "Invalid credentials" });
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
      user.resetPasswordExpires = Date.now() + 3600000;
      await user.save();

      sendPasswordResetEmail(user.email, resetToken).catch((error) => {
        console.error("Error sending password reset email:", error);
      });

      res.status(200).json({ message: "Password reset email sent" });
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
        firstName: req.user.firstName, // UPDATED
        email: req.user.email,
        role: req.user.role,
      };

      const userEncoded = encodeURIComponent(JSON.stringify(user));
      res.redirect(
        `http://localhost:5173/oauth-success?token=${token}&user=${userEncoded}`
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
        firstName: req.user.firstName, // UPDATED
        email: req.user.email,
        role: req.user.role,
      };

      const userEncoded = encodeURIComponent(JSON.stringify(user));
      res.redirect(
        `http://localhost:5173/oauth-success?token=${token}&user=${userEncoded}`
      );
    },
  ],
};

module.exports = authController;
