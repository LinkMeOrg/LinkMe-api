"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("PrivacyPolicies", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      version: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
        comment: "Version number of the policy (e.g., 1.0.0, 2.0.0)",
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
        defaultValue: "Privacy Policy",
      },
      content: {
        type: Sequelize.TEXT("long"),
        allowNull: false,
        comment: "Full content of the privacy policy",
      },
      effectiveDate: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: "Date when this version becomes effective",
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: "Whether this is the currently active version",
      },
      lastModifiedBy: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: "Admin user who last modified this version",
      },
      changesSummary: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: "Summary of changes in this version",
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

    // Add indexes for faster queries
    await queryInterface.addIndex("PrivacyPolicies", ["version"]);
    await queryInterface.addIndex("PrivacyPolicies", ["isActive"]);
    await queryInterface.addIndex("PrivacyPolicies", ["effectiveDate"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("PrivacyPolicies");
  },
};
