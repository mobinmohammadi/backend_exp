const sellerControllers = require("../../controllers/dashboard/sellerControllers");
const { authMiddleware } = require("../../middlewares/authMiddleware");

const router = require("express").Router();

router.get("/get-sellers", authMiddleware, sellerControllers.get_sellers);
router.get("/get-seller-requsts", authMiddleware, sellerControllers.get_sellers_requsts);
router.get("/get-seller-details/:sellerId", authMiddleware, sellerControllers.get_seller_details);
router.post("/change-status-seller", authMiddleware, sellerControllers.change_status_seller);


module.exports = router