const router = require("express").Router();
const userController = require("../controllers/userController");

router.post("/", userController.createUser);

router.get("/", userController.getUser);

// To be implemented in the future.
router.put("/", userController.updateUser);
router.delete("/", userController.deleteUser);

module.exports = router;
