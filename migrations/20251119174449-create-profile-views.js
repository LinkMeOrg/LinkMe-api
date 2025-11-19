"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("ProfileViews", {
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
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      viewerIp: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      viewerCountry: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      viewerCity: {
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
      referrer: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      viewSource: {
        type: Sequelize.ENUM("nfc", "qr", "link", "direct"),
        allowNull: true,
        defaultValue: "direct",
      },
      viewedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
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

    // Add indexes for analytics queries
    await queryInterface.addIndex("ProfileViews", ["profileId"]);
    await queryInterface.addIndex("ProfileViews", ["viewedAt"]);
    await queryInterface.addIndex("ProfileViews", ["viewSource"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("ProfileViews");
  },
};
