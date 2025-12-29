const express = require("express");
const productController = require("../controllers/productController");

const router = express.Router();

// Public routes
router
  .route("/top-5-cheap")
  .get(productController.aliasTopProducts, productController.getAllProducts);

router
  .route("/")
  .get(productController.getAllProducts)
  .post(
    productController.uploadProductImages,
    productController.resizeProductImages,
    productController.createProduct
  );

router
  .route("/:id")
  .get(productController.getProduct)
  .patch(
    productController.uploadProductImages,
    productController.resizeProductImages,
    productController.deleteImageCloud,
    productController.updateProduct
  )
  .delete(
    productController.deleteImageCloud,
    productController.deleteProduct
  );

// Admin routes
router.route("/getTableProduct").get(productController.getTableProduct);

// Category routes
router
  .route("/categories")
  .get(productController.getAllCategories)
  .post(productController.createCategory);

// Brand routes
router
  .route("/brands")
  .get(productController.getAllBrands)
  .post(productController.createBrand);

// Inventory routes
router
  .route("/check-inventory")
  .post(productController.checkInventory);

router
  .route("/update-inventory")
  .post(productController.updateInventory);

module.exports = router;
