const express = require("express");
const router = express.Router();
const cookieParser = require("cookie-parser");
const {
  checkToken,
  getJwtToken,
  getRefreshJwtToken,
} = require("../utils/auth");
const User = require("../models/user");

router.get("/:userName", cookieParser(), async (req, res) => {
  let token = req.cookies.sasachid;
  let userName = req.params.userName;

  let user = await User.findOne({ userName });

  checkToken(token, process.env.JWT_REFRESH_KEY + user.password);

  let newJwtToken = getJwtToken(user);
  let newrefreshToken = getRefreshJwtToken(user);

  res.cookie("sasachid", newrefreshToken, {
    maxAge: 604800000,
    httpOnly: true,
  });

  res.status(200).json({
    newJwtToken,
  });
});

module.exports = router;
