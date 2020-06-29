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

//signuupMethod
const signupUser = async (req, res) => {
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
    let user = await User.findOne(
      { userName },
      {
        _id: 0,
        password: 0,
        __v: 0,
      }
    );

    //since we are able to access this function it means the middleware
    //has passed the token here and we can send it to client now
    //but user will get this only once every minute
    let userDetails = { ...user._doc, jwtToken: req.jwtToken };

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
    //if user has both tokens then they cant login again
    if (req.cookies._sasachid_un && req.cookies._sasachid_rtk)
      throw new Error("User already connected.");

    //-only use username
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
    //-use projection here
    //i dint want to call the find again
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
    res.cookie("_sasachid_tk", "404", getCookieOptions(0));
    res.cookie("_sasachid_rtk", "404", getCookieOptions(0));
    res.cookie("_sasachid_un", "404", getCookieOptions(0));

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
    //messages related to all the reqs (if all pass)
    let message = "";
    //updating user details the user here
    //check user cred passed
    let userName = req.payload.userName;
    //i have not added the user in this scope ,
    //cause then the changes wont be reflected for multiple changes

    //To ADD FIREND (single)
    if (req.body.add_friend) {
      const user = await User.findOne({ userName });
      const friendToBe = await User.findOne({ userName: req.body.add_friend });

      //if already friend OR req sent OR friend doesnt exist OR they already block
      // OR i block them
      if (
        !friendToBe ||
        user.userName === friendToBe.userName ||
        user.friends_list.includes(friendToBe.userName) ||
        user.block_list.includes(friendToBe.userName) ||
        user.pending_approvals.includes(friendToBe.userName) ||
        user.pending_requests.includes(friendToBe.userName) ||
        friendToBe.block_list.includes(userName)
      ) {
        //change this to 409 if needed
        message += "Can't add user,";
      } else {
        //friend is new connection
        await User.updateOne(
          { userName: friendToBe.userName },
          { $push: { pending_requests: user.userName } }
        );
        await User.updateOne(
          { userName: user.userName },
          { $push: { pending_approvals: friendToBe.userName } }
        );
        message += `Req sent to ${friendToBe.userName},`;
      }
    }

    //requests_reponse = [ { userName : name , accepted : true/false } , {}... ]
    if (req.body.requests_response) {
      const user = await User.findOne({ userName });
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

      //remove my name from their approval list
      await User.updateMany(
        { userName: { $in: respones_answered } },
        { $pull: { pending_approvals: user.userName } }
      );
      // and add to their friend list
      await User.updateMany(
        { userName: { $in: added_users } },
        { $push: { friends_list: user.userName } }
      );
      //update self
      await User.updateOne(
        { userName },
        {
          $push: { friends_list: { $each: added_users } },
          $pull: { pending_requests: { $in: respones_answered } },
        }
      );
      message += "reponded requests,";
    }
    //list of users to cancel approval
    if (req.body.cancel_approval) {
      let cancelList = req.body.cancel_approval;
      const user = await User.findOne({ userName });
      //remove my req from everyone's acc
      await User.updateMany(
        { userName: { $in: cancelList } },
        { $pull: { pending_requests: userName } }
      );
      //remove all(in cancelList) pending approvals from acc
      await User.updateOne(
        { userName },
        { $pull: { pending_approvals: { $in: cancelList } } }
      );
      message += "canceled all possible approvals,";
    }

    //block a single user
    if (req.body.block_friend) {
      const user = await User.findOne({ userName });
      const blockedToBe = await User.findOne({
        userName: req.body.block_friend,
      });
      if (
        !blockedToBe ||
        user.userName === blockedToBe.userName ||
        user.block_list.includes(blockedToBe.userName)
      ) {
        message += "Not blocked,";
      } else {
        //remove any connection
        await User.updateOne(
          { userName: blockedToBe.userName },
          {
            $pull: {
              friends_list: userName,
              pending_approvals: userName,
              pending_requests: userName,
            },
          }
        );

        //remove any connection and block
        await User.updateOne(
          { userName },
          {
            $pull: {
              friends_list: blockedToBe.userName,
              pending_approvals: blockedToBe.userName,
              pending_requests: blockedToBe.userName,
            },
            $push: {
              block_list: blockedToBe.userName,
            },
          }
        );
        message += `Blocked ${blockedToBe.userName},`;
      }
    }
    if (req.body.remove_friends) {
      //remove all friends from my list
      await User.updateOne(
        { userName },
        {
          $pull: { friends_list: { $in: req.body.remove_friends } },
        }
      );
      //remove my name from their list
      await User.updateMany(
        { userName: { $in: req.body.remove_friends } },
        { $pull: { friends_list: userName } }
      );
      message += "unfriended all possible users,";
    }
    if (req.body.remove_blocks) {
      await User.updateOne(
        { userName },
        {
          $pull: { block_list: { $in: req.body.remove_blocks } },
        }
      );
      message += "blocked all possible users,";
    }
    if (req.body.smallInfo) {
      await User.updateOne(
        { userName },
        {
          $set: { smallInfo: req.body.smallInfo },
        },
        { runValidators: true }
      );
      message += "largeInfo updated,";
    }
    if (req.body.largeInfo) {
      await User.updateOne(
        { userName },
        {
          $set: { largeInfo: req.body.largeInfo },
        },
        { runValidators: true }
      );
      message += "smallInfo updated,";
    }
    const updatedUserDetails = await User.findOne({ userName });
    console.log(message);
    res.status(200).json({
      message: `User details updated sucessfully! ${message}`,
      updatedUserDetails,
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
    let {
      friends_list,
      block_list,
      pending_requests,
      pending_approvals,
    } = await User.findOne(
      { userName: req.payload.userName },
      {
        friends_list: 1,
        block_list: 1,
        pending_requests: 1,
        pending_approvals: 1,
      }
    );
    let allFriends = await User.find(
      { userName: { $in: [...friends_list, ...pending_requests] } },
      { userName: 1, "profilePic.url": 1, smallInfo: 1, largeInfo: 1, _id: 0 }
    );
    //add userName to allFriends for block list and pending approvals
    [...pending_approvals, ...block_list].forEach((ele) => {
      allFriends.push({ userName: ele });
    });
    res.status(200).json({ allFriends });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  signupUser,
  loginUser,
  deleteUser,
  getUser,
  logoutUser,
  getFriendDetails,
  updateUserProfilePic,
  deleteUserProfilePic,
  updateUserDetails,
};
