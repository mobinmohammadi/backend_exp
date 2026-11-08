const productControllers = require('../../controllers/dashboard/productControllers')
const { authMiddleware } = require('../../middlewares/authMiddleware')

const router = require('express').Router()


router.post("/add-product" , authMiddleware , productControllers.add_product)
router.get("/get-products" , authMiddleware, productControllers.get_products)
router.get("/get-product/:productId" , authMiddleware, productControllers.get_product)
router.put("/update-product" , authMiddleware, productControllers.update_product)
router.put("/update-product-image" , authMiddleware, productControllers.update_product_image)



module.exports = router