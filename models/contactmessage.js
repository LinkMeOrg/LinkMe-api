"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class ContactMessage extends Model {
    static associate(models) {}
  }
  ContactMessage.init(
    {
      name: DataTypes.STRING,
      email: DataTypes.STRING,
      message: DataTypes.TEXT,
    },
    {
      sequelize,
      modelName: "ContactMessage",
    }
  );
  return ContactMessage;
};
