const homeControllers = require("../../controllers/home/homeControllers");

const router = require("express").Router();

router.get("/get-category", homeControllers.get_category);
router.get("/get-products", homeControllers.get_products);
router.get("/price-range-product", homeControllers.price_range_product);
router.get("/query_products", homeControllers.query_products);
router.get("/get_details_product/:slug", homeControllers.get_details_product);

module.exports = router;
