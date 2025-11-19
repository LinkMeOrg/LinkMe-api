// routes/socialLinkRoutes.js
const express = require("express");
const router = express.Router();

// Import middleware
const authMiddleware = require("../middleware/authMiddleware");

// Import controller
const socialLinkController = require("../controllers/socialLinkController");

// ==================== PROTECTED ROUTES ====================
// Require authentication

/**
 * @route   POST /api/social-links
 * @desc    Create a single social link
 * @access  Private
 * @body    { profileId, platform, url, label, isVisible }
 */
router.post("/", authMiddleware, socialLinkController.createSocialLink);

/**
 * @route   POST /api/social-links/bulk
 * @desc    Create multiple social links at once
 * @access  Private
 * @body    { profileId, links: [{ platform, url, label, isVisible }] }
 */
router.post(
  "/bulk",
  authMiddleware,
  socialLinkController.createMultipleSocialLinks
);

/**
 * @route   GET /api/social-links/profile/:profileId
 * @desc    Get all social links for a specific profile
 * @access  Private
 * @query   ?includeHidden=true/false
 */
router.get(
  "/profile/:profileId",
  authMiddleware,
  socialLinkController.getSocialLinks
);

/**
 * @route   GET /api/social-links/profile/:profileId/statistics
 * @desc    Get statistics for all links in profile
 * @access  Private
 */
router.get(
  "/profile/:profileId/statistics",
  authMiddleware,
  socialLinkController.getLinksStatistics
);

/**
 * @route   PUT /api/social-links/profile/:profileId/reorder
 * @desc    Reorder social links
 * @access  Private
 * @body    { links: [{ id, order }] }
 */
router.put(
  "/profile/:profileId/reorder",
  authMiddleware,
  socialLinkController.reorderSocialLinks
);

/**
 * @route   DELETE /api/social-links/profile/:profileId/bulk-delete
 * @desc    Delete multiple social links at once
 * @access  Private
 * @body    { linkIds: [1, 2, 3] }
 */
router.delete(
  "/profile/:profileId/bulk-delete",
  authMiddleware,
  socialLinkController.bulkDeleteSocialLinks
);

/**
 * @route   GET /api/social-links/:id
 * @desc    Get specific social link by ID
 * @access  Private
 */
router.get("/:id", authMiddleware, socialLinkController.getSocialLinkById);

/**
 * @route   PUT /api/social-links/:id
 * @desc    Update social link
 * @access  Private
 * @body    { url, label, isVisible, order }
 */
router.put("/:id", authMiddleware, socialLinkController.updateSocialLink);

/**
 * @route   DELETE /api/social-links/:id
 * @desc    Delete social link
 * @access  Private
 */
router.delete("/:id", authMiddleware, socialLinkController.deleteSocialLink);

/**
 * @route   PATCH /api/social-links/:id/toggle-visibility
 * @desc    Toggle link visibility (show/hide)
 * @access  Private
 */
router.patch(
  "/:id/toggle-visibility",
  authMiddleware,
  socialLinkController.toggleVisibility
);

// ==================== PUBLIC ROUTES ====================
// No authentication required

/**
 * @route   POST /api/social-links/:id/click
 * @desc    Track click on social link (public)
 * @access  Public
 */
router.post("/:id/click", socialLinkController.incrementClickCount);

module.exports = router;
