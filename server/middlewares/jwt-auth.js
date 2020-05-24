const jwt = require("jsonwebtoken");
const { checkToken } = require("../utils/auth");
module.exports = (req, res, next) => {
  try {
    //the token is is a format like
    //bearer <token>
    let token = req.header("Authorization").split(" ")[1];

    //pass the paylaod
    let payload = checkToken(token, process.env.JWT_KEY);
    res.payload = payload;

    //call the next middleware
    next();
  } catch (err) {
    res.status(409).json({
      message: "Forbidden",
    });
  }
};
