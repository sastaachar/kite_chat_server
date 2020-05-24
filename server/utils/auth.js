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
  return jwt.verify(token, key);
};

module.exports = {
  getJwtToken,
  getRefreshJwtToken,
  checkToken,
};
