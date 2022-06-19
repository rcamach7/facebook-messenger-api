const router = require("express").Router();
const userController = require("../controllers/userController");

router.post("/", userController.createUser);

router.get("/", userController.getUser);

router.get("/visit/:username", userController.getVisitingUser);

router.put("/", userController.updateUser);

// To be implemented in the future.
router.delete("/", userController.deleteUser);

module.exports = router;
