const router = require("express").Router();
const postsController = require("../controllers/postsController");

router.get("/", postsController.getPosts);

router.post("/", postsController.createPost);

/**
 * User can only make one update at a time. First body field to be detected, gets processed and request ends.
 * add/remove like to a post => postLike must be truthly
 * add/remove like to a comment => commentLike must be truthly and commentId provided (will end request if one field is missing)
 * add comment to post => comment must be provided
 */
router.put("/:id", postsController.editPost);

router.delete("/:id", postsController.deletePost);

module.exports = router;
