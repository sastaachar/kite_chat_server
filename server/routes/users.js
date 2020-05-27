const express = require("express");
const router = express.Router();
const jwtAuth = require("../middlewares/jwt-auth");

const {
  addUser,
  deleteUser,
  loginUser,
  getUser,
} = require("../controllers/usersController");

//the / route will be used to get details of a existing user or patch a user details
router.get("/", jwtAuth, getUser);
//router.patch()
router.delete("/", jwtAuth, deleteUser);

//signup path
router.post("/signup", addUser);

//login path
router.post("/login", loginUser);

module.exports = router;
