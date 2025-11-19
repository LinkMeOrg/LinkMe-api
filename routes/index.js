// routes/index.js
const express = require("express");
const router = express.Router();

// Import route modules
const profileRoutes = require("./profileRoutes");
const socialLinkRoutes = require("./socialLinkRoutes");
const analyticsRoutes = require("./analyticsRoutes");

// ==================== API ROUTES ====================

/**
 * Profile Routes
 * Base: /api/profiles
 */
router.use("/profiles", profileRoutes);

/**
 * Social Link Routes
 * Base: /api/social-links
 */
router.use("/social-links", socialLinkRoutes);

/**
 * Analytics Routes
 * Base: /api/analytics
 */
router.use("/analytics", analyticsRoutes);

// ==================== API INFO ENDPOINT ====================

/**
 * @route   GET /api
 * @desc    Get API information
 * @access  Public
 */
router.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Dot LinkMe API - Smart Card System",
    version: "1.0.0",
    endpoints: {
      profiles: {
        base: "/api/profiles",
        description: "Profile management endpoints",
        count: 10,
      },
      socialLinks: {
        base: "/api/social-links",
        description: "Social link management endpoints",
        count: 12,
      },
      analytics: {
        base: "/api/analytics",
        description: "Analytics and tracking endpoints",
        count: 9,
      },
    },
    documentation: "/api/docs",
  });
});

/**
 * @route   GET /api/health
 * @desc    Health check endpoint
 * @access  Public
 */
router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ==================== 404 HANDLER ====================
router.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
    path: req.originalUrl,
  });
});

module.exports = router;
