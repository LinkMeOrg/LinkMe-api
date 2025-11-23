"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("ProfileVisitors", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      profileId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Profiles",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      visitorEmail: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      visitorPhone: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      visitorIp: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      visitorCountry: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      visitorCity: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      userAgent: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      device: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      browser: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      viewSource: {
        type: Sequelize.ENUM("nfc", "qr", "link", "direct"),
        allowNull: true,
        defaultValue: "direct",
      },
      submittedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
    });

    // Add indexes
    await queryInterface.addIndex("ProfileVisitors", ["profileId"]);
    await queryInterface.addIndex("ProfileVisitors", ["visitorEmail"]);
    await queryInterface.addIndex("ProfileVisitors", ["submittedAt"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("ProfileVisitors");
  },
};
