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

    res
      .status(200)
      .json({ message: "User Created", userName: newuser.userName });
  } catch (err) {
    res.status(422).json({ message: err.message });
  }
};

const getUser = async (req, res) => {
  try {
    let userName = req.payload.userName;
    let user = await User.findOne({ userName });
    let userDetails = { ...user._doc };
    delete userDetails._id;
    delete userDetails.password;
    delete userDetails.__v;

    res.status(200).json({
      message: userDetails ? "Found user" : "No such user idoit",
      userDetails,
    });
  } catch (err) {
    res.status(401).json({
      message: err,
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    console.log(req.params.userId);
    //delete the user here
    let userName = req.payload.userName;
    await User.deleteOne({ userName });
    res.status(200).json({
      message: `User ${userName} deleted sucessfully`,
    });
  } catch (err) {
    res.status(500).json({
      message: err,
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

    let user = await User.findOne(email_uname);

    //if user doesnt exist or
    //wrong password
    if (!user || !bcrypt.compareSync(req.body.password, user.password))
      throw new Error("Auth Error");

    //get token and refresh token
    //add the jwtToken , refreshToken and userName
    res.cookie("sasachid_tk", getJwtToken(user), {
      maxAge: 60000,
      httpOnly: true,
    });
    res.cookie("sasachid_rtk", getRefreshJwtToken(user), {
      maxAge: 604800000,
      httpOnly: true,
    });
    res.cookie("sasachid_un", user.userName, {
      maxAge: 604800000,
      httpOnly: true,
    });

    // bit of a hack
    // don't send unnessary data idiot
    let userDetails = { ...user._doc };
    delete userDetails._id;
    delete userDetails.password;
    delete userDetails.__v;

    res.status(200).json({
      message: "login Sucessfull",
      userDetails,
    });
  } catch (err) {
    res.status(401).json({
      message: err.message,
    });
  }
};
const logoutUser = async (req, res) => {
  try {
    //delete the token and username
    res.cookie("sasachid_tk", "404");
    res.cookie("sasachid_rtk", "404");
    res.cookie("sasachid_un", "404");

    res.status(200).json({
      message: "logout Sucessfull",
    });
  } catch (err) {
    res.status(401).json({
      message: err,
    });
  }
};

module.exports = {
  addUser,
  loginUser,
  deleteUser,
  getUser,
  logoutUser,
};
