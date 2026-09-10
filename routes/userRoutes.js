const express = require("express");
const router = express.Router();
const jwtMiddleware = require("../middleware/jwtMiddleware");

const {register, logon, logoff, googleLogon }= require("../controllers/userController");


router.post("/register", register);
router.post("/logon", logon);
router.post("/logoff", jwtMiddleware, logoff);
router.post("/googleLogon", googleLogon);

module.exports = router;