const { User } = require("../models");
const jwt = require("jsonwebtoken");
const SECRET_KEY = process.env.JWT_SECRET;
const nodemailer = require("nodemailer");
const { Op } = require("sequelize");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const crypto = require("crypto");

// Google Strategy
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
            name: profile.displayName,
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

// Facebook Strategy
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
            name: profile.displayName,
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

// Session handling
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
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    to: email,
    from: process.env.EMAIL_USER,
    subject: "Your OTP for email verification",
    text: `Your OTP code is: ${otp}`,
  });
};

const authController = {
  async signUp(req, res) {
    try {
      const { name, email, password } = req.body;

      const userExists = await User.findOne({ where: { email: email.trim() } });
      if (userExists)
        return res.status(400).json({ message: "User already exists" });

      const otp = crypto.randomInt(100000, 999999).toString();

      const user = await User.create({
        name,
        email: email.trim(),
        password: password.trim(),
      });

      user.otp = otp;

      await user.save();

      await sendOtpEmail(email, otp);

      res
        .status(201)
        .json({ message: "Signup successful. Please verify your OTP." });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error signing up", error: error.message });
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

      user.isEmailVerified = true;
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

      await sendOtpEmail(email, otp);

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

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      await transporter.sendMail({
        to: user.email,
        from: process.env.EMAIL_USER,
        subject: "Password Reset",
        text: `Reset your password here: http://localhost:5173/reset-password/${resetToken}`,
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

  // Google auth
  googleAuth: passport.authenticate("google", { scope: ["profile", "email"] }),
  googleAuthCallback: [
    passport.authenticate("google", { failureRedirect: "/login" }),
    (req, res) => {
      const token = jwt.sign({ id: req.user.id }, SECRET_KEY, {
        expiresIn: "1w",
      });

      const user = {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
      };

      const userEncoded = encodeURIComponent(JSON.stringify(user));
      res.redirect(
        `http://localhost:5173/oauth-success?token=${token}&user=${userEncoded}`
      );
    },
  ],

  // Facebook auth
  facebookAuth: passport.authenticate("facebook", { scope: ["email"] }),
  facebookAuthCallback: [
    passport.authenticate("facebook", { failureRedirect: "/login" }),
    (req, res) => {
      const token = jwt.sign({ id: req.user.id }, SECRET_KEY, {
        expiresIn: "1w",
      });

      const user = {
        id: req.user.id,
        name: req.user.name,
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
