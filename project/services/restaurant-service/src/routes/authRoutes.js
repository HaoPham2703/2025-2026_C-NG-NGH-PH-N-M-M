const express = require("express");
const authController = require("../controllers/authController");
const { protect } = require("../middleware/auth");

const router = express.Router();

// Public routes
router.post("/signup", authController.signup);
router.post("/login", authController.login);

// Protected routes
router.use(protect);

router.post("/logout", authController.logout);
router.post("/change-password", authController.changePassword);
router.get("/me", authController.getMe);

module.exports = router;


