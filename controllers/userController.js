const { User, Profile } = require("../models");
const { Op } = require("sequelize");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { sendOtpEmail } = require("../utils/email");

// ============= EXISTING FUNCTIONS (UNCHANGED) =============

const getUserData = async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    const user = await User.findByPk(userId, {
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const updateUserData = async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    const { firstName, secondName, lastName, phoneNumber, dateOfBirth, email } =
      req.body;

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ Prevent email changes through this endpoint
    if (email && email !== user.email) {
      return res.status(400).json({
        message:
          "Email cannot be changed directly. Please use the 'Change Email' feature.",
      });
    }

    const [updated] = await User.update(
      { firstName, secondName, lastName, phoneNumber, dateOfBirth },
      {
        where: { id: userId },
      }
    );

    if (!updated) {
      return res.status(404).json({ message: "User not found" });
    }

    const updatedUser = await User.findByPk(userId, {
      attributes: { exclude: ["password"] },
    });

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ✅ NEW: Request email change with OTP
const requestEmailChange = async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    const { newEmail, password } = req.body;

    if (!newEmail || !password) {
      return res.status(400).json({
        message: "New email and current password are required",
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return res.status(400).json({
        message: "Invalid email format",
      });
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify current password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({
        message: "Current password is incorrect",
      });
    }

    // Check if new email is same as current
    if (newEmail.toLowerCase().trim() === user.email.toLowerCase()) {
      return res.status(400).json({
        message: "New email is same as current email",
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({
      where: { email: newEmail.toLowerCase().trim() },
    });

    if (existingUser) {
      return res.status(400).json({
        message: "This email is already registered to another account",
      });
    }

    // Generate OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP and pending email
    await user.update({
      otp,
      otpExpires,
      pendingEmail: newEmail.toLowerCase().trim(),
    });

    // Send OTP to NEW email using the utility function
    try {
      await sendOtpEmail(newEmail, otp, user.firstName);
      console.log("✅ OTP email sent successfully to:", newEmail);
    } catch (error) {
      console.error("❌ Error sending OTP email:", error);
      return res.status(500).json({
        message: "Failed to send OTP email. Please try again.",
        error: error.message,
      });
    }

    res.status(200).json({
      message: `OTP sent to ${newEmail}. Please check your email.`,
      expiresIn: "10 minutes",
    });
  } catch (error) {
    console.error("Error requesting email change:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// ✅ NEW: Verify OTP and update email
const verifyEmailChange = async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({ message: "OTP is required" });
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if OTP exists and hasn't expired
    if (!user.otp || !user.otpExpires) {
      return res.status(400).json({
        message: "No pending email change request. Please request again.",
      });
    }

    if (new Date() > user.otpExpires) {
      return res.status(400).json({
        message: "OTP has expired. Please request a new one.",
      });
    }

    if (user.otp.trim() !== otp.trim()) {
      return res.status(400).json({
        message: "Invalid OTP. Please try again.",
      });
    }

    if (!user.pendingEmail) {
      return res.status(400).json({
        message: "No pending email found.",
      });
    }

    // Update email
    await user.update({
      email: user.pendingEmail,
      otp: null,
      otpExpires: null,
      pendingEmail: null,
    });

    const updatedUser = await User.findByPk(userId, {
      attributes: { exclude: ["password"] },
    });

    res.status(200).json({
      message: "Email updated successfully!",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error verifying email change:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// ✅ NEW: Cancel email change request
const cancelEmailChange = async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await user.update({
      otp: null,
      otpExpires: null,
      pendingEmail: null,
    });

    res.status(200).json({
      message: "Email change request cancelled",
    });
  } catch (error) {
    console.error("Error cancelling email change:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getAllUsersData = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ["password"] },
    });

    if (!users.length) {
      return res.status(404).json({ message: "No users found" });
    }

    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const changeUserPassword = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "New passwords do not match" });
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ============= NEW ADMIN FUNCTIONS =============

const getAllUsersDataAdmin = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      role = "",
      verified = "",
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {};

    // Search filter
    if (search) {
      whereClause[Op.or] = [
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { phoneNumber: { [Op.like]: `%${search}%` } },
      ];
    }

    // Role filter
    if (role) {
      whereClause.role = role;
    }

    // Verification filter
    if (verified !== "") {
      const v = verified.trim().toLowerCase();
      if (v === "true") whereClause.isVerified = true;
      else if (v === "false") whereClause.isVerified = false;
    }

    console.log("WHERE CLAUSE:", whereClause);

    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      attributes: { exclude: ["password"] },
      include: [
        {
          model: Profile,
          as: "profiles",
          attributes: ["id", "name", "profileType"],
        },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: { exclude: ["password"] },
      include: [
        {
          model: Profile,
          as: "profiles",
          attributes: [
            "id",
            "name",
            "profileType",
            "viewCount",
            "isActive",
            "createdAt",
          ],
        },
      ],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const createUser = async (req, res) => {
  try {
    const {
      firstName,
      secondName,
      lastName,
      email,
      phoneNumber,
      password,
      role = "user",
      isVerified = false,
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // Create new user
    const user = await User.create({
      firstName,
      secondName,
      lastName,
      email,
      phoneNumber,
      password,
      role,
      isVerified,
    });

    const userResponse = user.toJSON();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: userResponse,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const updateUserAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      firstName,
      secondName,
      lastName,
      email,
      phoneNumber,
      dateOfBirth,
      role,
      isVerified,
    } = req.body;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if email is being changed and if it already exists
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Email already in use",
        });
      }
    }

    await user.update({
      firstName,
      secondName,
      lastName,
      email,
      phoneNumber,
      dateOfBirth,
      role,
      isVerified,
    });

    const updatedUser = await User.findByPk(id, {
      attributes: { exclude: ["password"] },
    });

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Delete all user's profiles first (cascade delete)
    await Profile.destroy({ where: { userId: id } });

    // Delete user
    await user.destroy();

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Toggle isVerified status
    await user.update({
      isVerified: !user.isVerified,
    });

    res.status(200).json({
      success: true,
      message: `User ${
        user.isVerified ? "activated" : "deactivated"
      } successfully`,
      data: {
        id: user.id,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: "New password is required",
      });
    }

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const getUserStats = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: { exclude: ["password"] },
      include: [
        {
          model: Profile,
          as: "profiles",
          attributes: ["id", "name", "profileType", "viewCount", "isActive"],
        },
      ],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Calculate stats
    const totalProfiles = user.profiles.length;
    const activeProfiles = user.profiles.filter((p) => p.isActive).length;
    const totalViews = user.profiles.reduce(
      (sum, p) => sum + (p.viewCount || 0),
      0
    );

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
        },
        stats: {
          totalProfiles,
          activeProfiles,
          totalViews,
          personalProfiles: user.profiles.filter(
            (p) => p.profileType === "personal"
          ).length,
          businessProfiles: user.profiles.filter(
            (p) => p.profileType === "business"
          ).length,
        },
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  // Existing exports (unchanged)
  getUserData,
  updateUserData,
  getAllUsersData,
  changeUserPassword,
  requestEmailChange,
  verifyEmailChange,
  cancelEmailChange,
  getAllUsersDataAdmin,
  getUserById,
  createUser,
  updateUserAdmin,
  deleteUser,
  toggleUserStatus,
  resetUserPassword,
  getUserStats,
};
