const { ProfileView, Profile, SocialLink } = require("../models");
const { Op } = require("sequelize");
const geoip = require("geoip-lite");
const useragent = require("useragent");

const parseUserAgent = (userAgentString) => {
  const agent = useragent.parse(userAgentString);

  return {
    device: agent.device.toString() || "Unknown",
    browser: `${agent.family} ${agent.major || ""}`.trim() || "Unknown",
  };
};

const getGeoInfo = (ip) => {
  try {
    if (
      !ip ||
      ip === "::1" ||
      ip === "127.0.0.1" ||
      ip.startsWith("192.168.") ||
      ip.startsWith("10.") ||
      ip.startsWith("172.")
    ) {
      return { country: null, city: null };
    }

    const geo = geoip.lookup(ip);
    if (!geo) {
      return { country: null, city: null };
    }

    return {
      country: geo.country || null,
      city: geo.city || null,
    };
  } catch (error) {
    console.error("Error getting geo info:", error);
    return { country: null, city: null };
  }
};

const getClientIP = (req) => {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.headers["x-real-ip"] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.ip
  );
};

exports.trackProfileView = async (req, res) => {
  try {
    const { slug } = req.params;
    const { source = "direct" } = req.body;

    const profile = await Profile.findOne({
      where: { slug, isActive: true },
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    const ip = getClientIP(req);
    const userAgent = req.headers["user-agent"] || "";
    const referrer = req.headers.referer || req.headers.referrer || null;

    const { device, browser } = parseUserAgent(userAgent);
    const { country, city } = getGeoInfo(ip);

    const view = await ProfileView.create({
      profileId: profile.id,
      viewerIp: ip,
      viewerCountry: country,
      viewerCity: city,
      userAgent,
      device,
      browser,
      referrer,
      viewSource: source,
      viewedAt: new Date(),
    });

    await profile.increment("viewCount");

    res.status(201).json({
      success: true,
      message: "View tracked successfully",
      data: {
        viewId: view.id,
        profileId: profile.id,
        viewCount: profile.viewCount + 1,
      },
    });
  } catch (error) {
    console.error("Error tracking view:", error);
    res.status(500).json({
      success: false,
      message: "Error tracking view",
      error: error.message,
    });
  }
};

exports.getProfileAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const { profileId } = req.params;
    const { days = 30 } = req.query;

    const profile = await Profile.findOne({
      where: { id: profileId, userId },
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found or you don't have permission",
      });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const totalViews = await ProfileView.count({
      where: {
        profileId,
        viewedAt: {
          [Op.gte]: startDate,
        },
      },
    });

    const viewsBySource = await ProfileView.findAll({
      where: {
        profileId,
        viewedAt: {
          [Op.gte]: startDate,
        },
      },
      attributes: [
        "viewSource",
        [
          ProfileView.sequelize.fn("COUNT", ProfileView.sequelize.col("id")),
          "count",
        ],
      ],
      group: ["viewSource"],
      raw: true,
    });

    const viewsByDevice = await ProfileView.findAll({
      where: {
        profileId,
        viewedAt: {
          [Op.gte]: startDate,
        },
        device: {
          [Op.ne]: null,
        },
      },
      attributes: [
        "device",
        [
          ProfileView.sequelize.fn("COUNT", ProfileView.sequelize.col("id")),
          "count",
        ],
      ],
      group: ["device"],
      raw: true,
    });

    const viewsByCountry = await ProfileView.findAll({
      where: {
        profileId,
        viewedAt: {
          [Op.gte]: startDate,
        },
        viewerCountry: {
          [Op.ne]: null,
        },
      },
      attributes: [
        "viewerCountry",
        [
          ProfileView.sequelize.fn("COUNT", ProfileView.sequelize.col("id")),
          "count",
        ],
      ],
      group: ["viewerCountry"],
      order: [[ProfileView.sequelize.literal("count"), "DESC"]],
      raw: true,
    });

    const recentViews = await ProfileView.findAll({
      where: { profileId },
      order: [["viewedAt", "DESC"]],
      limit: 20,
      attributes: [
        "device",
        "viewSource",
        "viewerCity",
        "viewerCountry",
        "viewedAt",
        "browser",
        "referrer",
      ],
    });

    const socialLinks = await SocialLink.findAll({
      where: { profileId },
      attributes: ["id", "platform", "url", "clickCount", "label"],
      order: [["clickCount", "DESC"]],
    });

    res.status(200).json({
      success: true,
      data: {
        analytics: {
          totalViews: totalViews,
          viewsBySource: viewsBySource,
          viewsByDevice: viewsByDevice,
          viewsByCountry: viewsByCountry,
          recentViews: recentViews,
        },
        socialLinks: socialLinks,
      },
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching analytics",
      error: error.message,
    });
  }
};

exports.getRecentViews = async (req, res) => {
  try {
    const userId = req.user.id;
    const { profileId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const profile = await Profile.findOne({
      where: { id: profileId, userId },
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found or you don't have permission",
      });
    }

    const { count, rows: views } = await ProfileView.findAndCountAll({
      where: { profileId },
      order: [["viewedAt", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      attributes: [
        "id",
        "viewedAt",
        "viewerCountry",
        "viewerCity",
        "device",
        "browser",
        "viewSource",
        "referrer",
      ],
    });

    res.status(200).json({
      success: true,
      data: {
        total: count,
        limit: parseInt(limit),
        offset: parseInt(offset),
        views,
      },
    });
  } catch (error) {
    console.error("Error fetching recent views:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching recent views",
      error: error.message,
    });
  }
};

exports.getViewsBySource = async (req, res) => {
  try {
    const userId = req.user.id;
    const { profileId } = req.params;
    const { days = 30 } = req.query;

    const profile = await Profile.findOne({
      where: { id: profileId, userId },
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found or you don't have permission",
      });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const viewsBySource = await ProfileView.findAll({
      where: {
        profileId,
        viewedAt: {
          [Op.gte]: startDate,
        },
      },
      attributes: [
        "viewSource",
        [
          ProfileView.sequelize.fn("COUNT", ProfileView.sequelize.col("id")),
          "count",
        ],
      ],
      group: ["viewSource"],
      raw: true,
    });

    const total = viewsBySource.reduce(
      (sum, item) => sum + parseInt(item.count),
      0
    );
    const data = viewsBySource.map((item) => ({
      source: item.viewSource,
      count: parseInt(item.count),
      percentage:
        total > 0 ? ((parseInt(item.count) / total) * 100).toFixed(2) : 0,
    }));

    res.status(200).json({
      success: true,
      data: {
        total,
        breakdown: data,
      },
    });
  } catch (error) {
    console.error("Error fetching views by source:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching views by source",
      error: error.message,
    });
  }
};

exports.getViewsByLocation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { profileId } = req.params;
    const { days = 30, limit = 10 } = req.query;

    const profile = await Profile.findOne({
      where: { id: profileId, userId },
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found or you don't have permission",
      });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const viewsByCountry = await ProfileView.findAll({
      where: {
        profileId,
        viewedAt: {
          [Op.gte]: startDate,
        },
        viewerCountry: {
          [Op.ne]: null,
        },
      },
      attributes: [
        "viewerCountry",
        [
          ProfileView.sequelize.fn("COUNT", ProfileView.sequelize.col("id")),
          "count",
        ],
      ],
      group: ["viewerCountry"],
      order: [
        [
          ProfileView.sequelize.fn("COUNT", ProfileView.sequelize.col("id")),
          "DESC",
        ],
      ],
      limit: parseInt(limit),
      raw: true,
    });

    const viewsByCity = await ProfileView.findAll({
      where: {
        profileId,
        viewedAt: {
          [Op.gte]: startDate,
        },
        viewerCity: {
          [Op.ne]: null,
        },
      },
      attributes: [
        "viewerCity",
        "viewerCountry",
        [
          ProfileView.sequelize.fn("COUNT", ProfileView.sequelize.col("id")),
          "count",
        ],
      ],
      group: ["viewerCity", "viewerCountry"],
      order: [
        [
          ProfileView.sequelize.fn("COUNT", ProfileView.sequelize.col("id")),
          "DESC",
        ],
      ],
      limit: parseInt(limit),
      raw: true,
    });

    res.status(200).json({
      success: true,
      data: {
        countries: viewsByCountry.map((item) => ({
          country: item.viewerCountry,
          count: parseInt(item.count),
        })),
        cities: viewsByCity.map((item) => ({
          city: item.viewerCity,
          country: item.viewerCountry,
          count: parseInt(item.count),
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching views by location:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching views by location",
      error: error.message,
    });
  }
};

exports.getViewsByDevice = async (req, res) => {
  try {
    const userId = req.user.id;
    const { profileId } = req.params;
    const { days = 30 } = req.query;

    const profile = await Profile.findOne({
      where: { id: profileId, userId },
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found or you don't have permission",
      });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const viewsByDevice = await ProfileView.findAll({
      where: {
        profileId,
        viewedAt: {
          [Op.gte]: startDate,
        },
        device: {
          [Op.ne]: null,
        },
      },
      attributes: [
        "device",
        [
          ProfileView.sequelize.fn("COUNT", ProfileView.sequelize.col("id")),
          "count",
        ],
      ],
      group: ["device"],
      order: [
        [
          ProfileView.sequelize.fn("COUNT", ProfileView.sequelize.col("id")),
          "DESC",
        ],
      ],
      raw: true,
    });

    const viewsByBrowser = await ProfileView.findAll({
      where: {
        profileId,
        viewedAt: {
          [Op.gte]: startDate,
        },
        browser: {
          [Op.ne]: null,
        },
      },
      attributes: [
        "browser",
        [
          ProfileView.sequelize.fn("COUNT", ProfileView.sequelize.col("id")),
          "count",
        ],
      ],
      group: ["browser"],
      order: [
        [
          ProfileView.sequelize.fn("COUNT", ProfileView.sequelize.col("id")),
          "DESC",
        ],
      ],
      limit: 10,
      raw: true,
    });

    const totalViews = viewsByDevice.reduce(
      (sum, item) => sum + parseInt(item.count),
      0
    );

    res.status(200).json({
      success: true,
      data: {
        totalViews,
        devices: viewsByDevice.map((item) => ({
          device: item.device,
          count: parseInt(item.count),
          percentage:
            totalViews > 0
              ? ((parseInt(item.count) / totalViews) * 100).toFixed(2)
              : 0,
        })),
        browsers: viewsByBrowser.map((item) => ({
          browser: item.browser,
          count: parseInt(item.count),
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching views by device:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching views by device",
      error: error.message,
    });
  }
};

exports.getViewsOverTime = async (req, res) => {
  try {
    const userId = req.user.id;
    const { profileId } = req.params;
    const { days = 30 } = req.query;

    const profile = await Profile.findOne({
      where: { id: profileId, userId },
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found or you don't have permission",
      });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const viewsOverTime = await ProfileView.findAll({
      where: {
        profileId,
        viewedAt: {
          [Op.gte]: startDate,
        },
      },
      attributes: [
        [
          ProfileView.sequelize.fn(
            "DATE",
            ProfileView.sequelize.col("viewedAt")
          ),
          "date",
        ],
        [
          ProfileView.sequelize.fn("COUNT", ProfileView.sequelize.col("id")),
          "count",
        ],
      ],
      group: [
        ProfileView.sequelize.fn("DATE", ProfileView.sequelize.col("viewedAt")),
      ],
      order: [
        [
          ProfileView.sequelize.fn(
            "DATE",
            ProfileView.sequelize.col("viewedAt")
          ),
          "ASC",
        ],
      ],
      raw: true,
    });

    res.status(200).json({
      success: true,
      data: {
        period: parseInt(days),
        views: viewsOverTime,
      },
    });
  } catch (error) {
    console.error("Error fetching views over time:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching views over time",
      error: error.message,
    });
  }
};

exports.getAllUserAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const { days = 30 } = req.query;

    const profiles = await Profile.findAll({
      where: { userId },
      attributes: ["id", "name", "slug", "profileType", "viewCount"],
    });

    if (profiles.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          totalProfiles: 0,
          totalViews: 0,
          profiles: [],
        },
      });
    }

    const profileIds = profiles.map((p) => p.id);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const totalViewsInPeriod = await ProfileView.count({
      where: {
        profileId: profileIds,
        viewedAt: {
          [Op.gte]: startDate,
        },
      },
    });

    const viewsBySource = await ProfileView.findAll({
      where: {
        profileId: profileIds,
        viewedAt: {
          [Op.gte]: startDate,
        },
      },
      attributes: [
        "viewSource",
        [
          ProfileView.sequelize.fn("COUNT", ProfileView.sequelize.col("id")),
          "count",
        ],
      ],
      group: ["viewSource"],
      raw: true,
    });

    const profileAnalytics = await Promise.all(
      profiles.map(async (profile) => {
        const viewsInPeriod = await ProfileView.count({
          where: {
            profileId: profile.id,
            viewedAt: {
              [Op.gte]: startDate,
            },
          },
        });

        return {
          id: profile.id,
          name: profile.name,
          slug: profile.slug,
          type: profile.profileType,
          totalViews: profile.viewCount,
          viewsInPeriod,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        period: parseInt(days),
        totalProfiles: profiles.length,
        totalViews: profiles.reduce((sum, p) => sum + p.viewCount, 0),
        totalViewsInPeriod,
        viewsBySource: viewsBySource.map((item) => ({
          source: item.viewSource,
          count: parseInt(item.count),
        })),
        profiles: profileAnalytics,
      },
    });
  } catch (error) {
    console.error("Error fetching user analytics:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching user analytics",
      error: error.message,
    });
  }
};

exports.deleteOldViews = async (req, res) => {
  try {
    const userId = req.user.id;
    const { profileId } = req.params;
    const { daysToKeep = 90 } = req.body;

    const profile = await Profile.findOne({
      where: { id: profileId, userId },
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found or you don't have permission",
      });
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(daysToKeep));

    const deletedCount = await ProfileView.destroy({
      where: {
        profileId,
        viewedAt: {
          [Op.lt]: cutoffDate,
        },
      },
    });

    res.status(200).json({
      success: true,
      message: `Deleted ${deletedCount} views older than ${daysToKeep} days`,
      deletedCount,
    });
  } catch (error) {
    console.error("Error deleting old views:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting old views",
      error: error.message,
    });
  }
};
