const express = require("express");
const router = express.Router();
const jwtMiddleware = require("../middleware/jwtMiddleware");

const {register, logon, logoff }= require("../controllers/userController");

router.post("/register", register);
router.post("/logon", logon);
router.post("/logoff", jwtMiddleware, logoff);

module.exports = router;