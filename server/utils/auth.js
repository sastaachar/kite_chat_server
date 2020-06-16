const jwt = require("jsonwebtoken");

const getJwtToken = (user) => {
  const token = jwt.sign(
    {
      email: user.email,
      userName: user.userName,
    },
    process.env.JWT_KEY,
    {
      expiresIn: "1m",
    }
  );

  return token;
};

const getRefreshJwtToken = (user) => {
  const token = jwt.sign(
    {
      email: user.email,
      userName: user.userName,
    },
    process.env.JWT_REFRESH_KEY + user.password,
    {
      expiresIn: "7d",
    }
  );
  return token;
};

const checkToken = (token, key) => {
  try {
    let payload = jwt.verify(token, key);
    return payload;
  } catch (err) {
    return false;
  }
};

//dont user secure for development
const getCookieOptions = (TTL) => ({
  maxAge: TTL,
  httpOnly: true,
  secure: process.env.NODE_ENV !== "development",
  sameSite: "None",
});

module.exports = {
  getJwtToken,
  getRefreshJwtToken,
  checkToken,
  getCookieOptions,
};
