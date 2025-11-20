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

module.exports = router;
