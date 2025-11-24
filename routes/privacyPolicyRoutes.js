"use strict";
const express = require("express");
const router = express.Router();
const PrivacyPolicyController = require("../controllers/privacyPolicyController");

// Optional: Import your authentication middleware
// const { authenticate, isAdmin } = require("../middleware/auth.middleware");

/**
 * @route   GET /api/privacy-policy
 * @desc    Get the currently active privacy policy
 * @access  Public
 */
router.get("/", PrivacyPolicyController.getActivePolicy);

/**
 * @route   GET /api/privacy-policy/versions
 * @desc    Get all privacy policy versions
 * @access  Admin (add authentication middleware)
 */
router.get(
  "/versions",
  // authenticate, isAdmin, // Uncomment when you have auth middleware
  PrivacyPolicyController.getAllVersions
);

/**
 * @route   GET /api/privacy-policy/:id
 * @desc    Get a specific privacy policy version by ID
 * @access  Public
 */
router.get("/:id", PrivacyPolicyController.getVersionById);

/**
 * @route   POST /api/privacy-policy
 * @desc    Create a new privacy policy version
 * @access  Admin (add authentication middleware)
 */
router.post(
  "/",
  // authenticate, isAdmin, // Uncomment when you have auth middleware
  PrivacyPolicyController.createVersion
);

/**
 * @route   PUT /api/privacy-policy/:id
 * @desc    Update an existing privacy policy version
 * @access  Admin (add authentication middleware)
 */
router.put(
  "/:id",
  // authenticate, isAdmin, // Uncomment when you have auth middleware
  PrivacyPolicyController.updateVersion
);

/**
 * @route   PATCH /api/privacy-policy/:id/activate
 * @desc    Set a specific version as active
 * @access  Admin (add authentication middleware)
 */
router.patch(
  "/:id/activate",
  // authenticate, isAdmin, // Uncomment when you have auth middleware
  PrivacyPolicyController.activateVersion
);

/**
 * @route   DELETE /api/privacy-policy/:id
 * @desc    Delete a privacy policy version
 * @access  Admin (add authentication middleware)
 */
router.delete(
  "/:id",
  // authenticate, isAdmin, // Uncomment when you have auth middleware
  PrivacyPolicyController.deleteVersion
);

module.exports = router;
