const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const socialLinkController = require("../controllers/socialLinkController");

router.post("/", authMiddleware, socialLinkController.createSocialLink);

router.post(
  "/bulk",
  authMiddleware,
  socialLinkController.createMultipleSocialLinks
);

router.get(
  "/profile/:profileId",
  authMiddleware,
  socialLinkController.getSocialLinks
);

router.get(
  "/profile/:profileId/statistics",
  authMiddleware,
  socialLinkController.getLinksStatistics
);

router.put(
  "/profile/:profileId/reorder",
  authMiddleware,
  socialLinkController.reorderSocialLinks
);

router.delete(
  "/profile/:profileId/bulk-delete",
  authMiddleware,
  socialLinkController.bulkDeleteSocialLinks
);

router.get("/:id", authMiddleware, socialLinkController.getSocialLinkById);

router.put("/:id", authMiddleware, socialLinkController.updateSocialLink);

router.delete("/:id", authMiddleware, socialLinkController.deleteSocialLink);

router.patch(
  "/:id/toggle-visibility",
  authMiddleware,
  socialLinkController.toggleVisibility
);

router.post("/:id/click", socialLinkController.incrementClickCount);

module.exports = router;
