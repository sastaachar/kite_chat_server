const {
  checkToken,
  getJwtToken,
  getRefreshJwtToken,
  getCookieOptions,
} = require("../utils/auth");

const User = require("../models/user");
module.exports = async (req, res, next) => {
  try {
    //first check the jwt token
    //if not valid check the refresh token
    //if refresh found set the cookies
    let refreshJwtToken = req.cookies._sasachid_rtk;
    let jwtToken = req.cookies._sasachid_tk;
    let userName = req.cookies._sasachid_un;

    //username is stored signed with JWT_KEY
    userName = checkToken(userName, process.env.JWT_KEY).userName;
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
      //this var is used to forward tje jwtToken to client for chatServer
      jwtToken = getJwtToken(user, false);
      res.cookie("_sasachid_tk", jwtToken, getCookieOptions(60000));
      res.cookie(
        "_sasachid_rtk",
        getRefreshJwtToken(user),
        getCookieOptions(604800000)
      );
      //this will store spl token that is signed with jwt key but longer
      res.cookie(
        "_sasachid_un",
        getJwtToken(user, true),
        getCookieOptions(604800000)
      );
    }
    //the jwtToken worked or a newone is assigned
    //pass the jwtToken
    req.jwtToken = jwtToken;

    req.payload = payload;
    //call the next middleware
    next();
  } catch (err) {
    res.status(401).json({
      message: "Auth Failed",
    });
  }
};
