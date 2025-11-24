const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");

// Import auth middleware - adjust path if needed
const authMiddleware = require("../middleware/authMiddleware");
const protect = authMiddleware.protect || authMiddleware;

// Temporary admin check middleware
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin only.",
    });
  }
};

// ==================== USER ROUTES ====================

// Create new order
router.post("/", protect, orderController.createOrder);

// Get user's orders
router.get("/my-orders", protect, orderController.getUserOrders);

// Get single order details
router.get("/:orderId", protect, orderController.getOrderById);

// ==================== ADMIN ROUTES ====================

// Get all orders with optional filtering
router.get("/admin/all", protect, adminOnly, orderController.getAllOrders);

// Get order statistics
router.get(
  "/admin/statistics",
  protect,
  adminOnly,
  orderController.getOrderStatistics
);

// Update order status
router.patch(
  "/admin/:orderId/status",
  protect,
  adminOnly,
  orderController.updateOrderStatus
);

// Delete order (use with caution)
router.delete(
  "/admin/:orderId",
  protect,
  adminOnly,
  orderController.deleteOrder
);

module.exports = router;
