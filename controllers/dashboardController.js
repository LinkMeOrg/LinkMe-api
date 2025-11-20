const { Profile, SocialLink, User, sequelize } = require("../models");
const { Op } = require("sequelize");

exports.getDashboardSummary = async (req, res) => {
  try {
    const userId = req.user.id;

    const profiles = await Profile.findAll({
      where: { userId },
      attributes: [
        "id",
        "name",
        "profileType",
        "viewCount",
        "isActive",
        "createdAt",
      ],
      order: [["viewCount", "DESC"]],
    });

    const totalViews = profiles.reduce(
      (sum, profile) => sum + (profile.viewCount || 0),
      0
    );

    const profileIds = profiles.map((p) => p.id);

    let totalClicks = 0;
    if (profileIds.length > 0) {
      const clicksResult = await SocialLink.sum("clickCount", {
        where: {
          profileId: {
            [Op.in]: profileIds,
          },
        },
      });
      totalClicks = clicksResult || 0;
    }

    const activeProfiles = profiles.filter((p) => p.isActive).length;

    const profilesData = profiles.map((profile) => ({
      id: profile.id,
      name: profile.name,
      type: profile.profileType,
      views: profile.viewCount || 0,
    }));

    res.status(200).json({
      success: true,
      data: {
        totalProfiles: profiles.length,
        totalViews: totalViews,
        totalClicks: totalClicks,
        activeProfiles: activeProfiles,
        profiles: profilesData,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard summary:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard summary",
      error: error.message,
    });
  }
};

exports.getProfileAnalytics = async (req, res) => {
  try {
    const { profileId } = req.params;
    const userId = req.user.id;

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

    const analytics = await profile.getAnalytics(sequelize.models);

    res.status(200).json({
      success: true,
      data: {
        profile: {
          id: profile.id,
          name: profile.name,
          type: profile.profileType,
        },
        analytics: analytics,
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

exports.getRecentActivity = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;

    const recentUpdates = await Profile.findAll({
      where: { userId },
      order: [["updatedAt", "DESC"]],
      limit: limit,
      attributes: [
        "id",
        "name",
        "profileType",
        "updatedAt",
        "viewCount",
        "isActive",
      ],
    });

    res.status(200).json({
      success: true,
      data: {
        recentUpdates: recentUpdates || [],
      },
    });
  } catch (error) {
    console.error("Error fetching recent activity:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch recent activity",
      error: error.message,
    });
  }
};
