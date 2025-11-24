"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Order extends Model {
    static associate(models) {
      // Belongs to User
      Order.belongsTo(models.User, {
        foreignKey: "userId",
        as: "user",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });

      // Belongs to Profile (the card they're ordering)
      Order.belongsTo(models.Profile, {
        foreignKey: "profileId",
        as: "profile",
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      });
    }

    // Instance method to update order status
    async updateStatus(newStatus) {
      this.orderStatus = newStatus;

      if (newStatus === "delivered") {
        this.deliveredAt = new Date();
      } else if (newStatus === "shipped") {
        this.shippedAt = new Date();
      }

      await this.save();
      return this;
    }

    // Static method to get orders by status
    static async getOrdersByStatus(status) {
      return await Order.findAll({
        where: { orderStatus: status },
        include: [
          {
            model: sequelize.models.User,
            as: "user",
            attributes: ["id", "firstName", "lastName", "email", "phoneNumber"],
          },
          {
            model: sequelize.models.Profile,
            as: "profile",
            attributes: [
              "id",
              "name",
              "profileType",
              "avatarUrl",
              "color",
              "template",
              "designMode",
              "aiBackground",
            ],
          },
        ],
        order: [["createdAt", "DESC"]],
      });
    }

    // Get formatted order details
    get formattedDetails() {
      return {
        orderId: this.orderNumber,
        customer: {
          name: `${this.customerFirstName} ${this.customerLastName}`,
          email: this.customerEmail,
          phone: this.customerPhone,
        },
        card: {
          type: this.cardType,
          design: {
            color: this.cardColor,
            template: this.cardTemplate,
            designMode: this.cardDesignMode,
            aiBackground: this.cardAiBackground,
          },
        },
        shipping: {
          address: this.shippingAddress,
          city: this.shippingCity,
          country: this.shippingCountry,
        },
        payment: {
          method: this.paymentMethod,
          amount: this.totalAmount,
        },
        status: this.orderStatus,
        dates: {
          ordered: this.createdAt,
          shipped: this.shippedAt,
          delivered: this.deliveredAt,
        },
      };
    }
  }

  Order.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      orderNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          notNull: { msg: "Order number is required" },
          notEmpty: { msg: "Order number cannot be empty" },
        },
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notNull: { msg: "User ID is required" },
        },
      },
      profileId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notNull: { msg: "Profile ID is required" },
        },
      },

      // Customer Information
      customerFirstName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: { msg: "First name is required" },
          notEmpty: { msg: "First name cannot be empty" },
        },
      },
      customerLastName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: { msg: "Last name is required" },
          notEmpty: { msg: "Last name cannot be empty" },
        },
      },
      customerEmail: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: { msg: "Email is required" },
          isEmail: { msg: "Must be a valid email address" },
        },
      },
      customerPhone: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: { msg: "Phone number is required" },
          notEmpty: { msg: "Phone number cannot be empty" },
        },
      },

      // Card Design Details (snapshot at time of order)
      cardType: {
        type: DataTypes.ENUM("personal", "business"),
        allowNull: false,
        validate: {
          isIn: {
            args: [["personal", "business"]],
            msg: "Card type must be either 'personal' or 'business'",
          },
        },
      },
      cardColor: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      cardTemplate: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "modern",
      },
      cardDesignMode: {
        type: DataTypes.ENUM("manual", "ai"),
        allowNull: false,
        defaultValue: "manual",
      },
      cardAiBackground: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      // Shipping Information
      shippingAddress: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: { msg: "Shipping address is required" },
          notEmpty: { msg: "Shipping address cannot be empty" },
        },
      },
      shippingCity: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: { msg: "City is required" },
        },
      },
      shippingCountry: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "Jordan",
      },
      shippingNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      // Payment Information
      paymentMethod: {
        type: DataTypes.ENUM("cash_on_delivery", "online"),
        allowNull: false,
        defaultValue: "cash_on_delivery",
        validate: {
          isIn: {
            args: [["cash_on_delivery", "online"]],
            msg: "Payment method must be either 'cash_on_delivery' or 'online'",
          },
        },
      },
      totalAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.0,
        validate: {
          min: { args: [0], msg: "Total amount must be positive" },
        },
      },

      // Order Status
      orderStatus: {
        type: DataTypes.ENUM(
          "pending",
          "confirmed",
          "processing",
          "shipped",
          "delivered",
          "cancelled"
        ),
        allowNull: false,
        defaultValue: "pending",
        validate: {
          isIn: {
            args: [
              [
                "pending",
                "confirmed",
                "processing",
                "shipped",
                "delivered",
                "cancelled",
              ],
            ],
            msg: "Invalid order status",
          },
        },
      },

      // Timestamps for status changes
      shippedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      deliveredAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      // Admin notes
      adminNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Order",
      tableName: "Orders",
      timestamps: true,
      hooks: {
        beforeValidate: async (order) => {
          // Generate unique order number if not provided
          if (!order.orderNumber) {
            const timestamp = Date.now();
            const random = Math.floor(Math.random() * 1000);
            order.orderNumber = `ORD-${timestamp}-${random}`;
          }
        },
        afterCreate: async (order) => {
          console.log(`New order created: ${order.orderNumber}`);
        },
      },
      indexes: [
        {
          fields: ["userId"],
        },
        {
          fields: ["profileId"],
        },
        {
          unique: true,
          fields: ["orderNumber"],
        },
        {
          fields: ["orderStatus"],
        },
        {
          fields: ["createdAt"],
        },
      ],
    }
  );

  return Order;
};
