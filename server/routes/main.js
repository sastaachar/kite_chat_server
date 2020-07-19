const express = require("express");
const router = express.Router();

router.get("/", (req, res) => res.redirect("https://kite-chat.herokuapp.com"));

module.exports = router;
