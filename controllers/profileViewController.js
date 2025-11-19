// controllers/profileViewController.js
const { ProfileView, Profile } = require("../models");
const { Op } = require("sequelize");
const geoip = require("geoip-lite");
const useragent = require("useragent");

// ==================== HELPER FUNCTIONS ====================

// Parse user agent to get device and browser info
const parseUserAgent = (userAgentString) => {
  const agent = useragent.parse(userAgentString);

  return {
    device: agent.device.toString() || "Unknown",
    browser: `${agent.family} ${agent.major || ""}`.trim() || "Unknown",
  };
};

// Get geographic info from IP
const getGeoInfo = (ip) => {
  try {
    // Skip private/local IPs
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

// Get client IP from request
const getClientIP = (req) => {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.headers["x-real-ip"] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.ip
  );
};

// ==================== TRACK PROFILE VIEW (PUBLIC) ====================
exports.trackProfileView = async (req, res) => {
  try {
    const { slug } = req.params;
    const { source = "direct" } = req.body;

    // Find profile
    const profile = await Profile.findOne({
      where: { slug, isActive: true },
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    // Get client info
    const ip = getClientIP(req);
    const userAgent = req.headers["user-agent"] || "";
    const referrer = req.headers.referer || req.headers.referrer || null;

    // Parse user agent
    const { device, browser } = parseUserAgent(userAgent);

    // Get geographic info
    const { country, city } = getGeoInfo(ip);

    // Track view
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

    // Increment profile view count
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

// ==================== GET PROFILE ANALYTICS ====================
exports.getProfileAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const { profileId } = req.params;
    const { startDate, endDate, days = 30 } = req.query;

    // Verify profile ownership
    const profile = await Profile.findOne({
      where: { id: profileId, userId },
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found or you don't have permission",
      });
    }

    // Calculate date range
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate
      ? new Date(startDate)
      : new Date(end.getTime() - parseInt(days) * 24 * 60 * 60 * 1000);

    // Get comprehensive analytics
    const analytics = await ProfileView.getProfileAnalytics(profileId, {
      startDate: start,
      endDate: end,
    });

    // Get views over time
    const viewsOverTime = await ProfileView.getViewsOverTime(
      profileId,
      parseInt(days)
    );

    res.status(200).json({
      success: true,
      data: {
        period: {
          start,
          end,
          days: parseInt(days),
        },
        profileInfo: {
          id: profile.id,
          name: profile.name,
          slug: profile.slug,
          totalViewCount: profile.viewCount,
        },
        analytics,
        viewsOverTime,
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

// ==================== GET RECENT VIEWS ====================
exports.getRecentViews = async (req, res) => {
  try {
    const userId = req.user.id;
    const { profileId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    // Verify profile ownership
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

// ==================== GET VIEWS BY SOURCE ====================
exports.getViewsBySource = async (req, res) => {
  try {
    const userId = req.user.id;
    const { profileId } = req.params;
    const { days = 30 } = req.query;

    // Verify profile ownership
    const profile = await Profile.findOne({
      where: { id: profileId, userId },
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found or you don't have permission",
      });
    }

    // Calculate start date
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

    // Calculate percentages
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

// ==================== GET VIEWS BY LOCATION ====================
exports.getViewsByLocation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { profileId } = req.params;
    const { days = 30, limit = 10 } = req.query;

    // Verify profile ownership
    const profile = await Profile.findOne({
      where: { id: profileId, userId },
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found or you don't have permission",
      });
    }

    // Calculate start date
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Get views by country
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

    // Get views by city
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

// ==================== GET VIEWS BY DEVICE ====================
exports.getViewsByDevice = async (req, res) => {
  try {
    const userId = req.user.id;
    const { profileId } = req.params;
    const { days = 30 } = req.query;

    // Verify profile ownership
    const profile = await Profile.findOne({
      where: { id: profileId, userId },
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found or you don't have permission",
      });
    }

    // Calculate start date
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Get views by device
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

    // Get views by browser
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

// ==================== GET VIEWS OVER TIME ====================
exports.getViewsOverTime = async (req, res) => {
  try {
    const userId = req.user.id;
    const { profileId } = req.params;
    const { days = 30 } = req.query;

    // Verify profile ownership
    const profile = await Profile.findOne({
      where: { id: profileId, userId },
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found or you don't have permission",
      });
    }

    const viewsOverTime = await ProfileView.getViewsOverTime(
      profileId,
      parseInt(days)
    );

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

// ==================== GET ALL USER ANALYTICS ====================
exports.getAllUserAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const { days = 30 } = req.query;

    // Get all user profiles
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

    // Calculate start date
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Get total views in period
    const totalViewsInPeriod = await ProfileView.count({
      where: {
        profileId: profileIds,
        viewedAt: {
          [Op.gte]: startDate,
        },
      },
    });

    // Get views by source across all profiles
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

    // Get analytics for each profile
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

// ==================== DELETE OLD VIEWS (CLEANUP) ====================
exports.deleteOldViews = async (req, res) => {
  try {
    const userId = req.user.id;
    const { profileId } = req.params;
    const { daysToKeep = 90 } = req.body;

    // Verify profile ownership
    const profile = await Profile.findOne({
      where: { id: profileId, userId },
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found or you don't have permission",
      });
    }

    // Calculate cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(daysToKeep));

    // Delete old views
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
