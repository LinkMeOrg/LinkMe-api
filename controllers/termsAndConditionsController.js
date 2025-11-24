"use strict";
const { TermsAndConditions } = require("../models");
const { ValidationError, DatabaseError } = require("sequelize");

/**
 * Terms and Conditions Controller
 * Handles all operations related to terms and conditions
 */
class TermsAndConditionsController {
  /**
   * Get the active terms and conditions
   * @route GET /api/terms
   * @access Public
   */
  static async getActiveTerms(req, res) {
    try {
      const activeTerms = await TermsAndConditions.getActiveVersion();

      if (!activeTerms) {
        return res.status(404).json({
          success: false,
          message: "No active terms and conditions found",
          data: null,
        });
      }

      return res.status(200).json({
        success: true,
        message: "Active terms and conditions retrieved successfully",
        data: {
          id: activeTerms.id,
          version: activeTerms.version,
          title: activeTerms.title,
          content: activeTerms.content,
          effectiveDate: activeTerms.effectiveDate,
          lastModifiedBy: activeTerms.lastModifiedBy,
          updatedAt: activeTerms.updatedAt,
        },
      });
    } catch (error) {
      console.error("Error fetching active terms:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error while fetching terms and conditions",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  /**
   * Get all terms and conditions versions
   * @route GET /api/terms/versions
   * @access Admin
   */
  static async getAllVersions(req, res) {
    try {
      const allVersions = await TermsAndConditions.getAllVersions();

      return res.status(200).json({
        success: true,
        message: "All terms and conditions versions retrieved successfully",
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
   * @route GET /api/terms/:id
   * @access Public
   */
  static async getVersionById(req, res) {
    try {
      const { id } = req.params;

      const terms = await TermsAndConditions.findByPk(id);

      if (!terms) {
        return res.status(404).json({
          success: false,
          message: `Terms and conditions with ID ${id} not found`,
          data: null,
        });
      }

      return res.status(200).json({
        success: true,
        message: "Terms and conditions retrieved successfully",
        data: terms,
      });
    } catch (error) {
      console.error("Error fetching terms by ID:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error while fetching terms and conditions",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  /**
   * Create a new terms and conditions version
   * @route POST /api/terms
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
        await TermsAndConditions.update({ isActive: false }, { where: {} });
      }

      const newTerms = await TermsAndConditions.create({
        version,
        title: title || "Terms and Conditions",
        content,
        effectiveDate: effectiveDate || new Date(),
        isActive: isActive || false,
        lastModifiedBy,
        changesSummary,
      });

      return res.status(201).json({
        success: true,
        message: "Terms and conditions created successfully",
        data: newTerms,
      });
    } catch (error) {
      console.error("Error creating terms:", error);

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
        message: "Internal server error while creating terms and conditions",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  /**
   * Update an existing terms and conditions version
   * @route PUT /api/terms/:id
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

      const terms = await TermsAndConditions.findByPk(id);

      if (!terms) {
        return res.status(404).json({
          success: false,
          message: `Terms and conditions with ID ${id} not found`,
        });
      }

      // If setting this version as active, deactivate others
      if (isActive && !terms.isActive) {
        await TermsAndConditions.update({ isActive: false }, { where: {} });
      }

      // Update the terms
      await terms.update({
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
        message: "Terms and conditions updated successfully",
        data: terms,
      });
    } catch (error) {
      console.error("Error updating terms:", error);

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
        message: "Internal server error while updating terms and conditions",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  /**
   * Set a specific version as active
   * @route PATCH /api/terms/:id/activate
   * @access Admin
   */
  static async activateVersion(req, res) {
    try {
      const { id } = req.params;

      const terms = await TermsAndConditions.findByPk(id);

      if (!terms) {
        return res.status(404).json({
          success: false,
          message: `Terms and conditions with ID ${id} not found`,
        });
      }

      const activatedTerms = await TermsAndConditions.setActiveVersion(id);

      return res.status(200).json({
        success: true,
        message: "Terms and conditions version activated successfully",
        data: activatedTerms,
      });
    } catch (error) {
      console.error("Error activating terms version:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error while activating terms version",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  /**
   * Delete a terms and conditions version
   * @route DELETE /api/terms/:id
   * @access Admin
   */
  static async deleteVersion(req, res) {
    try {
      const { id } = req.params;

      const terms = await TermsAndConditions.findByPk(id);

      if (!terms) {
        return res.status(404).json({
          success: false,
          message: `Terms and conditions with ID ${id} not found`,
        });
      }

      // Prevent deletion of active version
      if (terms.isActive) {
        return res.status(400).json({
          success: false,
          message:
            "Cannot delete the currently active version. Please activate another version first.",
        });
      }

      await terms.destroy();

      return res.status(200).json({
        success: true,
        message: "Terms and conditions deleted successfully",
        data: null,
      });
    } catch (error) {
      console.error("Error deleting terms:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error while deleting terms and conditions",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
}

module.exports = TermsAndConditionsController;
