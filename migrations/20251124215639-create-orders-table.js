"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Orders", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      orderNumber: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      profileId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Profiles",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },

      // Customer Information
      customerFirstName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      customerLastName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      customerEmail: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      customerPhone: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      // Card Design Details (snapshot at time of order)
      cardType: {
        type: Sequelize.ENUM("personal", "business"),
        allowNull: false,
      },
      cardColor: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      cardTemplate: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "modern",
      },
      cardDesignMode: {
        type: Sequelize.ENUM("manual", "ai"),
        allowNull: false,
        defaultValue: "manual",
      },
      cardAiBackground: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      // Shipping Information
      shippingAddress: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      shippingCity: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      shippingCountry: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "Jordan",
      },
      shippingNotes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      // Payment Information
      paymentMethod: {
        type: Sequelize.ENUM("cash_on_delivery", "online"),
        allowNull: false,
        defaultValue: "cash_on_delivery",
      },
      totalAmount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.0,
      },

      // Order Status
      orderStatus: {
        type: Sequelize.ENUM(
          "pending",
          "confirmed",
          "processing",
          "shipped",
          "delivered",
          "cancelled"
        ),
        allowNull: false,
        defaultValue: "pending",
      },

      // Timestamps for status changes
      shippedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      deliveredAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },

      // Admin notes
      adminNotes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });

    // Add indexes
    await queryInterface.addIndex("Orders", ["userId"], {
      name: "orders_user_id",
    });

    await queryInterface.addIndex("Orders", ["profileId"], {
      name: "orders_profile_id",
    });

    await queryInterface.addIndex("Orders", ["orderNumber"], {
      unique: true,
      name: "orders_order_number_unique",
    });

    await queryInterface.addIndex("Orders", ["orderStatus"], {
      name: "orders_order_status",
    });

    await queryInterface.addIndex("Orders", ["createdAt"], {
      name: "orders_created_at",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("Orders");
  },
};
