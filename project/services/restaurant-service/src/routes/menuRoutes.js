const express = require("express");
const menuController = require("../controllers/menuController");
const { protect } = require("../middleware/auth");

const router = express.Router();

// All routes are protected
router.use(protect);

router
  .route("/")
  .get(menuController.getMenuItems)
  .post(menuController.createMenuItem);

router
  .route("/:id")
  .get(menuController.getMenuItem)
  .put(menuController.updateMenuItem)
  .delete(menuController.deleteMenuItem);

router.patch("/:id/stock", menuController.updateStock);

module.exports = router;

