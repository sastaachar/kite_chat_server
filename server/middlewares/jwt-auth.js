const {
  checkToken,
  getJwtToken,
  getRefreshJwtToken,
  getCookieOptions,
} = require("../utils/auth");

const User = require("../models/user");
module.exports = async (req, res, next) => {
  try {
    res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
    //first check the jwt token
    //if not valid check the refresh token
    //if refresh found set the cookies
    let refreshJwtToken = req.cookies.sasachid_rtk;
    let jwtToken = req.cookies.sasachid_tk;
    let userName = req.cookies.sasachid_un;

    //pass the paylaod
    let payload = checkToken(jwtToken, process.env.JWT_KEY);

    if (!payload) {
      //check for the refreshtoken
      let user = await User.findOne({ userName });

      payload = checkToken(
        refreshJwtToken,
        process.env.JWT_REFRESH_KEY + user.password
      );

      //the jwt and refresh token failed
      if (!payload) {
        throw new Error("Auth Failed");
      }
      //if the refreshJwtToken worked
      //so set new tokens
      res.cookie("sasachid_tk", getJwtToken(user), getCookieOptions(60000));
      res.cookie(
        "sasachid_rtk",
        getRefreshJwtToken(user),
        getCookieOptions(604800000)
      );
    }
    //the jwtToken worked
    req.payload = payload;
    //call the next middleware
    next();
  } catch (err) {
    res.status(401).json({
      message: "Auth Failed",
    });
  }
};
