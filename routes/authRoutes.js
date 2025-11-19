const express = require("express");
const authController = require("../controllers/authController");

const router = express.Router();

// Auth routes
router.post("/signup", authController.signUp);
router.post("/verify-otp", authController.verifyOtp);
router.post("/resend-otp", authController.resendOtp);
router.post("/login", authController.login);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);

// OAuth routes
router.get("/google", authController.googleAuth);
router.get("/google/callback", authController.googleAuthCallback);

router.get("/facebook", authController.facebookAuth);
router.get("/facebook/callback", authController.facebookAuthCallback);

module.exports = router;
