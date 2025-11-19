const { User } = require("../models");
const jwt = require("jsonwebtoken");

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

    const { name, email } = req.body;

    const [updated] = await User.update(
      { name, email },
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

module.exports = {
  getUserData,
  updateUserData,
  getAllUsersData,
};
