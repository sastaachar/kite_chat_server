const bcrypt = require("bcrypt");
const { uploader } = require("cloudinary").v2;
const Datauri = require("datauri/parser");
const path = require("path");

const User = require("../models/user");
const { getJwtToken, getRefreshJwtToken } = require("../utils/auth");
const dUri = new Datauri();

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
    //delete the user here
    let userName = req.payload.userName;
    //user also passes the name in params
    if (req.params.userName !== userName) {
      throw new Error("Auth failed");
    }

    await User.deleteOne({ userName });
    res.status(200).json({
      message: `User ${userName} deleted sucessfully`,
    });
  } catch (err) {
    //406 is for unacceptable requests
    res.status(406).json({
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

const updateUserProfilePic = async (req, res) => {
  //this will only update the user profile picture
  try {
    //updating user details the user here
    //check user cred passed
    let userName = req.payload.userName;
    //user also passes the name in params
    if (req.params.userName !== userName) {
      throw new Error("Auth failed");
    }

    //check for a file
    if (req.file) {
      //we got a file it means user wants to update the profilePic

      //check if image already exists
      const user = await User.findOne({ userName });
      if (user.profilePic) {
        //already exist so delete it
        const deleteMessage = await uploader.destroy(user.profilePic.public_id);
        if (deleteMessage.result !== "ok") {
          throw new Error("Failed to remove Profile Image.");
        }
      }
      const file = dUri.format(
        path.extname(req.file.originalname).toString(),
        req.file.buffer
      ).content;

      let img = await uploader.upload(file, { folder: "userProfiles" });

      //now sotre url and public_id
      const profilePic = {
        public_id: img.public_id,
        url: img.url,
      };
      //update the profilePic data
      await User.updateOne({ userName }, { $set: { profilePic } });
    }

    res.status(200).json({
      message: "User profile picture updated sucessfully!",
    });
  } catch (err) {
    res.status(401).json({
      message: err.message,
    });
  }
};
const updateUserDetails = async (req, res) => {
  //this function will be used to update
  //friends and block list
  //small and long info

  try {
    //updating user details the user here
    //check user cred passed
    let userName = req.payload.userName;
    //user also passes the name in params
    if (req.params.userName !== userName) {
      throw new Error("Auth failed");
    }

    if (req.body.add_friends) {
      const user = await User.findOne({ userName });
      let new_friends = [],
        old_blocks = [];
      req.body.add_friends.forEach((friend) => {
        //dont add same friend twice
        if (!user.friends_list.includes(friend)) {
          new_friends.push(friend);
          //if in block list remove
          if (user.block_list.includes(friend)) {
            old_blocks.push(friend);
          }
        }
      });
      await User.updateOne(
        { userName },
        {
          $push: { friends_list: { $each: new_friends } },
          $pull: { block_list: { $in: old_blocks } },
        }
      );
    }
    if (req.body.block_friends) {
      const user = await User.findOne({ userName });
      let new_blocks = [],
        old_friends = [];
      req.body.block_friends.forEach((friend) => {
        //dont block same friend twice
        if (!user.block_list.includes(friend)) {
          new_blocks.push(friend);
          //if in friend list remove
          if (user.friends_list.includes(friend)) {
            old_friends.push(friend);
          }
        }
      });

      await User.updateOne(
        { userName },
        {
          $push: { block_list: { $each: new_blocks } },
          $pull: { friends_list: { $in: old_friends } },
        }
      );
    }
    if (req.body.remove_friends) {
      await User.updateOne(
        { userName },
        {
          $pull: { friends_list: { $in: req.body.remove_friends } },
        }
      );
    }
    if (req.body.remove_blocks) {
      await User.updateOne(
        { userName },
        {
          $pull: { block_list: { $in: req.body.remove_blocks } },
        }
      );
    }
    if (req.body.smallInfo) {
      await User.updateOne(
        { userName },
        {
          $set: { smallInfo: req.body.smallInfo },
        },
        { runValidators: true }
      );
    }
    if (req.body.largeInfo) {
      await User.updateOne(
        { userName },
        {
          $set: { largeInfo: req.body.largeInfo },
        },
        { runValidators: true }
      );
    }
    res.status(200).json({
      message: "User details updated sucessfully!",
    });
  } catch (err) {
    res.status(401).json({
      message: err.message,
    });
  }
};

module.exports = {
  addUser,
  loginUser,
  deleteUser,
  getUser,
  logoutUser,
  updateUserProfilePic,
  updateUserDetails,
};
