const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");
const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware);

router.get("/summary", dashboardController.getDashboardSummary);
router.get("/analytics/:profileId", dashboardController.getProfileAnalytics);
router.get("/recent-activity", dashboardController.getRecentActivity);

module.exports = router;
