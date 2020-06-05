const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: true,
    unique: true,
    maxlength: 256,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
  },
  isPublic: {
    type: Boolean,
    default: true,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  profilePic: {
    type: String,
  },
  smallInfo: {
    type: String,
    maxlength: 240,
  },
  aboutMe: {
    type: String,
    maxlength: 500,
  },
  friends_list: {
    type: [String],
  },
  block_list: {
    type: [String],
  },
});

module.exports = mongoose.model("User", userSchema);
