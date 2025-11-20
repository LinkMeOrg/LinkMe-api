const express = require("express");
const router = express.Router();
const {
  getUserData,
  updateUserData,
  getAllUsersData,
  changeUserPassword,
} = require("../controllers/userController");

router.get("/me", getUserData);
router.put("/me", updateUserData);
router.get("/all", getAllUsersData);
router.put("/me/password", changeUserPassword);

module.exports = router;
