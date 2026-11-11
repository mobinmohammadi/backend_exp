const authControllers = require('../controllers/authControllers')
const { authMiddleware } = require('../middlewares/authMiddleware')

const router = require('express').Router()
// 

router.post("/admin-login" , authControllers.admin_login)
router.post("/seller-register" , authControllers.seller_register)
router.post("/seller-login" , authControllers.seller_login)
router.get("/get-user" , authMiddleware,authControllers.getUser)
router.post("/update-profail-seller" , authMiddleware, authControllers.update_profail_seller)
router.post("/update-shop-seller" , authMiddleware, authControllers.update_shop_seller)


module.exports = router