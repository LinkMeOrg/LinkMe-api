"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      "Subscriptions",
      [
        {
          name: "Starter",
          description: "Perfect for small businesses just getting started",
          features: JSON.stringify([
            "Up to 5 products/services",
            "Basic analytics dashboard",
            "Email support (48h response)",
            "Standard security",
            "500MB storage",
          ]),
          priceWeekly: 7.99,
          priceMonthly: 24.99,
          priceYearly: 249.99,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "Professional",
          description: "For growing businesses with more needs",
          features: JSON.stringify([
            "Up to 50 products/services",
            "Advanced analytics",
            "Priority support (24h response)",
            "Enhanced security",
            "API access",
            "5GB storage",
            "Basic reporting",
          ]),
          priceWeekly: 14.99,
          priceMonthly: 49.99,
          priceYearly: 499.99,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "Business",
          description: "Complete solution for established businesses",
          features: JSON.stringify([
            "Unlimited products/services",
            "Premium analytics with insights",
            "24/7 dedicated support",
            "Enterprise-grade security",
            "Full API access",
            "50GB storage",
            "Advanced reporting",
            "Custom integrations",
            "Team accounts (up to 5 users)",
          ]),
          priceWeekly: 29.99,
          priceMonthly: 99.99,
          priceYearly: 999.99,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Subscriptions", null, {});
  },
};
