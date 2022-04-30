const User = require("../models/User");
const v4 = require("uuid").v4;
const middleware = require("../assets/middleware");
const { isAlreadyFriend, pendingRequestExists } = require("../assets/helper");

exports.acceptFriendRequest = [
  // Verify token exists - if so, pull and save user id in res.locals.userId for next middleware.
  middleware.verifyTokenAndStoreCredentials,
  // Needs to first remove the pending request from the current user, and the "sent" request from the original user as well.
  async (req, res) => {
    try {
      const friendshipId = v4();

      // Update new friend by adding user to friends, and removing the previously sent request.
      await User.updateOne(
        { _id: req.params.id },
        {
          // Add friend to friends list an initiate a message history
          $push: {
            friends: {
              friend: res.locals.userId,
              messages: [],
              _id: friendshipId,
            },
          },
          // Remove the previously sent request now that user has accepted request.
          $pullAll: {
            sentFriendRequests: [{ _id: res.locals.userId }],
          },
        }
      );

      // Update user by adding new friend, and remove the request received.
      const user = await User.findOneAndUpdate(
        { _id: res.locals.userId },
        {
          // Add new friend to main user and initiate a shared message history.
          $push: {
            friends: {
              friend: req.params.id,
              messages: [],
              _id: friendshipId,
            },
          },
          // Remove the received request now that user has accepted request.
          $pullAll: {
            receivedFriendRequests: [{ _id: req.params.id }],
          },
        },
        { new: true }
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

      return res.json({ message: "Friend request accepted!", user });
    } catch (error) {
      console.log(error);
      return res.status(400).json({ message: "Error", error });
    }
  },
];

exports.requestFriend = [
  // Verify token exists - if so, pull and save for next middleware.
  middleware.verifyTokenAndStoreCredentials,
  // Check to see if this is a valid request.
  async (req, res, next) => {
    try {
      await User.findById(req.params.id);
      const user = await User.findById(res.locals.userId);

      // Verify requested friend is not already a friend
      if (isAlreadyFriend(user, req.params.id)) {
        return res.status(400).json({ msg: "User is already a friend" });
      }
      // Check to see if there exists a pending request already
      if (pendingRequestExists(user, req.params.id)) {
        return res.status(400).json({ msg: "Pending requests already exists" });
      }
      next();
    } catch (error) {
      console.log(error);
      return res.status(400).json({ message: "User does not exist", error });
    }
  },
  // Request is valid - so process friend request.
  async (req, res) => {
    try {
      // Update user to reflect sent request
      const user = await User.findOneAndUpdate(
        { _id: res.locals.userId },
        { $push: { sentFriendRequests: { _id: req.params.id } } },
        { new: true }
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
      // Update friend to reflect received request
      await User.findOneAndUpdate(
        { _id: req.params.id },
        { $push: { receivedFriendRequests: { _id: res.locals.userId } } }
      );

      return res.json({ message: "Friend request sent", user });
    } catch (error) {
      console.log(error);
      return res.json({ message: "Error processing request" });
    }
  },
];
