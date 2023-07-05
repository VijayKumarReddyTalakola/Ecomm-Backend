const express = require("express");
const router = express.Router();
const { getAllProducts ,createProduct, updateProduct, deleteProduct, getProductDetails, createProductReview, getProductReviews, deleteReview } = require("../controllers/productController");
const { isAuthenticated, authorizeRoles  } = require("../middleware/auth");

router.route("/products").get(getAllProducts);

router.route("/product/:id").get(getProductDetails);

router.route("/product/new").post(isAuthenticated, authorizeRoles("admin"), createProduct);

router.route("/product/update/:id").put(isAuthenticated,authorizeRoles("admin"), updateProduct);

router.route("/product/delete/:id").delete(isAuthenticated, authorizeRoles("admin"), deleteProduct);

router.route("/product/review").put(isAuthenticated,createProductReview); 

router.route("/product/reviews/all").get(getProductReviews);

router.route("/product/reviews/delete").delete(isAuthenticated,deleteReview);

module.exports = router