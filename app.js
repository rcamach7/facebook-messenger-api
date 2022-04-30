const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

// Authentication libraries
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");

// Import model for passport
const User = require("./models/User");

// Import Routes
const userRoutes = require("./routes/userRoutes");
const loginRoute = require("./routes/loginRoute");
const postsRoutes = require("./routes/postsRoutes");
const friendsRoutes = require("./routes/friendsRoutes");

// Initiate our application
const app = express();

// Enable all origins to connect to our app
app.use(cors());

// Global middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database Set up
const mongoDB = process.env.MONGO_DB;
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.Promise = global.Promise;

// Set up local strategy for our authentication (passport.authentication() uses these settings)
passport.use(
  new LocalStrategy((username, password, done) => {
    User.findOne({ username: username }, (err, user) => {
      // Error occurred in our search
      if (err) return done(err);

      // Validates username
      if (!user) {
        return done(null, false);
      }

      // Validates password
      bcrypt.compare(password, user.password, (err, res) => {
        if (err) return done(err);

        if (res) {
          // Password authenticated
          return done(null, user);
        } else {
          // passwords do not match
          return done(null, false);
        }
      });
    });
  })
);

// Use our user routes to hit endpoints related to users.
app.use("/users", userRoutes);

app.use("/posts", postsRoutes);

app.use("/friends", friendsRoutes);

app.use("/login", loginRoute);

app.get("/", (req, res, next) => {
  res.json({ msg: "hello world" });
});

module.exports = app;
