const {
  User,
  Profile,
  SocialLink,
  ProfileView,
  sequelize,
} = require("../models");
const { Op } = require("sequelize");

exports.getDashboardStats = async (req, res) => {
  try {
    // Total Users
    const totalUsers = await User.count();

    // Users registered today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const usersToday = await User.count({
      where: {
        createdAt: {
          [Op.gte]: today,
        },
      },
    });

    // Users growth percentage (compared to last month)
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const usersLastMonth = await User.count({
      where: {
        createdAt: {
          [Op.lt]: today,
          [Op.gte]: lastMonth,
        },
      },
    });
    const usersThisMonth = await User.count({
      where: {
        createdAt: {
          [Op.gte]: lastMonth,
        },
      },
    });
    const userGrowth =
      usersLastMonth > 0
        ? (((usersThisMonth - usersLastMonth) / usersLastMonth) * 100).toFixed(
            1
          )
        : 0;

    // Total Profiles
    const totalProfiles = await Profile.count();
    const profilesToday = await Profile.count({
      where: {
        createdAt: {
          [Op.gte]: today,
        },
      },
    });

    // Total Views
    const totalViews = await Profile.sum("viewCount");
    const viewsToday = await ProfileView.count({
      where: {
        viewedAt: {
          [Op.gte]: today,
        },
      },
    });

    // Total Clicks
    const totalClicks = await SocialLink.sum("clickCount");

    // Active Profiles
    const activeProfiles = await Profile.count({
      where: {
        isActive: true,
      },
    });

    // Profile Type Distribution
    const profilesByType = await Profile.findAll({
      attributes: [
        "profileType",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      group: ["profileType"],
      raw: true,
    });

    // Views Over Time (Last 7 days)
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);

    const viewsOverTime = await ProfileView.findAll({
      where: {
        viewedAt: {
          [Op.gte]: last7Days,
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

    // User Registration Over Time (Last 7 days)
    const usersOverTime = await User.findAll({
      where: {
        createdAt: {
          [Op.gte]: last7Days,
        },
      },
      attributes: [
        [sequelize.fn("DATE", sequelize.col("createdAt")), "date"],
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      group: [sequelize.fn("DATE", sequelize.col("createdAt"))],
      order: [[sequelize.fn("DATE", sequelize.col("createdAt")), "ASC"]],
      raw: true,
    });

    // Profile Creation Over Time (Last 7 days)
    const profilesOverTime = await Profile.findAll({
      where: {
        createdAt: {
          [Op.gte]: last7Days,
        },
      },
      attributes: [
        [sequelize.fn("DATE", sequelize.col("createdAt")), "date"],
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      group: [sequelize.fn("DATE", sequelize.col("createdAt"))],
      order: [[sequelize.fn("DATE", sequelize.col("createdAt")), "ASC"]],
      raw: true,
    });

    // Views by Source
    const viewsBySource = await ProfileView.findAll({
      where: {
        viewedAt: {
          [Op.gte]: last7Days,
        },
      },
      attributes: [
        "viewSource",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      group: ["viewSource"],
      raw: true,
    });

    // Top Profiles
    const topProfiles = await Profile.findAll({
      order: [["viewCount", "DESC"]],
      limit: 5,
      attributes: ["id", "name", "viewCount", "profileType"],
    });

    // Recent Users
    const recentUsers = await User.findAll({
      order: [["createdAt", "DESC"]],
      limit: 5,
      attributes: ["id", "firstName", "lastName", "email", "createdAt"],
    });

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalUsers: {
            value: totalUsers,
            today: usersToday,
            growth: userGrowth,
          },
          totalProfiles: {
            value: totalProfiles,
            today: profilesToday,
          },
          totalViews: {
            value: totalViews || 0,
            today: viewsToday,
          },
          totalClicks: {
            value: totalClicks || 0,
          },
          activeProfiles: {
            value: activeProfiles,
          },
        },
        charts: {
          profilesByType,
          viewsOverTime,
          usersOverTime,
          profilesOverTime,
          viewsBySource,
        },
        topProfiles,
        recentUsers,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard statistics",
      error: error.message,
    });
  }
};

exports.getAllProfilesForAdmin = async (req, res) => {
  try {
    // Ensure only admin can access
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admins only.",
      });
    }

    const profiles = await Profile.findAll({
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "firstName", "lastName", "email", "role"],
        },
        {
          model: SocialLink,
          as: "socialLinks",
          order: [["order", "ASC"]],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      success: true,
      count: profiles.length,
      data: profiles,
    });
  } catch (error) {
    console.error("Error fetching all profiles:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching profiles",
      error: error.message,
    });
  }
};

exports.getRecentActivity = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    // Recent profile views
    const recentViews = await ProfileView.findAll({
      order: [["viewedAt", "DESC"]],
      limit,
      include: [
        {
          model: Profile,
          attributes: ["name", "slug"],
        },
      ],
      attributes: [
        "id",
        "viewedAt",
        "viewerCountry",
        "viewerCity",
        "viewSource",
        "device",
      ],
    });

    // Recent user registrations
    const recentUsers = await User.findAll({
      order: [["createdAt", "DESC"]],
      limit,
      attributes: ["id", "firstName", "lastName", "email", "createdAt"],
    });

    // Recent profile creations
    const recentProfiles = await Profile.findAll({
      order: [["createdAt", "DESC"]],
      limit,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["firstName", "lastName", "email"],
        },
      ],
      attributes: ["id", "name", "profileType", "createdAt"],
    });

    res.status(200).json({
      success: true,
      data: {
        recentViews,
        recentUsers,
        recentProfiles,
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
