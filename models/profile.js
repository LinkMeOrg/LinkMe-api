"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Profile extends Model {
    static associate(models) {
      // Belongs to User
      Profile.belongsTo(models.User, {
        foreignKey: "userId",
        as: "user",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });

      // Has many SocialLinks
      Profile.hasMany(models.SocialLink, {
        foreignKey: "profileId",
        as: "socialLinks",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });

      // Has many ProfileViews
      Profile.hasMany(models.ProfileView, {
        foreignKey: "profileId",
        as: "views",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });
    }

    // Instance method to increment view count
    async incrementViewCount() {
      this.viewCount += 1;
      await this.save();
      return this.viewCount;
    }

    // Instance method to get analytics summary
    async getAnalytics(models) {
      const totalViews = await models.ProfileView.count({
        where: { profileId: this.id },
      });

      const viewsBySource = await models.ProfileView.findAll({
        where: { profileId: this.id },
        attributes: [
          "viewSource",
          [sequelize.fn("COUNT", sequelize.col("id")), "count"],
        ],
        group: ["viewSource"],
        raw: true,
      });

      const totalClicks = await models.SocialLink.sum("clickCount", {
        where: { profileId: this.id },
      });

      return {
        totalViews,
        viewsBySource,
        totalClicks: totalClicks || 0,
      };
    }

    // Instance method to generate profile URL
    generateProfileUrl() {
      return `https://linkme.io/${this.slug}`;
    }

    // Static method to generate unique slug
    static async generateUniqueSlug(name) {
      let slug = name
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");

      // Check if slug exists
      const existingProfile = await Profile.findOne({ where: { slug } });

      if (existingProfile) {
        // Add random number to make it unique
        const randomNum = Math.floor(Math.random() * 10000);
        slug = `${slug}-${randomNum}`;
      }

      return slug;
    }

    // Instance method to get full profile with links
    async getFullProfile() {
      return await Profile.findByPk(this.id, {
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

    // Virtual field to check if profile is complete
    get isComplete() {
      return !!(this.name && this.title && this.bio && this.avatarUrl);
    }
  }

  Profile.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notNull: {
            msg: "User ID is required",
          },
          notEmpty: {
            msg: "User ID cannot be empty",
          },
        },
      },
      profileType: {
        type: DataTypes.ENUM("personal", "business"),
        allowNull: false,
        defaultValue: "personal",
        validate: {
          isIn: {
            args: [["personal", "business"]],
            msg: "Profile type must be either 'personal' or 'business'",
          },
        },
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: "Name is required",
          },
          notEmpty: {
            msg: "Name cannot be empty",
          },
          len: {
            args: [2, 100],
            msg: "Name must be between 2 and 100 characters",
          },
        },
      },
      title: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          len: {
            args: [0, 150],
            msg: "Title must be less than 150 characters",
          },
        },
      },
      bio: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
          len: {
            args: [0, 500],
            msg: "Bio must be less than 500 characters",
          },
        },
      },
      avatarUrl: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          isUrl: {
            msg: "Avatar URL must be a valid URL",
          },
        },
      },
      color: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "#0066FF",
        validate: {
          is: {
            args: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
            msg: "Color must be a valid hex color code",
          },
        },
      },
      designMode: {
        type: DataTypes.ENUM("manual", "ai"),
        allowNull: false,
        defaultValue: "manual",
        validate: {
          isIn: {
            args: [["manual", "ai"]],
            msg: "Design mode must be either 'manual' or 'ai'",
          },
        },
      },
      aiPrompt: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
          len: {
            args: [0, 500],
            msg: "AI prompt must be less than 500 characters",
          },
        },
      },
      aiBackground: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          isUrl: {
            msg: "AI background must be a valid URL",
          },
        },
      },
      template: {
        type: DataTypes.ENUM("modern", "gradient", "glass", "dark"),
        allowNull: false,
        defaultValue: "modern",
        validate: {
          isIn: {
            args: [["modern", "gradient", "glass", "dark"]],
            msg: "Template must be one of: modern, gradient, glass, dark",
          },
        },
      },
      slug: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: {
          msg: "This profile URL is already taken",
        },
        validate: {
          notNull: {
            msg: "Slug is required",
          },
          notEmpty: {
            msg: "Slug cannot be empty",
          },
          is: {
            args: /^[a-z0-9-]+$/,
            msg: "Slug must contain only lowercase letters, numbers, and hyphens",
          },
        },
      },
      profileUrl: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: "Profile URL is required",
          },
          isUrl: {
            msg: "Profile URL must be a valid URL",
          },
        },
      },
      qrCodeUrl: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          isUrl: {
            msg: "QR code URL must be a valid URL",
          },
        },
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      viewCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
    },
    {
      sequelize,
      modelName: "Profile",
      tableName: "Profiles",
      hooks: {
        beforeValidate: async (profile) => {
          // Auto-generate slug if not provided
          if (!profile.slug && profile.name) {
            profile.slug = await Profile.generateUniqueSlug(profile.name);
          }

          // Auto-generate profile URL if not provided
          if (!profile.profileUrl && profile.slug) {
            profile.profileUrl = `https://linkme.io/${profile.slug}`;
          }
        },
        afterCreate: async (profile) => {
          console.log(`New profile created: ${profile.name} (${profile.slug})`);
        },
      },
      indexes: [
        {
          fields: ["userId"],
        },
        {
          unique: true,
          fields: ["slug"],
        },
        {
          fields: ["profileType"],
        },
      ],
    }
  );

  return Profile;
};
