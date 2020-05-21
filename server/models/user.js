const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  //friend_list , block_list , isPublic
});

module.exports = mongoose.model("User", userSchema);
