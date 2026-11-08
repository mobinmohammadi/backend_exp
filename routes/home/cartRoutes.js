const cardControllers = require("../../controllers/home/cardControllers");
const { authMiddleware } = require('../../middlewares/authMiddleware')



const router = require("express").Router();

router.post("/home/product/add-to-cart", authMiddleware , cardControllers.add_to_cart);
router.get("/home/product/get-cart-product", authMiddleware , cardControllers.get_cart_products);


module.exports = router;
