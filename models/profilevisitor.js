"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class ProfileVisitor extends Model {
    static associate(models) {
      ProfileVisitor.belongsTo(models.Profile, {
        foreignKey: "profileId",
        as: "profile",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });
    }
  }

  ProfileVisitor.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      profileId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notNull: { msg: "Profile ID is required" },
        },
      },
      visitorEmail: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isEmail: { msg: "Please provide a valid email address" },
          notEmpty: { msg: "Email cannot be empty" },
        },
      },
      visitorPhone: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: { msg: "Phone number cannot be empty" },
          len: {
            args: [7, 20],
            msg: "Phone number must be between 7 and 20 characters",
          },
        },
      },
      visitorIp: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      visitorCountry: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      visitorCity: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      userAgent: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      device: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      browser: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      viewSource: {
        type: DataTypes.ENUM("nfc", "qr", "link", "direct"),
        allowNull: true,
        defaultValue: "direct",
      },
      submittedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: "ProfileVisitor",
      tableName: "ProfileVisitors",
      hooks: {
        beforeCreate: async (visitor) => {
          if (visitor.visitorEmail) {
            visitor.visitorEmail = visitor.visitorEmail.toLowerCase().trim();
          }
          if (visitor.visitorPhone) {
            visitor.visitorPhone = visitor.visitorPhone.trim();
          }
        },
      },
      indexes: [
        { fields: ["profileId"] },
        { fields: ["visitorEmail"] },
        { fields: ["submittedAt"] },
      ],
    }
  );

  return ProfileVisitor;
};
