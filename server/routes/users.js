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

router.post("/signup", addUser);

router.post("/login", loginUser);

router.delete("/", jwtAuth, deleteUser);

module.exports = router;
