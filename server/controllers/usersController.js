const bcrypt = require("bcrypt");

const User = require("../models/user");

const { getJwtToken, getRefreshJwtToken } = require("../utils/auth");

const addUser = async (req, res) => {
  try {
    if (!req.body.password) throw new Error("Password cannot be empty!");

    const hashedPassword = bcrypt.hashSync(req.body.password, 10);

    let newuser = new User({
      userName: req.body.userName,
      email: req.body.email,
      password: hashedPassword,
    });
    newuser = await newuser.save();

    res.status(200).json({ message: "User Created" });
  } catch (err) {
    res.status(401).json({ message: err.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    console.log(req.params.userId);
    //delete the user here
    await User.deleteOne({ _id: req.params.userId });
    res.status(200).json({
      message: `User ${req.params.userId} deleted sucessfully`,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

const loginUser = async (req, res) => {
  try {
    //login the user here

    //if email is there login with that
    //else use userName
    let email_uname = req.body.email
      ? { email: req.body.email }
      : { userName: req.body.userName };

    const user = await User.findOne(email_uname);

    //if user doesnt exist or
    //wrong password
    if (!user || !bcrypt.compareSync(req.body.password, user.password))
      throw new Error("Auth Error");

    //get token and refresh token
    const jwtToken = getJwtToken(user);
    const refreshJwtToken = getRefreshJwtToken(user);

    res.cookie("sasachid", refreshJwtToken, {
      maxAge: 604800000,
      httpOnly: true,
    });

    res.status(200).json({
      message: "login Sucessfull",
      jwtToken,
      ...email_uname,
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({
      message: err,
    });
  }
};
module.exports = {
  addUser,
  loginUser,
  deleteUser,
};
