const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const {
  uploadProfile,
  handleUploadError,
} = require("../middleware/uploadMiddleware");

const profileController = require("../controllers/profileController");

router.post(
  "/",
  authMiddleware,
  uploadProfile,
  handleUploadError,
  profileController.createProfile
);

router.get("/", authMiddleware, profileController.getUserProfiles);

router.get("/:id", authMiddleware, profileController.getProfileById);

router.put(
  "/:id",
  authMiddleware,
  uploadProfile,
  handleUploadError,
  profileController.updateProfile
);

router.delete("/:id", authMiddleware, profileController.deleteProfile);

router.patch(
  "/:id/toggle-status",
  authMiddleware,
  profileController.toggleProfileStatus
);

router.get(
  "/:id/analytics",
  authMiddleware,
  profileController.getProfileAnalytics
);

router.post(
  "/:id/regenerate-qr",
  authMiddleware,
  profileController.regenerateQRCode
);

router.get(
  "/dashboard/summary",
  authMiddleware,
  profileController.getDashboardSummary
);

router.get("/public/:slug", profileController.getProfileBySlug);



module.exports = router;
