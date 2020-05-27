const {
  checkToken,
  getJwtToken,
  getRefreshJwtToken,
} = require("../utils/auth");

const User = require("../models/user");
module.exports = async (req, res, next) => {
  try {
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
      console.log(payload);
      //the jwt and refresh token failed
      if (!payload) {
        throw new Error("Auth Failed");
      }
      //if the refreshJwtToken worked
      //so set new tokens
      res.cookie("sasachid_tk", getJwtToken(user), {
        maxAge: 60000,
        httpOnly: true,
      });
      res.cookie("sasachid_rtk", getRefreshJwtToken(user), {
        maxAge: 604800000,
        httpOnly: true,
      });
    }
    //the jwtToken worked
    req.payload = payload;

    //call the next middleware
    next();
  } catch (err) {
    res.status(409).json({
      message: "Forbidden",
    });
  }
};
