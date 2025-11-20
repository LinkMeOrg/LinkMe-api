const express = require("express");
const router = express.Router();

const profileRoutes = require("./profileRoutes");
const socialLinkRoutes = require("./socialLinkRoutes");
const analyticsRoutes = require("./analyticsRoutes");
const dashboardRoutes = require("./dashboardRoutes");
const adminDashboardRoutes = require("./adminDashboardRoutes");

router.use("/profiles", profileRoutes);
router.use("/social-links", socialLinkRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/admin/dashboard", adminDashboardRoutes);

router.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Dot LinkMe API - Smart Card System",
    version: "1.0.0",
    endpoints: {
      profiles: {
        base: "/api/profiles",
        description: "Profile management endpoints",
        count: 10,
      },
      socialLinks: {
        base: "/api/social-links",
        description: "Social link management endpoints",
        count: 12,
      },
      analytics: {
        base: "/api/analytics",
        description: "Analytics and tracking endpoints",
        count: 9,
      },
      dashboard: {
        base: "/api/dashboard",
        description: "Dashboard statistics endpoints",
        count: 3,
      },
      adminDashboard: {
        base: "/api/admin/dashboard",
        description: "Admin dashboard statistics endpoints",
        count: 2,
      },
    },
    documentation: "/api/docs",
  });
});

router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

module.exports = router;
