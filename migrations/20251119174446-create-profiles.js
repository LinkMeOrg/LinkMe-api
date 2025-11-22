"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Profiles", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
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
      profileType: {
        type: Sequelize.ENUM("personal", "business"),
        allowNull: false,
        defaultValue: "personal",
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      bio: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      avatarUrl: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      color: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: "#0066FF",
      },
      designMode: {
        type: Sequelize.ENUM("manual", "ai"),
        allowNull: false,
        defaultValue: "manual",
      },
      aiPrompt: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      aiBackground: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      template: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "modern",
      },
      slug: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      profileUrl: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      qrCodeUrl: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      viewCount: {
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

    // Add index for faster lookups
    await queryInterface.addIndex("Profiles", ["userId"]);
    await queryInterface.addIndex("Profiles", ["slug"]);
    await queryInterface.addIndex("Profiles", ["profileType"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("Profiles");
  },
};
