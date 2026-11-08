const customerControllers = require("../../controllers/home/customerControllers");

const router = require("express").Router();

router.post("/customer-register", customerControllers.user_register);
router.post("/costomer-login", customerControllers.user_login);


module.exports = router;
