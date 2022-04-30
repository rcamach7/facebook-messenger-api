const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const User = new Schema({
  username: { type: String, required: true, minlength: 4 },
  password: { type: String, required: true, minlength: 4 },
  fullName: { type: String, required: true, minlength: 4 },
  profilePicture: { type: String, required: true },
  friends: [
    {
      friend: { type: Schema.Types.ObjectId, ref: "User", required: true },
      messages: [
        {
          from: { type: Schema.Types.ObjectId, ref: "User", required: true },
          to: { type: Schema.Types.ObjectId, ref: "User", required: true },
          message: { type: String, required: true },
          timestamp: { type: Date },
        },
      ],
      _id: { type: String, required: true },
    },
  ],
  receivedFriendRequests: [
    { _id: { type: Schema.Types.ObjectId, ref: "User", required: true } },
  ],
  sentFriendRequests: [
    { _id: { type: Schema.Types.ObjectId, ref: "User", required: true } },
  ],
});

module.exports = mongoose.model("User", User);
