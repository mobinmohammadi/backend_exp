const orderControllers = require("../../controllers/orders/orderControllers");




const router = require("express").Router();

router.post("/home/order/place-order" , orderControllers.place_order);
router.get("/home/customer/get-dashboard-data/:userId" , orderControllers.get_customer_dashboard_data);
router.get("/home/customer/get-orders/:customerId/:status" , orderControllers.get_orders);
router.get("/home/customer/get-details-order/:orderId" , orderControllers.get_details_order);
       



module.exports = router;
