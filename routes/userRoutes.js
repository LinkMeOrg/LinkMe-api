const express = require("express");
const router = express.Router();
const {
  getUserData,
  updateUserData,
  getAllUsersData,
} = require("../controllers/userController");

router.get("/me", getUserData);
router.put("/me", updateUserData);
router.get("/all", getAllUsersData);

module.exports = router;
