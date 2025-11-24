"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class SocialLink extends Model {
    static associate(models) {
      // Belongs to Profile
      SocialLink.belongsTo(models.Profile, {
        foreignKey: "profileId",
        as: "profile",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });
    }

    // Instance method to increment click count
    async incrementClickCount() {
      this.clickCount += 1;
      await this.save();
      return this.clickCount;
    }

    // Instance method to toggle visibility
    async toggleVisibility() {
      this.isVisible = !this.isVisible;
      await this.save();
      return this.isVisible;
    }

    // Static method to get platform icon
    static getPlatformIcon(platform) {
      const icons = {
        website: "🌐",
        linkedin: "💼",
        instagram: "📸",
        twitter: "🐦",
        github: "💻",
        whatsapp: "💬",
        email: "📧",
        phone: "📱",
      };
      return icons[platform] || "🔗";
    }

    // Instance method to get formatted URL
    getFormattedUrl() {
      const { platform, url } = this;

      // Format phone numbers
      if (platform === "phone") {
        return `tel:${url.replace(/\D/g, "")}`;
      }

      // Format email
      if (platform === "email") {
        return `mailto:${url}`;
      }

      // Format WhatsApp
      if (platform === "whatsapp") {
        const cleanNumber = url.replace(/\D/g, "");
        return `https://wa.me/${cleanNumber}`;
      }

      // Return URL as is for other platforms
      return url;
    }

    // Virtual field to get icon
    get icon() {
      return SocialLink.getPlatformIcon(this.platform);
    }

    // Virtual field to get display label
    get displayLabel() {
      return (
        this.label ||
        this.platform.charAt(0).toUpperCase() + this.platform.slice(1)
      );
    }
  }

  SocialLink.init(
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
          notNull: {
            msg: "Profile ID is required",
          },
          notEmpty: {
            msg: "Profile ID cannot be empty",
          },
        },
      },
      platform: {
        type: DataTypes.ENUM(
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
        validate: {
          notNull: {
            msg: "Platform is required",
          },
          isIn: {
            args: [
              [
                "website",
                "linkedin",
                "instagram",
                "twitter",
                "github",
                "whatsapp",
                "email",
                "phone",
              ],
            ],
            msg: "Invalid platform type",
          },
        },
      },
      url: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: "URL is required",
          },
          notEmpty: {
            msg: "URL cannot be empty",
          },
          customValidator(value) {
            // Validate based on platform
            if (this.platform === "email") {
              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              if (!emailRegex.test(value)) {
                throw new Error("Invalid email address");
              }
            } else if (this.platform === "phone") {
              const phoneRegex = /^[\d\s\-\+\(\)]+$/;
              if (!phoneRegex.test(value)) {
                throw new Error("Invalid phone number");
              }
            } else if (this.platform === "whatsapp") {
              // WhatsApp can be stored as URL format: https://wa.me/XXXXXXXXXXX
              // Extract the number from the URL or validate raw number
              let numberToValidate = value;

              // If it's a wa.me URL, extract the number
              if (value.includes("wa.me/")) {
                const match = value.match(/wa\.me\/(\d+)/);
                if (match && match[1]) {
                  numberToValidate = match[1];
                } else {
                  throw new Error("Invalid WhatsApp URL format");
                }
              }

              // Remove any spaces, dashes, parentheses
              const cleanNumber = numberToValidate.replace(/[\s\-\(\)]/g, "");

              // Validate: must be digits only and between 9-15 characters
              const whatsappRegex = /^\d{9,15}$/;
              if (!whatsappRegex.test(cleanNumber)) {
                throw new Error("WhatsApp number must be 9-15 digits");
              }
            } else {
              // Validate URL for other platforms
              try {
                new URL(value);
              } catch (e) {
                throw new Error("Invalid URL format");
              }
            }
          },
        },
      },
      label: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          len: {
            args: [0, 100],
            msg: "Label must be less than 100 characters",
          },
        },
      },
      isVisible: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      order: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: {
          min: {
            args: [1],
            msg: "Order must be a positive number",
          },
        },
      },
      clickCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: {
          min: {
            args: [0],
            msg: "Click count cannot be negative",
          },
        },
      },
    },
    {
      sequelize,
      modelName: "SocialLink",
      tableName: "SocialLinks",
      hooks: {
        beforeCreate: async (socialLink) => {
          // Trim and clean the URL
          if (socialLink.url) {
            socialLink.url = socialLink.url.trim();
          }

          // Auto-set order if not provided
          if (socialLink.order === 0) {
            const maxOrder = await SocialLink.max("order", {
              where: { profileId: socialLink.profileId },
            });
            socialLink.order = (maxOrder || 0) + 1;
          }
        },
        beforeUpdate: async (socialLink) => {
          // Trim and clean the URL on update
          if (socialLink.url) {
            socialLink.url = socialLink.url.trim();
          }
        },
        afterCreate: async (socialLink) => {
          console.log(
            `New social link added: ${socialLink.platform} for profile ${socialLink.profileId}`
          );
        },
      },
      indexes: [
        {
          fields: ["profileId"],
        },
        {
          fields: ["platform"],
        },
        {
          unique: true,
          fields: ["profileId", "platform"],
          name: "unique_profile_platform",
        },
      ],
    }
  );

  return SocialLink;
};
