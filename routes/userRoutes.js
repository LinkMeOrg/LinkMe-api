const express = require("express");
const router = express.Router();
const {
  getUserData,
  updateUserData,
  getAllUsersData,
  changeUserPassword,
  getAllUsersDataAdmin,
  getUserById,
  createUser,
  updateUserAdmin,
  deleteUser,
  toggleUserStatus,
  resetUserPassword,
  getUserStats,
  requestEmailChange,
  verifyEmailChange,
  cancelEmailChange,
} = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

// ============= EXISTING ROUTES (UNCHANGED) =============
router.get("/me", getUserData);
router.put("/me", updateUserData);
router.get("/all", getAllUsersData);
router.put("/me/password", changeUserPassword);

// ============= NEW ADMIN ROUTES =============
// Admin protected routes
router.get("/admin/all", authMiddleware, adminMiddleware, getAllUsersDataAdmin);
router.get("/admin/:id", authMiddleware, adminMiddleware, getUserById);
router.get("/admin/:id/stats", authMiddleware, adminMiddleware, getUserStats);
router.post("/admin/create", authMiddleware, adminMiddleware, createUser);
router.put("/admin/:id", authMiddleware, adminMiddleware, updateUserAdmin);
router.delete("/admin/:id", authMiddleware, adminMiddleware, deleteUser);
router.patch(
  "/admin/:id/toggle-status",
  authMiddleware,
  adminMiddleware,
  toggleUserStatus
);
router.post(
  "/admin/:id/reset-password",
  authMiddleware,
  adminMiddleware,
  resetUserPassword
);

router.post(
  "/me/request-email-change",
  authMiddleware,
  requestEmailChange
);
router.post(
  "/me/verify-email-change",
  authMiddleware,
  verifyEmailChange
);
router.post(
  "/me/cancel-email-change",
  authMiddleware,
  cancelEmailChange
);

module.exports = router;
