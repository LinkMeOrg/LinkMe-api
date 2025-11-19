// controllers/socialLinkController.js
const { SocialLink, Profile } = require("../models");

// ==================== HELPER FUNCTION ====================
const validateProfileOwnership = async (profileId, userId) => {
  const profile = await Profile.findOne({
    where: { id: profileId, userId },
  });

  if (!profile) {
    return null;
  }

  return profile;
};

// ==================== CREATE SOCIAL LINK ====================
exports.createSocialLink = async (req, res) => {
  try {
    const userId = req.user.id;
    const { profileId, platform, url, label, isVisible } = req.body;

    // Validate required fields
    if (!profileId || !platform || !url) {
      return res.status(400).json({
        success: false,
        message: "Profile ID, platform, and URL are required",
      });
    }

    // Verify profile ownership
    const profile = await validateProfileOwnership(profileId, userId);
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found or you don't have permission",
      });
    }

    // Check if link already exists for this platform
    const existingLink = await SocialLink.findOne({
      where: { profileId, platform },
    });

    if (existingLink) {
      return res.status(400).json({
        success: false,
        message: `A ${platform} link already exists for this profile. Please update it instead.`,
      });
    }

    // Get next order number
    const maxOrder = await SocialLink.max("order", {
      where: { profileId },
    });

    // Create social link
    const socialLink = await SocialLink.create({
      profileId,
      platform,
      url: url.trim(),
      label,
      isVisible: isVisible !== false,
      order: (maxOrder || 0) + 1,
      clickCount: 0,
    });

    res.status(201).json({
      success: true,
      message: "Social link added successfully",
      data: socialLink,
    });
  } catch (error) {
    console.error("Error creating social link:", error);
    res.status(500).json({
      success: false,
      message: "Error creating social link",
      error: error.message,
    });
  }
};

// ==================== CREATE MULTIPLE SOCIAL LINKS ====================
exports.createMultipleSocialLinks = async (req, res) => {
  try {
    const userId = req.user.id;
    const { profileId, links } = req.body;

    // Validate required fields
    if (!profileId || !links || !Array.isArray(links)) {
      return res.status(400).json({
        success: false,
        message: "Profile ID and links array are required",
      });
    }

    // Verify profile ownership
    const profile = await validateProfileOwnership(profileId, userId);
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found or you don't have permission",
      });
    }

    // Filter valid links
    const validLinks = links.filter((link) => link.platform && link.url);

    if (validLinks.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid links provided",
      });
    }

    // Check for existing platforms
    const existingPlatforms = await SocialLink.findAll({
      where: {
        profileId,
        platform: validLinks.map((l) => l.platform),
      },
      attributes: ["platform"],
    });

    const existingPlatformNames = existingPlatforms.map((p) => p.platform);
    const newLinks = validLinks.filter(
      (link) => !existingPlatformNames.includes(link.platform)
    );

    if (newLinks.length === 0) {
      return res.status(400).json({
        success: false,
        message: "All provided platforms already exist for this profile",
      });
    }

    // Get starting order number
    const maxOrder = await SocialLink.max("order", {
      where: { profileId },
    });

    // Prepare links for creation
    const linksToCreate = newLinks.map((link, index) => ({
      profileId,
      platform: link.platform,
      url: link.url.trim(),
      label: link.label,
      isVisible: link.isVisible !== false,
      order: (maxOrder || 0) + index + 1,
      clickCount: 0,
    }));

    // Create all links
    const createdLinks = await SocialLink.bulkCreate(linksToCreate);

    res.status(201).json({
      success: true,
      message: `${createdLinks.length} social links added successfully`,
      data: createdLinks,
      skipped: validLinks.length - newLinks.length,
    });
  } catch (error) {
    console.error("Error creating multiple social links:", error);
    res.status(500).json({
      success: false,
      message: "Error creating social links",
      error: error.message,
    });
  }
};

// ==================== GET ALL SOCIAL LINKS FOR PROFILE ====================
exports.getSocialLinks = async (req, res) => {
  try {
    const userId = req.user.id;
    const { profileId } = req.params;
    const { includeHidden } = req.query;

    // Verify profile ownership
    const profile = await validateProfileOwnership(profileId, userId);
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found or you don't have permission",
      });
    }

    const whereClause = { profileId };
    if (!includeHidden || includeHidden === "false") {
      whereClause.isVisible = true;
    }

    const socialLinks = await SocialLink.findAll({
      where: whereClause,
      order: [["order", "ASC"]],
    });

    res.status(200).json({
      success: true,
      count: socialLinks.length,
      data: socialLinks,
    });
  } catch (error) {
    console.error("Error fetching social links:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching social links",
      error: error.message,
    });
  }
};

// ==================== GET SOCIAL LINK BY ID ====================
exports.getSocialLinkById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const socialLink = await SocialLink.findByPk(id, {
      include: [
        {
          model: Profile,
          as: "profile",
          where: { userId },
          attributes: ["id", "name"],
        },
      ],
    });

    if (!socialLink) {
      return res.status(404).json({
        success: false,
        message: "Social link not found or you don't have permission",
      });
    }

    res.status(200).json({
      success: true,
      data: socialLink,
    });
  } catch (error) {
    console.error("Error fetching social link:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching social link",
      error: error.message,
    });
  }
};

// ==================== UPDATE SOCIAL LINK ====================
exports.updateSocialLink = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { url, label, isVisible, order } = req.body;

    const socialLink = await SocialLink.findByPk(id, {
      include: [
        {
          model: Profile,
          as: "profile",
          where: { userId },
          attributes: ["id"],
        },
      ],
    });

    if (!socialLink) {
      return res.status(404).json({
        success: false,
        message: "Social link not found or you don't have permission",
      });
    }

    // Update social link
    await socialLink.update({
      url: url ? url.trim() : socialLink.url,
      label: label !== undefined ? label : socialLink.label,
      isVisible: isVisible !== undefined ? isVisible : socialLink.isVisible,
      order: order !== undefined ? order : socialLink.order,
    });

    res.status(200).json({
      success: true,
      message: "Social link updated successfully",
      data: socialLink,
    });
  } catch (error) {
    console.error("Error updating social link:", error);
    res.status(500).json({
      success: false,
      message: "Error updating social link",
      error: error.message,
    });
  }
};

// ==================== DELETE SOCIAL LINK ====================
exports.deleteSocialLink = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const socialLink = await SocialLink.findByPk(id, {
      include: [
        {
          model: Profile,
          as: "profile",
          where: { userId },
          attributes: ["id"],
        },
      ],
    });

    if (!socialLink) {
      return res.status(404).json({
        success: false,
        message: "Social link not found or you don't have permission",
      });
    }

    await socialLink.destroy();

    res.status(200).json({
      success: true,
      message: "Social link deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting social link:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting social link",
      error: error.message,
    });
  }
};

// ==================== TOGGLE VISIBILITY ====================
exports.toggleVisibility = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const socialLink = await SocialLink.findByPk(id, {
      include: [
        {
          model: Profile,
          as: "profile",
          where: { userId },
          attributes: ["id"],
        },
      ],
    });

    if (!socialLink) {
      return res.status(404).json({
        success: false,
        message: "Social link not found or you don't have permission",
      });
    }

    await socialLink.toggleVisibility();

    res.status(200).json({
      success: true,
      message: `Link ${socialLink.isVisible ? "shown" : "hidden"} successfully`,
      data: { isVisible: socialLink.isVisible },
    });
  } catch (error) {
    console.error("Error toggling visibility:", error);
    res.status(500).json({
      success: false,
      message: "Error toggling visibility",
      error: error.message,
    });
  }
};

// ==================== REORDER SOCIAL LINKS ====================
exports.reorderSocialLinks = async (req, res) => {
  try {
    const userId = req.user.id;
    const { profileId } = req.params;
    const { links } = req.body; // Array of { id, order }

    // Validate input
    if (!links || !Array.isArray(links)) {
      return res.status(400).json({
        success: false,
        message: "Links array is required",
      });
    }

    // Verify profile ownership
    const profile = await validateProfileOwnership(profileId, userId);
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found or you don't have permission",
      });
    }

    // Update order for each link
    const updatePromises = links.map(async (link) => {
      return await SocialLink.update(
        { order: link.order },
        {
          where: {
            id: link.id,
            profileId,
          },
        }
      );
    });

    await Promise.all(updatePromises);

    // Fetch updated links
    const updatedLinks = await SocialLink.findAll({
      where: { profileId },
      order: [["order", "ASC"]],
    });

    res.status(200).json({
      success: true,
      message: "Links reordered successfully",
      data: updatedLinks,
    });
  } catch (error) {
    console.error("Error reordering links:", error);
    res.status(500).json({
      success: false,
      message: "Error reordering links",
      error: error.message,
    });
  }
};

// ==================== INCREMENT CLICK COUNT (PUBLIC) ====================
exports.incrementClickCount = async (req, res) => {
  try {
    const { id } = req.params;

    const socialLink = await SocialLink.findByPk(id, {
      include: [
        {
          model: Profile,
          as: "profile",
          where: { isActive: true },
          attributes: ["id", "slug"],
        },
      ],
    });

    if (!socialLink) {
      return res.status(404).json({
        success: false,
        message: "Social link not found",
      });
    }

    await socialLink.incrementClickCount();

    res.status(200).json({
      success: true,
      message: "Click tracked successfully",
      data: {
        clickCount: socialLink.clickCount,
        redirectUrl: socialLink.getFormattedUrl(),
      },
    });
  } catch (error) {
    console.error("Error tracking click:", error);
    res.status(500).json({
      success: false,
      message: "Error tracking click",
      error: error.message,
    });
  }
};

// ==================== GET LINKS STATISTICS ====================
exports.getLinksStatistics = async (req, res) => {
  try {
    const userId = req.user.id;
    const { profileId } = req.params;

    // Verify profile ownership
    const profile = await validateProfileOwnership(profileId, userId);
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found or you don't have permission",
      });
    }

    const links = await SocialLink.findAll({
      where: { profileId },
      attributes: [
        "id",
        "platform",
        "label",
        "url",
        "clickCount",
        "isVisible",
        "order",
      ],
      order: [["clickCount", "DESC"]],
    });

    const totalClicks = links.reduce((sum, link) => sum + link.clickCount, 0);
    const visibleLinks = links.filter((link) => link.isVisible).length;
    const hiddenLinks = links.filter((link) => !link.isVisible).length;
    const mostClickedLink = links[0] || null;

    res.status(200).json({
      success: true,
      data: {
        totalLinks: links.length,
        visibleLinks,
        hiddenLinks,
        totalClicks,
        mostClickedLink,
        links,
      },
    });
  } catch (error) {
    console.error("Error fetching links statistics:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching links statistics",
      error: error.message,
    });
  }
};

// ==================== BULK DELETE SOCIAL LINKS ====================
exports.bulkDeleteSocialLinks = async (req, res) => {
  try {
    const userId = req.user.id;
    const { profileId } = req.params;
    const { linkIds } = req.body; // Array of link IDs

    // Validate input
    if (!linkIds || !Array.isArray(linkIds) || linkIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Link IDs array is required",
      });
    }

    // Verify profile ownership
    const profile = await validateProfileOwnership(profileId, userId);
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found or you don't have permission",
      });
    }

    // Delete links
    const deletedCount = await SocialLink.destroy({
      where: {
        id: linkIds,
        profileId,
      },
    });

    res.status(200).json({
      success: true,
      message: `${deletedCount} social link(s) deleted successfully`,
      deletedCount,
    });
  } catch (error) {
    console.error("Error bulk deleting links:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting links",
      error: error.message,
    });
  }
};
