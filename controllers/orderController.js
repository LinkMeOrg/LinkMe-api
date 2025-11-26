const { Order, User, Profile } = require("../models");

exports.createOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      profileId,
      customerInfo,
      shippingInfo,
      cardDesign,
      paymentMethod,
      totalAmount,
    } = req.body;

    // Validate profile exists and belongs to user
    const profile = await Profile.findOne({
      where: { id: profileId, userId },
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found or does not belong to you",
      });
    }

    // Create order
    const order = await Order.create({
      userId,
      profileId,
      customerFirstName: customerInfo.firstName,
      customerLastName: customerInfo.lastName,
      customerEmail: customerInfo.email,
      customerPhone: customerInfo.phone,
      shippingAddress: shippingInfo.address,
      shippingCity: shippingInfo.city,
      shippingCountry: shippingInfo.country || "Jordan",
      shippingNotes: shippingInfo.notes,
      cardType: profile.profileType,
      cardColor: cardDesign.color || profile.color,
      cardTemplate: cardDesign.template || profile.template,
      cardDesignMode: cardDesign.designMode || profile.designMode,
      cardAiBackground: cardDesign.aiBackground || profile.aiBackground,
      paymentMethod: paymentMethod || "cash_on_delivery",
      totalAmount: totalAmount || 0,
      orderStatus: "pending",
    });

    // Fetch order with relations
    const orderWithDetails = await Order.findByPk(order.id, {
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "firstName", "lastName", "email"],
        },
        {
          model: Profile,
          as: "profile",
          attributes: ["id", "name", "profileType", "avatarUrl"],
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: orderWithDetails,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create order",
      error: error.message,
    });
  }
};

exports.getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;

    const orders = await Order.findAll({
      where: { userId },
      include: [
        {
          model: Profile,
          as: "profile",
          attributes: [
            "id",
            "name",
            "profileType",
            "avatarUrl",
            "color",
            "template",
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.error("Error fetching user orders:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: error.message,
    });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.params;

    const order = await Order.findOne({
      where: { id: orderId, userId },
      include: [
        {
          model: Profile,
          as: "profile",
          attributes: [
            "id",
            "name",
            "title",
            "bio",
            "profileType",
            "avatarUrl",
            "color",
            "template",
            "designMode",
            "aiBackground",
          ],
        },
      ],
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch order",
      error: error.message,
    });
  }
};

// ==================== ADMIN ENDPOINTS ====================

// Get all orders (Admin only)
exports.getAllOrders = async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;

    const whereClause = status ? { orderStatus: status } : {};

    const orders = await Order.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "firstName", "lastName", "email", "phoneNumber"],
        },
        {
          model: Profile,
          as: "profile",
          attributes: [
            "id",
            "name",
            "profileType",
            "avatarUrl",
            "color",
            "template",
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      success: true,
      data: {
        orders: orders.rows,
        total: orders.count,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    console.error("Error fetching all orders:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: error.message,
    });
  }
};

// Update order status (Admin only)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, adminNotes } = req.body;

    const order = await Order.findByPk(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Update status
    await order.updateStatus(status);

    // Update admin notes if provided
    if (adminNotes !== undefined) {
      order.adminNotes = adminNotes;
      await order.save();
    }

    // Fetch updated order with relations
    const updatedOrder = await Order.findByPk(orderId, {
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "firstName", "lastName", "email", "phoneNumber"],
        },
        {
          model: Profile,
          as: "profile",
          attributes: ["id", "name", "profileType", "avatarUrl"],
        },
      ],
    });

    res.json({
      success: true,
      message: "Order status updated successfully",
      data: updatedOrder,
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update order status",
      error: error.message,
    });
  }
};

// Get order statistics (Admin only)
exports.getOrderStatistics = async (req, res) => {
  try {
    const { Sequelize } = require("sequelize");

    // Count orders by status
    const ordersByStatus = await Order.findAll({
      attributes: [
        "orderStatus",
        [Sequelize.fn("COUNT", Sequelize.col("id")), "count"],
      ],
      group: ["orderStatus"],
      raw: true,
    });

    // Total revenue
    const totalRevenue = await Order.sum("totalAmount", {
      where: {
        orderStatus: ["delivered"],
      },
    });

    // Orders this month
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const ordersThisMonth = await Order.count({
      where: {
        createdAt: {
          [Sequelize.Op.gte]: currentMonth,
        },
      },
    });

    // Recent orders
    const recentOrders = await Order.findAll({
      limit: 10,
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: User,
          as: "user",
          attributes: ["firstName", "lastName", "email"],
        },
      ],
    });

    res.json({
      success: true,
      data: {
        ordersByStatus,
        totalRevenue: totalRevenue || 0,
        ordersThisMonth,
        recentOrders,
      },
    });
  } catch (error) {
    console.error("Error fetching order statistics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch order statistics",
      error: error.message,
    });
  }
};

// Delete order (Admin only - use with caution)
exports.deleteOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findByPk(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    await order.destroy();

    res.json({
      success: true,
      message: "Order deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting order:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete order",
      error: error.message,
    });
  }
};
