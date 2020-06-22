const bcrypt = require("bcrypt");
const { uploader } = require("cloudinary").v2;
const Datauri = require("datauri/parser");
const path = require("path");

const User = require("../models/user");
const {
  getJwtToken,
  getRefreshJwtToken,
  getCookieOptions,
} = require("../utils/auth");
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
    //--use projection to get only things needed here
    let userName = req.payload.userName;
    let user = await User.findOne({ userName });

    //since we are able to access this function it means the middleware
    //has passed the token here and we can send it to client now
    //but user will get this only once every minute
    let userDetails = { ...user._doc, jwtToken: req.jwtToken };
    delete userDetails._id;
    delete userDetails.password;
    delete userDetails.__v;

    res.status(200).json({
      message: userDetails ? "Found user" : "No such idoit user",
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

    //this is cool
    if (req.cookies.sasachid_un || req.cookies.sasachid_rtk)
      throw new Error("User already connected.");

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
    let jwtToken = getJwtToken(user);
    res.cookie("sasachid_tk", jwtToken, getCookieOptions(60000));
    res.cookie(
      "sasachid_rtk",
      getRefreshJwtToken(user),
      getCookieOptions(604800000)
    );
    res.cookie("sasachid_un", user.userName, getCookieOptions(604800000));

    // bit of a hack
    // don't send unnessary data idiot
    let userDetails = { ...user._doc, jwtToken };
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
    res.cookie("sasachid_tk", "404", getCookieOptions(0));
    res.cookie("sasachid_rtk", "404", getCookieOptions(0));
    res.cookie("sasachid_un", "404", getCookieOptions(0));

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

    //check for a file
    if (req.file) {
      //we got a file it means user wants to update the profilePic

      //check if image already exists
      const user = await User.findOne({ userName });
      if (user.profilePic.public_id) {
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
    //i have not added the user in this scope ,
    //cause then the changes wont be reflected for multiple changes
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

      //user can be firends with themselves
      new_friends = new_friends.filter((friend) => friend !== userName);
      //now add user to other persons request list if possible
      let to_be_friends = await User.find({ userName: { $in: new_friends } });
      //only friends those who are in db no imagianry friends
      new_friends = [];
      let send_req_to = [];
      to_be_friends.forEach((to_friend) => {
        //if not blocked or already friend dont send friend request
        new_friends.push(to_friend.userName);
        if (
          !(
            to_friend.friends_list.includes(userName) ||
            to_friend.block_list.includes(userName)
          )
        ) {
          send_req_to.push(to_friend.userName);
        }
      });
      //send friend request
      await User.updateMany(
        { userName: { $in: send_req_to } },
        { $push: { pending_requests: userName } }
      );
      //update my user
      await User.updateOne(
        { userName },
        {
          $push: { friends_list: { $each: new_friends } },
          $pull: { block_list: { $in: old_blocks } },
        }
      );
    }
    if (req.body.requests_response) {
      let respones_answered = [],
        added_users = [];
      req.body.requests_response.forEach((response) => {
        //check if it is there in the requests
        if (user.pending_requests.includes(response.userName)) {
          if (response.accepted) {
            //user accepted the request
            added_users.push(response.userName);
          }
          respones_answered.push(response.userName);
        }
      });
      //added_users are the ones user accepted'
      //respones_answered are all the reponse to request we got
      await User.updateOne(
        { userName },
        {
          $push: { friends_list: { $each: added_users } },
          $pull: { pending_requests: { $in: respones_answered } },
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
      //user can be firends with themselves
      new_blocks = new_blocks.filter((friend) => friend !== userName);
      //here user can also block imaginary(not in db) friends
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
const deleteUserProfilePic = async (req, res) => {
  //to be built
};

const getFriendDetails = async (req, res) => {
  try {
    let { friends_list } = await User.findOne(
      { userName: req.payload.userName },
      { friends_list: 1 }
    );

    let allFriends = await User.find(
      { userName: { $in: friends_list } },
      { userName: 1, "profilePic.url": 1, smallInfo: 1, largeInfo: 1, _id: 0 }
    );
    res.status(200).json({ allFriends });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  addUser,
  loginUser,
  deleteUser,
  getUser,
  logoutUser,
  getFriendDetails,
  updateUserProfilePic,
  deleteUserProfilePic,
  updateUserDetails,
};
