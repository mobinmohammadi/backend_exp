const categoryControllers = require('../../controllers/dashboard/categoryControllers')
const { authMiddleware } = require('../../middlewares/authMiddleware')

const router = require('express').Router()


router.post("/category-add" , authMiddleware , categoryControllers.category_add)
router.get("/get-category" , authMiddleware , categoryControllers.category_get)



module.exports = router