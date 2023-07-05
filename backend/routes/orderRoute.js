const express = require("express");
const router = express.Router();
const { newOrder, getSingleOrder, myOrders, getAllOrders, updateOrder, deleteOrder } = require("../controllers/orderController");
const { isAuthenticated, authorizeRoles } = require("../middleware/auth");

router.route("/order/new").post(isAuthenticated,newOrder);

router.route("/order/:id").get(isAuthenticated,getSingleOrder);

router.route("/orders/me").get(isAuthenticated,myOrders);

router.route("/admin/orders/all").get(isAuthenticated,authorizeRoles("admin"),getAllOrders);

router.route("/admin/order/update/:id").put(isAuthenticated,authorizeRoles("admin"),updateOrder);

router.route("/admin/order/delete/:id").delete(isAuthenticated,authorizeRoles("admin"),deleteOrder);


module.exports = router;