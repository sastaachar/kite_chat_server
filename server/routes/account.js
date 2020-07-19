const express = require("express");
const router = express.Router();

const { emailVerification } = require("../controllers/accountController");

router.get("/verification/:token", emailVerification);

//reset password

module.exports = router;
