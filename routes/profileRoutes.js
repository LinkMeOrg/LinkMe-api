// routes/profileRoutes.js
const express = require("express");
const router = express.Router();

// Import middleware
const authMiddleware = require("../middleware/authMiddleware");
const {
  uploadProfile,
  handleUploadError,
} = require("../middleware/uploadMiddleware");

// Import controller
const profileController = require("../controllers/profileController");

// ==================== PROTECTED ROUTES ====================
// Require authentication

/**
 * @route   POST /api/profiles
 * @desc    Create a new profile (personal or business)
 * @access  Private
 * @body    { profileType, name, title, bio, color, designMode, template, socialLinks }
 * @file    avatar (optional)
 */
router.post(
  "/",
  authMiddleware,
  uploadProfile,
  handleUploadError,
  profileController.createProfile
);

/**
 * @route   GET /api/profiles
 * @desc    Get all profiles for authenticated user
 * @access  Private
 * @query   ?includeInactive=true/false
 */
router.get("/", authMiddleware, profileController.getUserProfiles);

/**
 * @route   GET /api/profiles/:id
 * @desc    Get specific profile by ID (owner only)
 * @access  Private
 */
router.get("/:id", authMiddleware, profileController.getProfileById);

/**
 * @route   PUT /api/profiles/:id
 * @desc    Update profile
 * @access  Private
 * @body    { name, title, bio, color, designMode, template, isActive }
 * @file    avatar (optional)
 */
router.put(
  "/:id",
  authMiddleware,
  uploadProfile,
  handleUploadError,
  profileController.updateProfile
);

/**
 * @route   DELETE /api/profiles/:id
 * @desc    Delete profile and all associated data
 * @access  Private
 */
router.delete("/:id", authMiddleware, profileController.deleteProfile);

/**
 * @route   PATCH /api/profiles/:id/toggle-status
 * @desc    Toggle profile active/inactive status
 * @access  Private
 */
router.patch(
  "/:id/toggle-status",
  authMiddleware,
  profileController.toggleProfileStatus
);

/**
 * @route   GET /api/profiles/:id/analytics
 * @desc    Get comprehensive analytics for profile
 * @access  Private
 * @query   ?days=30
 */
router.get(
  "/:id/analytics",
  authMiddleware,
  profileController.getProfileAnalytics
);

/**
 * @route   POST /api/profiles/:id/regenerate-qr
 * @desc    Regenerate QR code for profile
 * @access  Private
 */
router.post(
  "/:id/regenerate-qr",
  authMiddleware,
  profileController.regenerateQRCode
);

/**
 * @route   GET /api/profiles/dashboard/summary
 * @desc    Get dashboard summary for authenticated user
 * @access  Private
 */
router.get(
  "/dashboard/summary",
  authMiddleware,
  profileController.getDashboardSummary
);

// ==================== PUBLIC ROUTES ====================
// No authentication required

/**
 * @route   GET /api/profiles/public/:slug
 * @desc    Get profile by slug (public view)
 * @access  Public
 */
router.get("/public/:slug", profileController.getProfileBySlug);

module.exports = router;
