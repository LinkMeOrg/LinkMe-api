"use strict";
const { PrivacyPolicy } = require("../models");
const { ValidationError, DatabaseError } = require("sequelize");

/**
 * Privacy Policy Controller
 * Handles all operations related to privacy policies
 */
class PrivacyPolicyController {
  /**
   * Get the active privacy policy
   * @route GET /api/privacy-policy
   * @access Public
   */
  static async getActivePolicy(req, res) {
    try {
      const activePolicy = await PrivacyPolicy.getActiveVersion();

      if (!activePolicy) {
        return res.status(404).json({
          success: false,
          message: "No active privacy policy found",
          data: null,
        });
      }

      return res.status(200).json({
        success: true,
        message: "Active privacy policy retrieved successfully",
        data: {
          id: activePolicy.id,
          version: activePolicy.version,
          title: activePolicy.title,
          content: activePolicy.content,
          effectiveDate: activePolicy.effectiveDate,
          lastModifiedBy: activePolicy.lastModifiedBy,
          updatedAt: activePolicy.updatedAt,
        },
      });
    } catch (error) {
      console.error("Error fetching active policy:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error while fetching privacy policy",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  /**
   * Get all privacy policy versions
   * @route GET /api/privacy-policy/versions
   * @access Admin
   */
  static async getAllVersions(req, res) {
    try {
      const allVersions = await PrivacyPolicy.getAllVersions();

      return res.status(200).json({
        success: true,
        message: "All privacy policy versions retrieved successfully",
        data: allVersions,
        count: allVersions.length,
      });
    } catch (error) {
      console.error("Error fetching all versions:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error while fetching versions",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  /**
   * Get a specific version by ID
   * @route GET /api/privacy-policy/:id
   * @access Public
   */
  static async getVersionById(req, res) {
    try {
      const { id } = req.params;

      const policy = await PrivacyPolicy.findByPk(id);

      if (!policy) {
        return res.status(404).json({
          success: false,
          message: `Privacy policy with ID ${id} not found`,
          data: null,
        });
      }

      return res.status(200).json({
        success: true,
        message: "Privacy policy retrieved successfully",
        data: policy,
      });
    } catch (error) {
      console.error("Error fetching policy by ID:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error while fetching privacy policy",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  /**
   * Create a new privacy policy version
   * @route POST /api/privacy-policy
   * @access Admin
   */
  static async createVersion(req, res) {
    try {
      const {
        version,
        title,
        content,
        effectiveDate,
        lastModifiedBy,
        changesSummary,
        isActive,
      } = req.body;

      // Validate required fields
      if (!version || !content) {
        return res.status(400).json({
          success: false,
          message: "Version and content are required fields",
        });
      }

      // If this version should be active, deactivate others first
      if (isActive) {
        await PrivacyPolicy.update({ isActive: false }, { where: {} });
      }

      const newPolicy = await PrivacyPolicy.create({
        version,
        title: title || "Privacy Policy",
        content,
        effectiveDate: effectiveDate || new Date(),
        isActive: isActive || false,
        lastModifiedBy,
        changesSummary,
      });

      return res.status(201).json({
        success: true,
        message: "Privacy policy created successfully",
        data: newPolicy,
      });
    } catch (error) {
      console.error("Error creating policy:", error);

      if (error instanceof ValidationError) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: error.errors.map((err) => ({
            field: err.path,
            message: err.message,
          })),
        });
      }

      return res.status(500).json({
        success: false,
        message: "Internal server error while creating privacy policy",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  /**
   * Update an existing privacy policy version
   * @route PUT /api/privacy-policy/:id
   * @access Admin
   */
  static async updateVersion(req, res) {
    try {
      const { id } = req.params;
      const {
        version,
        title,
        content,
        effectiveDate,
        lastModifiedBy,
        changesSummary,
        isActive,
      } = req.body;

      const policy = await PrivacyPolicy.findByPk(id);

      if (!policy) {
        return res.status(404).json({
          success: false,
          message: `Privacy policy with ID ${id} not found`,
        });
      }

      // If setting this version as active, deactivate others
      if (isActive && !policy.isActive) {
        await PrivacyPolicy.update({ isActive: false }, { where: {} });
      }

      // Update the policy
      await policy.update({
        ...(version && { version }),
        ...(title && { title }),
        ...(content && { content }),
        ...(effectiveDate && { effectiveDate }),
        ...(lastModifiedBy && { lastModifiedBy }),
        ...(changesSummary !== undefined && { changesSummary }),
        ...(isActive !== undefined && { isActive }),
      });

      return res.status(200).json({
        success: true,
        message: "Privacy policy updated successfully",
        data: policy,
      });
    } catch (error) {
      console.error("Error updating policy:", error);

      if (error instanceof ValidationError) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: error.errors.map((err) => ({
            field: err.path,
            message: err.message,
          })),
        });
      }

      return res.status(500).json({
        success: false,
        message: "Internal server error while updating privacy policy",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  /**
   * Set a specific version as active
   * @route PATCH /api/privacy-policy/:id/activate
   * @access Admin
   */
  static async activateVersion(req, res) {
    try {
      const { id } = req.params;

      const policy = await PrivacyPolicy.findByPk(id);

      if (!policy) {
        return res.status(404).json({
          success: false,
          message: `Privacy policy with ID ${id} not found`,
        });
      }

      const activatedPolicy = await PrivacyPolicy.setActiveVersion(id);

      return res.status(200).json({
        success: true,
        message: "Privacy policy version activated successfully",
        data: activatedPolicy,
      });
    } catch (error) {
      console.error("Error activating policy version:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error while activating policy version",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  /**
   * Delete a privacy policy version
   * @route DELETE /api/privacy-policy/:id
   * @access Admin
   */
  static async deleteVersion(req, res) {
    try {
      const { id } = req.params;

      const policy = await PrivacyPolicy.findByPk(id);

      if (!policy) {
        return res.status(404).json({
          success: false,
          message: `Privacy policy with ID ${id} not found`,
        });
      }

      // Prevent deletion of active version
      if (policy.isActive) {
        return res.status(400).json({
          success: false,
          message:
            "Cannot delete the currently active version. Please activate another version first.",
        });
      }

      await policy.destroy();

      return res.status(200).json({
        success: true,
        message: "Privacy policy deleted successfully",
        data: null,
      });
    } catch (error) {
      console.error("Error deleting policy:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error while deleting privacy policy",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
}

module.exports = PrivacyPolicyController;
