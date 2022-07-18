const Post = require("../models/Post");
const middleware = require("../assets/middleware");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const { check, validationResult } = require("express-validator");

// Configure Cloudinary to process images uploaded by user.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD,
  api_key: process.env.CLOUDINARY_API,
  api_secret: process.env.CLOUDINARY_SECRET,
});
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "facebook/postsPictures",
  },
});
const upload = multer({ storage: storage });

exports.getPosts = [
  // Verify token exists - if so, pull and save user id in res.locals.userId for next middleware.
  middleware.verifyTokenAndStoreCredentials,
  async (req, res) => {
    try {
      const posts = await Post.find()
        .populate({
          path: "postedBy",
          model: "User",
          select: ["username", "fullName", "profilePicture"],
        })
        .populate({
          path: "comments",
          populate: {
            path: "user",
            model: "User",
            select: ["username", "fullName", "profilePicture"],
          },
        })
        .sort({ timeStamp: -1 });
      return res.json({ posts });
    } catch (errors) {
      return res
        .status(500)
        .json({ message: "Error retrieving posts", errors });
    }
  },
];

exports.createPost = [
  // Verify token exists - if so, pull and save user id in res.locals.userId for next middleware.
  middleware.verifyTokenAndStoreCredentials,
  // Will upload an image if present - and make the body provided accessible.
  upload.single("picture"),
  check("description")
    .exists()
    .trim()
    .isLength({ min: 4 })
    .withMessage("Description must be at least 4 characters"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ message: "Failed post validation", errors });
    }
    // If no errors, move on to step.
    next();
  },
  async (req, res) => {
    try {
      const newPost = new Post({
        postedBy: res.locals.userId,
        timeStamp: new Date(),
        description: req.body.description,
        picture: req.file === undefined ? null : req.file.path,
        likes: [],
        comments: [],
      });

      await newPost.save();
      // Retrieve new post with populated fields.
      const post = await Post.findById(newPost._id).populate({
        path: "postedBy",
        model: "User",
        select: ["username", "fullName", "profilePicture"],
      });
      return res.json({ post });
    } catch (errors) {
      console.log(errors);
      return res
        .status(500)
        .json({ message: "Error creating new post", errors });
    }
  },
];

/**
 * User can only make one update at a time. First body field to be detected, gets processed and request ends.
 */
exports.editPost = [
  // Verify token exists - if so, pull and save user id in res.locals.userId for next middleware.
  middleware.verifyTokenAndStoreCredentials,
  /**
   * Process action of toggling a like to a post. For this request to be valid, these body fields must exists:
   * postLike must be truthly.
   */
  async (req, res, next) => {
    if (!req.body.postLike) {
      next();
    } else {
      // User intends to add a like to the post ID passed in the params.
      try {
        const post = await Post.findById(req.params.id);
        let updatedPost = null;

        for (let i = 0; i < post.likes.length; i++) {
          // Indicates user has already liked this posts - so we assume user wants to remove their like.
          if (post.likes[i]._id.equals(res.locals.userId)) {
            updatedPost = await Post.findOneAndUpdate(
              { _id: req.params.id },
              { $pullAll: { likes: [{ _id: res.locals.userId }] } },
              {
                new: true,
              }
            )
              .populate({
                path: "postedBy",
                model: "User",
                select: ["username", "fullName", "profilePicture"],
              })
              .populate({
                path: "comments",
                populate: {
                  path: "user",
                  model: "User",
                  select: ["username", "fullName", "profilePicture"],
                },
              });
            return res.json({
              message: "Like removed from post",
              post: updatedPost,
            });
          }
        }
        // If the previous loop didn't end request - we assume user is intending to like this post now.
        updatedPost = await Post.findOneAndUpdate(
          { _id: req.params.id },
          { $push: { likes: [{ _id: res.locals.userId }] } },
          {
            new: true,
          }
        )
          .populate({
            path: "postedBy",
            model: "User",
            select: ["username", "fullName", "profilePicture"],
          })
          .populate({
            path: "comments",
            populate: {
              path: "user",
              model: "User",
              select: ["username", "fullName", "profilePicture"],
            },
          });
        return res.json({ message: "Like added to post", post: updatedPost });
      } catch (errors) {
        return res
          .status(400)
          .json({ message: "Error updating post likes", errors });
      }
    }
  },
  /**
   * Process action of toggling a like to a comment. For this request to be valid, the following fields must be provided:
   * commentLike must be truthly.
   * commentId must be provided.
   */
  async (req, res, next) => {
    if (!req.body.commentLike) {
      // User does not indicate he would like to add a like to a comment, so we move on to our last option.
      next();
    } else {
      // Process user like to a specific comment
      if (!req.body.commentId) {
        return res.status(400).json({
          message: "Please provide comment ID to add like to a comment",
        });
      } else {
        try {
          // We have needed fields to add/remove like to a comment.
          const post = await Post.findById(req.params.id);
          let updatedPost = null;
          for (let i = 0; i < post.comments.length; i++) {
            // If user has already liked this comment - remove their like and end request.
            if (post.comments[i]._id.equals(req.body.commentId)) {
              // Once we find the comment we are looking for - we will loop through the likes it has currently and find out if the current user has already liked this comment.
              for (let j = 0; j < post.comments[i].likes.length; j++) {
                // If the below gets hit - user already liked this comment - so we remove their like and end the request.
                if (post.comments[i].likes[j]._id.equals(res.locals.userId)) {
                  updatedPost = await Post.findOneAndUpdate(
                    // The second field targets the specific in the comments array, that contains an ID that matches the one passed in.
                    { _id: req.params.id, "comments._id": req.body.commentId },
                    // This command pulls all objects in likes array, that contain the _id field we provided.
                    {
                      $pull: {
                        "comments.$.likes": { _id: res.locals.userId },
                      },
                    },
                    {
                      new: true,
                    }
                  )
                    .populate({
                      path: "postedBy",
                      model: "User",
                      select: ["username", "fullName", "profilePicture"],
                    })
                    .populate({
                      path: "comments",
                      populate: {
                        path: "user",
                        model: "User",
                        select: ["username", "fullName", "profilePicture"],
                      },
                    });
                  return res.json({
                    message: "Removed comment like",
                    post: updatedPost,
                  });
                }
              }
            }
          }
          // If we reach this point - then user intends to add like to commentId provided.
          updatedPost = await Post.findOneAndUpdate(
            { _id: req.params.id, "comments._id": req.body.commentId },
            { $push: { "comments.$.likes": { _id: res.locals.userId } } },
            { new: true }
          )
            .populate({
              path: "postedBy",
              model: "User",
              select: ["username", "fullName", "profilePicture"],
            })
            .populate({
              path: "comments",
              populate: {
                path: "user",
                model: "User",
                select: ["username", "fullName", "profilePicture"],
              },
            });
          // End response and provide updated post.
          return res.json({
            message: "Like added to comment",
            post: updatedPost,
          });
        } catch (errors) {
          return res
            .status(500)
            .json({ message: "Error adding like to comment", errors });
        }
      }
    }
  },
  /**
   * Process action of adding a comment to a post. For this request to be valid, these body fields must exists:
   * comment must be provided
   */
  async (req, res) => {
    if (req.body.comment) {
      try {
        const post = await Post.findOneAndUpdate(
          { _id: req.params.id },
          {
            $push: {
              comments: [
                // Add new comment with required fields to post
                {
                  user: res.locals.userId,
                  comment: req.body.comment,
                  timeStamp: new Date(),
                },
              ],
            },
          },
          {
            new: true,
          }
        )
          .populate({
            path: "postedBy",
            model: "User",
            select: ["username", "fullName", "profilePicture"],
          })
          .populate({
            path: "comments",
            populate: {
              path: "user",
              model: "User",
              select: ["username", "fullName", "profilePicture"],
            },
          });
        return res.json({ message: "Comment added to post", post });
      } catch (error) {
        return res
          .status(500)
          .json({ message: "Error adding comment to post" });
      }
    } else {
      // End request since user didn't send a valid field to update.
      return res
        .status(400)
        .json({ message: "Please provide a field to update" });
    }
  },
];

// Provides PostId in body, and deletes posts if current user is the author
exports.deletePost = [
  // Verify token exists - if so, pull and save user id in res.locals.userId for next middleware.
  middleware.verifyTokenAndStoreCredentials,
  async (req, res) => {
    if (!req.params.id) {
      return res.status(400).json({
        message: "Please provide a postId in order to delete a post.",
      });
    } else {
      try {
        const post = await Post.findById(req.params.id);
        if (!post.postedBy.equals(res.locals.userId)) {
          return res
            .status(400)
            .json({ message: "Can't delete another users post" });
        } else {
          await Post.findByIdAndDelete(req.params.id);
          // Call our own endpoint to get all current posts and return to user
          res.json({ message: "Post deleted" });
        }
      } catch (error) {
        return res.status(400).json({ message: "Error deleting post" });
      }
    }
  },
];
