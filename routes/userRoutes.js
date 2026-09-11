const express = require("express");
const router = express.Router();
const jwtMiddleware = require("../middleware/jwtMiddleware");

const {register, logon, logoff }= require("../controllers/userController");
const {googleLogon} = require("../controllers/googleAuthController");

router.post("/register", register);
router.post("/logon", logon);
router.post("/logoff", jwtMiddleware, logoff);
router.post("/googleLogon", googleLogon);

module.exports = router;