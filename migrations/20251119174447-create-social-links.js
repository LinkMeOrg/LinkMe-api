"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("SocialLinks", {
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
      platform: {
        type: Sequelize.ENUM(
          "website",
          "linkedin",
          "instagram",
          "twitter",
          "github",
          "whatsapp",
          "email",
          "phone"
        ),
        allowNull: false,
      },
      url: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      label: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      isVisible: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      order: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      clickCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
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
    await queryInterface.addIndex("SocialLinks", ["profileId"]);
    await queryInterface.addIndex("SocialLinks", ["platform"]);

    // Add composite unique constraint to prevent duplicate platforms per profile
    await queryInterface.addConstraint("SocialLinks", {
      fields: ["profileId", "platform"],
      type: "unique",
      name: "unique_profile_platform",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("SocialLinks");
  },
};
