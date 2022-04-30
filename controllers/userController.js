const { check, validationResult } = require("express-validator");
const mongoose = require("mongoose");
const middleware = require("../assets/middleware");
const v4 = require("uuid").v4;
const config = require("../config.json");
const axios = require("axios");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

// Configure Cloudinary and set some settings.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD,
  api_key: process.env.CLOUDINARY_API,
  api_secret: process.env.CLOUDINARY_SECRET,
});
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "facebook/profilePictures",
  },
});
const upload = multer({ storage: storage });

exports.createUser = [
  // Data Validation and sanitation.
  check("username")
    .exists()
    .trim()
    .isLength({ min: 4 })
    .withMessage("Username must be at least 4 characters")
    .toLowerCase()
    // Makes sure the username is not already in use by another member
    .custom(async (value) => {
      const user = await User.findOne({ username: value });
      if (user) {
        return Promise.reject("Username already exists");
      }
    }),
  check("password")
    .exists()
    .trim()
    .isLength({ min: 4 })
    .withMessage("Password must be at least 4 characters"),
  check("fullName")
    .exists()
    .trim()
    .isLength({ min: 4 })
    .withMessage("Name must be at least 4 characters"),
  // Check results of validation
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(errors);
    }
    // If no errors, move on to step.
    next();
  },
  async (req, res, next) => {
    try {
      // Hash password provided by user
      const hashedPassword = await bcrypt.hash(req.body.password, 10);
      const friendshipId = v4();

      const user = new User({
        username: req.body.username,
        password: hashedPassword,
        fullName: req.body.fullName,
        profilePicture:
          "https://res.cloudinary.com/de2ymful4/image/upload/v1651269639/facebook/profilePictures/stock_msrwzq.png",
        friends: [
          // Add myself (admin) as a friend by default
          {
            friend: new mongoose.Types.ObjectId("626b194b55c6380a833a11d1"),
            messages: [],
            _id: friendshipId,
          },
        ],
        receivedFriendRequests: [],
        sentFriendRequests: [],
      });
      // Save new user, and update my admin account to reflect new friend as well.
      await user.save();
      await User.updateOne(
        { _id: new mongoose.Types.ObjectId("626b194b55c6380a833a11d1") },
        {
          $push: {
            friends: { friend: user._id, messages: [], _id: friendshipId },
          },
        }
      );

      // Save user in order to provide login details to our endpoint to retrieve authentication token.
      res.locals.user = {
        username: user.username,
        password: req.body.password,
      };
      next();
    } catch (errors) {
      console.log(errors);
      return res
        .status(400)
        .json({ message: "Error creating new account", errors });
    }
  },
  // Make request to our login endpoint to retrieve and send back authentication token.
  async (req, res) => {
    try {
      // Use our login endpoint to send user back a authentication token.
      const {
        data: { token },
      } = await axios.post(`${config.apiUrl}/login`, res.locals.user);

      return res.json({ token });
    } catch (errors) {
      return res
        .status(400)
        .json({ message: "Error retrieving authentication token", errors });
    }
  },
];

exports.getUser = [
  // Verify token exists - if so, pull and save user id in res.locals.userId for next middleware.
  middleware.verifyTokenAndStoreCredentials,
  // Verify token is valid, and retrieve user.
  async (req, res) => {
    try {
      const user = await User.findById(res.locals.userId)
        .select(
          "username fullName profilePicture friends receivedFriendRequests sentFriendRequests"
        )
        .populate({
          path: "friends",
          populate: {
            path: "friend",
            model: "User",
            select: ["username", "fullName", "profilePicture"],
          },
        })
        .populate({
          path: "receivedFriendRequests",
          populate: {
            path: "_id",
            model: "User",
            select: ["username", "fullName", "profilePicture"],
          },
        })
        .populate({
          path: "sentFriendRequests",
          populate: {
            path: "_id",
            model: "User",
            select: ["username", "fullName", "profilePicture"],
          },
        });

      return res.json({ user });
    } catch (errors) {
      return res
        .status(401)
        .json({ message: "Error getting user information", errors });
    }
  },
];

// Allows user to update their fullName, or profilePicture
exports.updateUser = [
  // Verify token exists - if so, pull and save user id in res.locals.userId for next middleware.
  middleware.verifyTokenAndStoreCredentials,
  // Process multi part form data and upload image is it exists
  upload.single("profilePicture"),
  async (req, res) => {
    try {
      // Create new temporary user and pass in all old fields and provided new fields.
      const currentUser = await User.findById(res.locals.userId);
      const updatedUser = new User({
        username: currentUser.username,
        password: currentUser.password,
        fullName: req.body.fullName ? req.body.fullName : currentUser.fullName,
        profilePicture: req.file ? req.file.path : currentUser.profilePicture,
        friends: currentUser.friends,
        receivedFriendRequests: currentUser.receivedFriendRequests,
        sentFriendRequests: currentUser.sentFriendRequests,
        _id: res.locals.userId,
      });

      const user = await User.findOneAndUpdate(
        { _id: res.locals.userId },
        updatedUser,
        {
          new: true,
        }
      )
        .select(
          "username fullName profilePicture friends receivedFriendRequests sentFriendRequests"
        )
        .populate({
          path: "friends",
          populate: {
            path: "friend",
            model: "User",
            select: ["username", "fullName", "profilePicture"],
          },
        })
        .populate({
          path: "receivedFriendRequests",
          populate: {
            path: "_id",
            model: "User",
            select: ["username", "fullName", "profilePicture"],
          },
        })
        .populate({
          path: "sentFriendRequests",
          populate: {
            path: "_id",
            model: "User",
            select: ["username", "fullName", "profilePicture"],
          },
        });

      return res.json({ message: "User has been updated", user });
    } catch (error) {
      console.log(error);
      return res.status(400).json({ message: "Error editing user." });
    }
  },
];

exports.deleteUser = (req, res, next) => {
  res.json({ msg: "Get User Endpoint" });
};
