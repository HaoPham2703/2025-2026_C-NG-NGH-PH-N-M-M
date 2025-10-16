const express = require("express");
const userController = require("../controllers/userController");
const authController = require("../controllers/authController");

const router = express.Router();

// Authentication routes (no auth required)
router.post("/googleLogin", authController.googleLogin);
router.post("/userLoginWith", authController.userLoginWith);
router.post("/signup", authController.signup);
router.post("/signup-admin", authController.signupAdmin);
router.post("/login", authController.login);
router.post("/verifyResetPass", authController.verifyResetPass);
router.get("/logout", authController.logout);
router.post("/forgotPassword", authController.forgotPassword);
router.patch("/resetPassword/:token", authController.resetPassword);
router.patch("/changeState", authController.changeStateUser);
router.post("/verify", authController.verifyUser);

// Token verification endpoint for API Gateway
router.get("/auth/verify", authController.verify);

// Protect all routes after this middleware
router.use(authController.protect);

router.patch("/updateMyPassword", authController.updatePassword);
router.get("/me", userController.getMe, userController.getUser);
router.patch("/updateMe", userController.updateMe);
router.delete("/deleteMe", userController.deleteMe);
router.get("/me/address", userController.getUserAddress);
router.patch("/createAddress", userController.createAddress);
router.patch("/updateAddress", userController.updateAddress);
router.patch("/setDefaultAddress", userController.setDefaultAddress);
router.patch("/deleteAddress", userController.deleteAddress);

// Admin only routes
router.use(authController.restrictTo("admin"));
router.route("/getTableUser").get(userController.getTableUser);
router
  .route("/")
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route("/:id")
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
