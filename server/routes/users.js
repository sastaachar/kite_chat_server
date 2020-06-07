const express = require("express");
const router = express.Router();
const { cloudinaryConfig } = require("../middlewares/cloudinaryConfig");
const jwtAuth = require("../middlewares/jwt-auth");

// for multer
const multer = require("multer");
const storage = multer.memoryStorage();
const multerUploads = multer({ storage }).single("profilePicture");
//

const {
  addUser,
  deleteUser,
  loginUser,
  getUser,
  logoutUser,
  updateUserDetails,
} = require("../controllers/usersController");

//the / route will be used to get details of a existing user or patch a user details

//the get route will send the user data of a single user
//the userName will be taken from the jwt token provided in the header
router.get("/", jwtAuth, getUser);
router.patch(
  "/:userName",
  jwtAuth,
  multerUploads,
  cloudinaryConfig,
  updateUserDetails
);
router.delete("/:userName", jwtAuth, deleteUser);

//signup path
router.post("/signup", addUser);

//login path
router.post("/login", loginUser);

router.get("/logout", logoutUser);

module.exports = router;
