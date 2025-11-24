"use strict";
const express = require("express");
const router = express.Router();
const TermsAndConditionsController = require("../controllers/termsAndConditionsController");

// Optional: Import your authentication middleware
// const { authenticate, isAdmin } = require("../middleware/auth.middleware");

/**
 * @route   GET /api/terms
 * @desc    Get the currently active terms and conditions
 * @access  Public
 */
router.get("/", TermsAndConditionsController.getActiveTerms);

/**
 * @route   GET /api/terms/versions
 * @desc    Get all terms and conditions versions
 * @access  Admin (add authentication middleware)
 */
router.get(
  "/versions",
  // authenticate, isAdmin, // Uncomment when you have auth middleware
  TermsAndConditionsController.getAllVersions
);

/**
 * @route   GET /api/terms/:id
 * @desc    Get a specific terms and conditions version by ID
 * @access  Public
 */
router.get("/:id", TermsAndConditionsController.getVersionById);

/**
 * @route   POST /api/terms
 * @desc    Create a new terms and conditions version
 * @access  Admin (add authentication middleware)
 */
router.post(
  "/",
  // authenticate, isAdmin, // Uncomment when you have auth middleware
  TermsAndConditionsController.createVersion
);

/**
 * @route   PUT /api/terms/:id
 * @desc    Update an existing terms and conditions version
 * @access  Admin (add authentication middleware)
 */
router.put(
  "/:id",
  // authenticate, isAdmin, // Uncomment when you have auth middleware
  TermsAndConditionsController.updateVersion
);

/**
 * @route   PATCH /api/terms/:id/activate
 * @desc    Set a specific version as active
 * @access  Admin (add authentication middleware)
 */
router.patch(
  "/:id/activate",
  // authenticate, isAdmin, // Uncomment when you have auth middleware
  TermsAndConditionsController.activateVersion
);

/**
 * @route   DELETE /api/terms/:id
 * @desc    Delete a terms and conditions version
 * @access  Admin (add authentication middleware)
 */
router.delete(
  "/:id",
  // authenticate, isAdmin, // Uncomment when you have auth middleware
  TermsAndConditionsController.deleteVersion
);

module.exports = router;
