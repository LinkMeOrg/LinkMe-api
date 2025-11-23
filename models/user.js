"use strict";
const { Model } = require("sequelize");
const bcrypt = require("bcryptjs");

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasMany(models.Profile, {
        foreignKey: "userId",
        as: "profiles",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });
    }

    async getProfiles(options = {}) {
      const { includeInactive = false } = options;

      const whereClause = includeInactive ? {} : { isActive: true };

      return await sequelize.models.Profile.findAll({
        where: {
          userId: this.id,
          ...whereClause,
        },
        include: [
          {
            model: sequelize.models.SocialLink,
            as: "socialLinks",
            where: { isVisible: true },
            required: false,
          },
        ],
        order: [["createdAt", "DESC"]],
      });
    }

    async getProfileByType(profileType) {
      return await sequelize.models.Profile.findOne({
        where: {
          userId: this.id,
          profileType,
          isActive: true,
        },
        include: [
          {
            model: sequelize.models.SocialLink,
            as: "socialLinks",
            where: { isVisible: true },
            required: false,
            order: [["order", "ASC"]],
          },
        ],
      });
    }

    async getProfileBySlug(slug) {
      return await sequelize.models.Profile.findOne({
        where: {
          userId: this.id,
          slug,
        },
        include: [
          {
            model: sequelize.models.SocialLink,
            as: "socialLinks",
            order: [["order", "ASC"]],
          },
        ],
      });
    }

    async getAnalyticsSummary() {
      const profiles = await sequelize.models.Profile.findAll({
        where: { userId: this.id },
        attributes: ["id", "name", "profileType", "viewCount"],
      });

      const totalViews = profiles.reduce(
        (sum, profile) => sum + profile.viewCount,
        0
      );

      const totalProfiles = profiles.length;
      const activeProfiles = profiles.filter((p) => p.isActive).length;

      const totalClicks = await sequelize.models.SocialLink.sum("clickCount", {
        include: [
          {
            model: sequelize.models.Profile,
            as: "profile",
            where: { userId: this.id },
            attributes: [],
          },
        ],
      });

      return {
        totalProfiles,
        activeProfiles,
        totalViews,
        totalClicks: totalClicks || 0,
        profiles: profiles.map((p) => ({
          id: p.id,
          name: p.name,
          type: p.profileType,
          views: p.viewCount,
        })),
      };
    }

    async canCreateProfile(profileType) {
      const existingProfile = await sequelize.models.Profile.findOne({
        where: {
          userId: this.id,
          profileType,
        },
      });

      return !existingProfile;
    }

    get fullName() {
      const nameParts = [this.firstName, this.secondName, this.lastName]
        .filter(Boolean)
        .join(" ");
      return nameParts || this.email;
    }

    get isProfileComplete() {
      return !!(
        this.firstName &&
        this.lastName &&
        this.phoneNumber &&
        this.dateOfBirth
      );
    }
  }

  User.init(
    {
      firstName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      secondName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      lastName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      phoneNumber: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      dateOfBirth: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      isVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      email: DataTypes.STRING,
      pendingEmail: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      password: DataTypes.STRING,
      role: {
        type: DataTypes.ENUM("user", "business", "admin"),
        defaultValue: "user",
        allowNull: false,
      },
      otp: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      otpExpires: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      googleId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      facebookId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      resetPasswordToken: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      resetPasswordExpires: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      refreshToken: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "User",
      hooks: {
        beforeCreate: async (user) => {
          if (user.password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
          }
        },
        beforeUpdate: async (user) => {
          if (user.changed("password")) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
          }
        },
      },
    }
  );

  User.prototype.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.password);
  };

  return User;
};
