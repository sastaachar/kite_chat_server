const User = require("../models/user");
const { checkToken } = require("../utils/auth");

const emailVerification = async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const payload = checkToken(token, process.env.EMAIL_SECRET);
    if (payload) {
      await User.updateOne({ userName: payload.userName }, { verified: true });
      res.status(200).json({ message: "Account Verified!" });
    } else {
      throw new Error("Auth error");
    }
  } catch (err) {
    res.status(403).json({ message: "Could not verify Email !" });
  }
};

const resetPassword = async (req, res) => {
  res.send("not built yet");
};

module.exports = { emailVerification, resetPassword };
