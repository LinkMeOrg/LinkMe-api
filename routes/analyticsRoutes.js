// routes/analyticsRoutes.js
const express = require("express");
const router = express.Router();

// Import middleware
const authMiddleware = require("../middleware/authMiddleware");

// Import controller
const profileViewController = require("../controllers/profileViewController");

// ==================== PROTECTED ROUTES ====================
// Require authentication

/**
 * @route   GET /api/analytics/profile/:profileId
 * @desc    Get comprehensive analytics for profile
 * @access  Private
 * @query   ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&days=30
 */
router.get(
  "/profile/:profileId",
  authMiddleware,
  profileViewController.getProfileAnalytics
);

/**
 * @route   GET /api/analytics/profile/:profileId/recent-views
 * @desc    Get recent views with pagination
 * @access  Private
 * @query   ?limit=20&offset=0
 */
router.get(
  "/profile/:profileId/recent-views",
  authMiddleware,
  profileViewController.getRecentViews
);

/**
 * @route   GET /api/analytics/profile/:profileId/views-by-source
 * @desc    Get breakdown of views by source (NFC, QR, Link, Direct)
 * @access  Private
 * @query   ?days=30
 */
router.get(
  "/profile/:profileId/views-by-source",
  authMiddleware,
  profileViewController.getViewsBySource
);

/**
 * @route   GET /api/analytics/profile/:profileId/views-by-location
 * @desc    Get views breakdown by country and city
 * @access  Private
 * @query   ?days=30&limit=10
 */
router.get(
  "/profile/:profileId/views-by-location",
  authMiddleware,
  profileViewController.getViewsByLocation
);

/**
 * @route   GET /api/analytics/profile/:profileId/views-by-device
 * @desc    Get views breakdown by device and browser
 * @access  Private
 * @query   ?days=30
 */
router.get(
  "/profile/:profileId/views-by-device",
  authMiddleware,
  profileViewController.getViewsByDevice
);

/**
 * @route   GET /api/analytics/profile/:profileId/views-over-time
 * @desc    Get views over time for charts
 * @access  Private
 * @query   ?days=30
 */
router.get(
  "/profile/:profileId/views-over-time",
  authMiddleware,
  profileViewController.getViewsOverTime
);

/**
 * @route   DELETE /api/analytics/profile/:profileId/cleanup
 * @desc    Delete old analytics data (cleanup)
 * @access  Private
 * @body    { daysToKeep: 90 }
 */
router.delete(
  "/profile/:profileId/cleanup",
  authMiddleware,
  profileViewController.deleteOldViews
);

/**
 * @route   GET /api/analytics/user
 * @desc    Get analytics summary for all user profiles
 * @access  Private
 * @query   ?days=30
 */
router.get("/user", authMiddleware, profileViewController.getAllUserAnalytics);

// ==================== PUBLIC ROUTES ====================
// No authentication required

/**
 * @route   POST /api/analytics/track-view/:slug
 * @desc    Track a profile view (public endpoint)
 * @access  Public
 * @body    { source: "qr" | "nfc" | "link" | "direct" }
 */
router.post("/track-view/:slug", profileViewController.trackProfileView);

module.exports = router;
