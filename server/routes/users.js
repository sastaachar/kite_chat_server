const express = require("express");
const router = express.Router();
const jwtAuth = require("../middlewares/jwt-auth");

const {
  addUser,
  deleteUser,
  loginUser,
} = require("../controllers/usersController");

//the / route will be used to get details of a existing user or patch a user details
router.get("/:userName", jwtAuth, (req, res) => {
  res.send("Login and Sign up");
});

router.post("/signup", addUser);

router.post("/login", loginUser);

router.delete("/:userId", jwtAuth, deleteUser);

module.exports = router;
