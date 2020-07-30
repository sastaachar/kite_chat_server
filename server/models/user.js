const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: true,
    unique: true,
    match: /^[a-zA-Z0-9]+([.-_]?[a-zA-Z0-9]+)*$/,
    maxlength: 32,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
  },
  verified: {
    type: Boolean,
    default: false,
    required: true,
  },
  isPublic: {
    type: Boolean,
    default: false,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  profilePic: {
    public_id: String,
    url: String,
  },
  smallInfo: {
    type: String,
    maxlength: 100,
  },
  largeInfo: {
    type: String,
    maxlength: 240,
  },
  friends_list: {
    type: [String],
  },
  block_list: {
    type: [String],
  },
  pending_requests: {
    type: [String],
  },
  pending_approvals: {
    type: [String],
  },
});

module.exports = mongoose.model("User", userSchema);
