const cardControllers = require("../../controllers/home/cardControllers");
const { authMiddleware } = require('../../middlewares/authMiddleware')



const router = require("express").Router();

router.post("/home/product/add-to-cart" , cardControllers.add_to_cart);
router.get("/home/product/get-cart-product/:userId", cardControllers.get_cart_products);
router.delete("/home/product/delete-cart-product/:productId", cardControllers.delete_cart_product);
router.put("/home/product/quantity-inc/:cartId", cardControllers.inccrement_product);
router.put("/home/product/quantity-dec/:cartId", cardControllers.deccrement_product);
router.post("/costomer/product/add-wish-product", cardControllers.add_wish_product);
router.get("/costomer/product/get-products-in-wish", cardControllers.get_products_in_wish);
router.delete("/costomer/product/delete-product-in-wish/:productId", cardControllers.delete_product_in_wish);

module.exports = router;
