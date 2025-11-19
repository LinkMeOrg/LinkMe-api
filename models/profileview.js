"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class ProfileView extends Model {
    static associate(models) {
      // Belongs to Profile
      ProfileView.belongsTo(models.Profile, {
        foreignKey: "profileId",
        as: "profile",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });
    }

    // Static method to get analytics for a profile
    static async getProfileAnalytics(profileId, options = {}) {
      const { startDate, endDate } = options;

      const whereClause = { profileId };

      if (startDate || endDate) {
        whereClause.viewedAt = {};
        if (startDate) whereClause.viewedAt[sequelize.Op.gte] = startDate;
        if (endDate) whereClause.viewedAt[sequelize.Op.lte] = endDate;
      }

      // Total views
      const totalViews = await ProfileView.count({ where: whereClause });

      // Views by source
      const viewsBySource = await ProfileView.findAll({
        where: whereClause,
        attributes: [
          "viewSource",
          [sequelize.fn("COUNT", sequelize.col("id")), "count"],
        ],
        group: ["viewSource"],
        raw: true,
      });

      // Views by country
      const viewsByCountry = await ProfileView.findAll({
        where: whereClause,
        attributes: [
          "viewerCountry",
          [sequelize.fn("COUNT", sequelize.col("id")), "count"],
        ],
        group: ["viewerCountry"],
        order: [[sequelize.fn("COUNT", sequelize.col("id")), "DESC"]],
        limit: 10,
        raw: true,
      });

      // Views by device
      const viewsByDevice = await ProfileView.findAll({
        where: whereClause,
        attributes: [
          "device",
          [sequelize.fn("COUNT", sequelize.col("id")), "count"],
        ],
        group: ["device"],
        raw: true,
      });

      // Views by browser
      const viewsByBrowser = await ProfileView.findAll({
        where: whereClause,
        attributes: [
          "browser",
          [sequelize.fn("COUNT", sequelize.col("id")), "count"],
        ],
        group: ["browser"],
        raw: true,
      });

      // Recent views (last 10)
      const recentViews = await ProfileView.findAll({
        where: whereClause,
        order: [["viewedAt", "DESC"]],
        limit: 10,
        attributes: [
          "viewedAt",
          "viewerCountry",
          "viewerCity",
          "device",
          "viewSource",
        ],
      });

      return {
        totalViews,
        viewsBySource,
        viewsByCountry,
        viewsByDevice,
        viewsByBrowser,
        recentViews,
      };
    }

    // Static method to get views over time (for charts)
    static async getViewsOverTime(profileId, days = 30) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const views = await ProfileView.findAll({
        where: {
          profileId,
          viewedAt: {
            [sequelize.Op.gte]: startDate,
          },
        },
        attributes: [
          [sequelize.fn("DATE", sequelize.col("viewedAt")), "date"],
          [sequelize.fn("COUNT", sequelize.col("id")), "count"],
        ],
        group: [sequelize.fn("DATE", sequelize.col("viewedAt"))],
        order: [[sequelize.fn("DATE", sequelize.col("viewedAt")), "ASC"]],
        raw: true,
      });

      return views;
    }

    // Static method to track a new view
    static async trackView(profileId, viewData) {
      try {
        const view = await ProfileView.create({
          profileId,
          viewerIp: viewData.ip || null,
          viewerCountry: viewData.country || null,
          viewerCity: viewData.city || null,
          userAgent: viewData.userAgent || null,
          device: viewData.device || null,
          browser: viewData.browser || null,
          referrer: viewData.referrer || null,
          viewSource: viewData.source || "direct",
          viewedAt: new Date(),
        });

        // Increment profile view count
        const profile = await sequelize.models.Profile.findByPk(profileId);
        if (profile) {
          await profile.incrementViewCount();
        }

        return view;
      } catch (error) {
        console.error("Error tracking view:", error);
        throw error;
      }
    }

    // Instance method to get location string
    get location() {
      if (this.viewerCity && this.viewerCountry) {
        return `${this.viewerCity}, ${this.viewerCountry}`;
      }
      return this.viewerCountry || "Unknown";
    }

    // Instance method to get device info
    get deviceInfo() {
      const parts = [];
      if (this.device) parts.push(this.device);
      if (this.browser) parts.push(this.browser);
      return parts.join(" • ") || "Unknown";
    }
  }

  ProfileView.init(
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
      viewerIp: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          isIP: {
            msg: "Invalid IP address format",
          },
        },
      },
      viewerCountry: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          len: {
            args: [0, 100],
            msg: "Country name must be less than 100 characters",
          },
        },
      },
      viewerCity: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          len: {
            args: [0, 100],
            msg: "City name must be less than 100 characters",
          },
        },
      },
      userAgent: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      device: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          len: {
            args: [0, 100],
            msg: "Device name must be less than 100 characters",
          },
        },
      },
      browser: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          len: {
            args: [0, 100],
            msg: "Browser name must be less than 100 characters",
          },
        },
      },
      referrer: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          len: {
            args: [0, 500],
            msg: "Referrer must be less than 500 characters",
          },
        },
      },
      viewSource: {
        type: DataTypes.ENUM("nfc", "qr", "link", "direct"),
        allowNull: true,
        defaultValue: "direct",
        validate: {
          isIn: {
            args: [["nfc", "qr", "link", "direct"]],
            msg: "View source must be one of: nfc, qr, link, direct",
          },
        },
      },
      viewedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        validate: {
          notNull: {
            msg: "Viewed at timestamp is required",
          },
          isDate: {
            msg: "Viewed at must be a valid date",
          },
        },
      },
    },
    {
      sequelize,
      modelName: "ProfileView",
      tableName: "ProfileViews",
      hooks: {
        beforeCreate: async (profileView) => {
          // Ensure viewedAt is set
          if (!profileView.viewedAt) {
            profileView.viewedAt = new Date();
          }

          // Clean and trim string fields
          if (profileView.viewerCountry) {
            profileView.viewerCountry = profileView.viewerCountry.trim();
          }
          if (profileView.viewerCity) {
            profileView.viewerCity = profileView.viewerCity.trim();
          }
        },
        afterCreate: async (profileView) => {
          console.log(
            `New view tracked for profile ${profileView.profileId} from ${profileView.viewSource}`
          );
        },
      },
      indexes: [
        {
          fields: ["profileId"],
        },
        {
          fields: ["viewedAt"],
        },
        {
          fields: ["viewSource"],
        },
        {
          fields: ["viewerCountry"],
        },
      ],
    }
  );

  return ProfileView;
};
