const router = require("express").Router();
const messagesController = require("../controllers/messagesController");

router.post("/:id", messagesController.sendMessage);

module.exports = router;
