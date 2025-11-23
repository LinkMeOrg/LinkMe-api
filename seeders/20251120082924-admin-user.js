"use strict";

const bcrypt = require("bcryptjs");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const hashedPassword = await bcrypt.hash("Admin@123", 10);

    return queryInterface.bulkInsert("Users", [
      {
        firstName: "System",
        secondName: null,
        lastName: "Admin",
        phoneNumber: "0000000000",
        dateOfBirth: "1990-01-01",
        isVerified: true,
        email: "admin@example.com",
        password: hashedPassword,
        role: "admin",
        otp: null,
        resetPasswordToken: null,
        resetPasswordExpires: null,
        googleId: null,
        facebookId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete("Users", { email: "admin@example.com" });
  },
};
