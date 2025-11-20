const express = require("express");
const router = express.Router();
const adminDashboardController = require("../controllers/adminDashboardController");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

router.use(authMiddleware);
router.use(adminMiddleware);

router.get("/stats", adminDashboardController.getDashboardStats);
router.get("/recent-activity", adminDashboardController.getRecentActivity);

router.get(
  "/profiles/all",
  authMiddleware,
  adminDashboardController.getAllProfilesForAdmin
);

module.exports = router;
