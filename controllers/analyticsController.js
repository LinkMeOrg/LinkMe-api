const { Profile, SocialLink, ProfileView, sequelize } = require("../models");
const { Op } = require("sequelize");

exports.getProfileAnalytics = async (req, res) => {
  try {
    const { profileId } = req.params;
    const userId = req.user.id;
    const days = parseInt(req.query.days) || 30;

    const profile = await Profile.findOne({
      where: {
        id: profileId,
        userId: userId,
      },
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const totalViews = await ProfileView.count({
      where: {
        profileId: profileId,
        viewedAt: {
          [Op.gte]: startDate,
        },
      },
    });

    const viewsBySource = await ProfileView.findAll({
      where: {
        profileId: profileId,
        viewedAt: {
          [Op.gte]: startDate,
        },
      },
      attributes: [
        "viewSource",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      group: ["viewSource"],
      raw: true,
    });

    const viewsByDevice = await ProfileView.findAll({
      where: {
        profileId: profileId,
        viewedAt: {
          [Op.gte]: startDate,
        },
      },
      attributes: [
        "device",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      group: ["device"],
      raw: true,
    });

    const viewsByCountry = await ProfileView.findAll({
      where: {
        profileId: profileId,
        viewedAt: {
          [Op.gte]: startDate,
        },
      },
      attributes: [
        "viewerCountry",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      group: ["viewerCountry"],
      order: [[sequelize.literal("count"), "DESC"]],
      raw: true,
    });

    const viewsByCity = await ProfileView.findAll({
      where: {
        profileId: profileId,
        viewedAt: {
          [Op.gte]: startDate,
        },
      },
      attributes: [
        "viewerCity",
        "viewerCountry",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      group: ["viewerCity", "viewerCountry"],
      order: [[sequelize.literal("count"), "DESC"]],
      limit: 10,
      raw: true,
    });

    const recentViews = await ProfileView.findAll({
      where: {
        profileId: profileId,
      },
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
      where: {
        profileId: profileId,
      },
      attributes: ["id", "platform", "url", "clickCount", "label"],
      order: [["clickCount", "DESC"]],
    });

    const totalClicks = socialLinks.reduce(
      (sum, link) => sum + (link.clickCount || 0),
      0
    );

    const viewsByDate = await ProfileView.findAll({
      where: {
        profileId: profileId,
        viewedAt: {
          [Op.gte]: startDate,
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

    res.status(200).json({
      success: true,
      data: {
        profile: {
          id: profile.id,
          name: profile.name,
          type: profile.profileType,
        },
        period: {
          days: days,
          startDate: startDate,
          endDate: new Date(),
        },
        analytics: {
          totalViews: totalViews,
          totalClicks: totalClicks,
          viewsBySource: viewsBySource,
          viewsByDevice: viewsByDevice,
          viewsByCountry: viewsByCountry,
          viewsByCity: viewsByCity,
          viewsByDate: viewsByDate,
          recentViews: recentViews,
        },
        socialLinks: socialLinks,
      },
    });
  } catch (error) {
    console.error("Error fetching profile analytics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch profile analytics",
      error: error.message,
    });
  }
};

exports.getAllAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const days = parseInt(req.query.days) || 30;

    const profiles = await Profile.findAll({
      where: { userId },
      attributes: ["id", "name", "profileType", "viewCount"],
    });

    const profileIds = profiles.map((p) => p.id);

    if (profileIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          totalViews: 0,
          totalClicks: 0,
          profilesCount: 0,
          profiles: [],
        },
      });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const totalViews = await ProfileView.count({
      where: {
        profileId: {
          [Op.in]: profileIds,
        },
        viewedAt: {
          [Op.gte]: startDate,
        },
      },
    });

    const totalClicks = await SocialLink.sum("clickCount", {
      where: {
        profileId: {
          [Op.in]: profileIds,
        },
      },
    });

    const profileAnalytics = await Promise.all(
      profiles.map(async (profile) => {
        const views = await ProfileView.count({
          where: {
            profileId: profile.id,
            viewedAt: {
              [Op.gte]: startDate,
            },
          },
        });

        const clicks = await SocialLink.sum("clickCount", {
          where: {
            profileId: profile.id,
          },
        });

        return {
          id: profile.id,
          name: profile.name,
          type: profile.profileType,
          views: views,
          clicks: clicks || 0,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        period: {
          days: days,
          startDate: startDate,
          endDate: new Date(),
        },
        totalViews: totalViews,
        totalClicks: totalClicks || 0,
        profilesCount: profiles.length,
        profiles: profileAnalytics,
      },
    });
  } catch (error) {
    console.error("Error fetching all analytics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch analytics",
      error: error.message,
    });
  }
};

exports.trackView = async (req, res) => {
  try {
    const { profileId } = req.params;
    const { viewSource = "direct", device, browser, referrer } = req.body;

    const profile = await Profile.findByPk(profileId);

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    const viewerIp = req.ip || req.connection.remoteAddress;

    const profileView = await ProfileView.create({
      profileId: profileId,
      viewerIp: viewerIp,
      viewSource: viewSource,
      device: device,
      browser: browser,
      referrer: referrer,
      viewedAt: new Date(),
    });

    profile.viewCount += 1;
    await profile.save();

    res.status(201).json({
      success: true,
      message: "View tracked successfully",
      data: {
        viewId: profileView.id,
        totalViews: profile.viewCount,
      },
    });
  } catch (error) {
    console.error("Error tracking view:", error);
    res.status(500).json({
      success: false,
      message: "Failed to track view",
      error: error.message,
    });
  }
};

exports.trackClick = async (req, res) => {
  try {
    const { socialLinkId } = req.params;

    const socialLink = await SocialLink.findByPk(socialLinkId);

    if (!socialLink) {
      return res.status(404).json({
        success: false,
        message: "Social link not found",
      });
    }

    socialLink.clickCount += 1;
    await socialLink.save();

    res.status(200).json({
      success: true,
      message: "Click tracked successfully",
      data: {
        linkId: socialLink.id,
        platform: socialLink.platform,
        totalClicks: socialLink.clickCount,
      },
    });
  } catch (error) {
    console.error("Error tracking click:", error);
    res.status(500).json({
      success: false,
      message: "Failed to track click",
      error: error.message,
    });
  }
};
