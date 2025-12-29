const express = require("express");
const reviewController = require("../controllers/reviewController");

const router = express.Router();

// Routes cho reviews
router.route("/").post(reviewController.createReview);

// Lấy reviews của sản phẩm (public)
router.route("/product/:productId").get(reviewController.getProductReviews);

// Lấy sản phẩm cần review trong order (cần auth)
router
  .route("/order/:orderId/products")
  .get(reviewController.getProductsToReviewInOrder);

// Lấy review của user cho sản phẩm trong order (cần auth)
router
  .route("/order/:orderId/product/:productId")
  .get(reviewController.getUserReviewForProductInOrder);

// Cập nhật và xóa review (cần auth)
router
  .route("/:reviewId")
  .patch(reviewController.updateReview)
  .delete(reviewController.deleteReview);

module.exports = router;
