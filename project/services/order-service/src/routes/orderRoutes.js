const express = require("express");
const orderController = require("../controllers/orderController");

const router = express.Router();

// Analytics routes
router.route("/count").get(orderController.countStatus);
router.route("/countOption").post(orderController.countStatusOption);
router.route("/sum").get(orderController.sumRevenue);
router.route("/sumOption").post(orderController.sumRevenueOption);
router.route("/topProduct").post(orderController.topProduct);
router.route("/statusInRange").post(orderController.countStatusInRange);
router.route("/topProductInRange").post(orderController.topProductInRange);
router.route("/sumInRange").post(orderController.sumInRange);

// Admin routes
router.route("/getTableOrder").get(orderController.getTableOrder);

// Order CRUD routes
router
  .route("/")
  .get(orderController.getAllOrders)
  .post(orderController.setUser, orderController.createOrder);

router
  .route("/:id")
  .get(orderController.isOwner, orderController.getOrder)
  .patch(
    orderController.isOwner,
    orderController.checkStatusOrder,
    orderController.updateOrder
  )
  .delete(orderController.isOwner, orderController.deleteOrder);

// New specific endpoints for order management
router.route("/:id/status").patch(orderController.updateOrderStatus);
router.route("/:id/delivery").patch(orderController.assignDeliveryPerson);

// Order queries by user/restaurant/delivery
router.route("/user/:userId").get(orderController.getOrdersByUserId);
router
  .route("/restaurant/:restaurantId")
  .get(orderController.getOrdersByRestaurantId);
router
  .route("/delivery/:deliveryPersonId")
  .get(orderController.getOrdersByDeliveryPersonId);

module.exports = router;
