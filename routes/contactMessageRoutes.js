const express = require("express");
const router = express.Router();
const contactMessageController = require("../controllers/contactMessageController");

router.post("/create/contact-messages", contactMessageController.createMessage);
router.get("/get/contact-messages", contactMessageController.getAllMessages);
router.post("/reply/contact-messages", contactMessageController.replyToMessage);

module.exports = router;
