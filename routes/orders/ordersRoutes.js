const orderControllers = require("../../controllers/orders/orderControllers");




const router = require("express").Router();

router.post("/home/order/place-order" , orderControllers.place_order);


module.exports = router;
