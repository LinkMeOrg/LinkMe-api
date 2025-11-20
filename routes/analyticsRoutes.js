const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const profileViewController = require("../controllers/profileViewController");

router.get(
  "/profile/:profileId",
  authMiddleware,
  profileViewController.getProfileAnalytics
);

router.get(
  "/profile/:profileId/recent-views",
  authMiddleware,
  profileViewController.getRecentViews
);

router.get(
  "/profile/:profileId/views-by-source",
  authMiddleware,
  profileViewController.getViewsBySource
);

router.get(
  "/profile/:profileId/views-by-location",
  authMiddleware,
  profileViewController.getViewsByLocation
);

router.get(
  "/profile/:profileId/views-by-device",
  authMiddleware,
  profileViewController.getViewsByDevice
);

router.get(
  "/profile/:profileId/views-over-time",
  authMiddleware,
  profileViewController.getViewsOverTime
);

router.delete(
  "/profile/:profileId/cleanup",
  authMiddleware,
  profileViewController.deleteOldViews
);

router.get("/user", authMiddleware, profileViewController.getAllUserAnalytics);

router.post("/track-view/:slug", profileViewController.trackProfileView);

module.exports = router;
