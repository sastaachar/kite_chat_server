const jwt = require("jsonwebtoken");

const getJwtToken = (user, long) => {
  const token = jwt.sign(
    {
      userName: user.userName,
      refresh: long ? "true" : "false",
      secureKey: long ? "#9810fka1" : null,
    },
    process.env.JWT_KEY,
    {
      expiresIn: long ? "7d" : "1m",
    }
  );

  return token;
};

const getRefreshJwtToken = (user) => {
  const token = jwt.sign(
    {
      userName: user.userName,
      refresh: "true",
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

//dont user secure for development i.e localhost
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
