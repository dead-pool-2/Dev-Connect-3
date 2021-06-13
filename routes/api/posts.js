const express = require("express");
const Post = require("../../models/Posts");
const auth = require("../../middalwares/auth");
const path = require("path");
const User = require("../../models/User");
const Profile = require("../../models/Profile");
const { check, validationResult } = require("express-validator");
const { json } = require("express");
const router = express.Router();
const multer = require("multer");

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/uploads/");
  },
  filename: function (req, file, cb) {
    const extName = path.extname(file.originalname);
    const fileName =
      Date.now() + "-" + Math.round(Math.random() * 1e9) + extName;
    //   const fileName = new Date().toISOString()
    cb(null, fileName);
  },
});

var upload = multer({ storage: storage });

//@route    post api/posts
//@desc     create post
//@access   Private
router.post("/", auth, upload.single("coverimage"), async (req, res) => {
  if (!req.body.description || !req.body.title) {
    return res.status(400).json({ msg: "Description and Title is Required!!" });
  }

  try {
    const user = await User.findById(req.user.id).select("-password");
    const { tags, description, title } = req.body;

    const newPost = {};
    if (description) newPost.description = description;
    newPost.title = title;
    if (tags) newPost.tags = tags.split(",").map((tag) => tag.trim());
    newPost.name = user.name;
    newPost.avatar = user.avatar;
    newPost.user = req.user.id;
    if (req.file !== undefined) newPost.coverimage = req.file.filename;

    const post = new Post(newPost);
    await post.save();
    res.json(post);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error!");
  }
});

//@route    GET api/posts
//@desc     get all post
//@access   Private
router.get("/", auth, async (req, res) => {
  try {
    const posts = await Post.find().sort({ date: -1 });
    res.json(posts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error!");
  }
});

//@route    GET api/posts/:postID
//@desc     get all post
//@access   Private

router.get("/:postID", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postID);

    if (!post) {
      return res.status(404).json({ msg: "Post is not found!!" });
    }

    res.json(post);
  } catch (error) {
    console.error(error);
    if (error.kind === "ObjectId") {
      return res.status(404).json({ msg: "Post is not found!!" });
    }
    res.status(500).send("Server Error!");
  }
});

//@route    DELETE api/posts/:postID
//@desc     delete post with id
//@access   Private

router.delete("/:postID", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postID);

    //check if the person who delte is the owner
    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "Not authorize to delete!!" });
    }

    if (!post) {
      return res.status(404).json({ msg: "Post is not found!!" });
    }
    await post.remove();

    res.json({ msg: "Post is deleted!!" });
  } catch (err) {
    console.error(err.message);

    if (error.kind === "ObjectId") {
      return res.status(404).json({ msg: "Post is not found!!" });
    }
    res.status(500).send("Server Error!");
  }
});

//@route    GET api/posts/user/:userID
//@desc     get post by userID
//@access   Private

router.get("/user/:userID", auth, async (req, res) => {
  try {
    const post = await Post.findOne({ user: req.params.userID });
    console.log(post);
    if (!post) {
      return res.status(404).json({ msg: "Post is not found!!" });
    }
    //    if(post.user.toString() !== req.user.id){
    //     return res.status(401).json({msg : "Not able to find posts!!"});
    //   }
    res.json(post);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error!");
  }
});

//@route    PUT api/posts/like/:postID
//@desc     get all post
//@access   Private

router.put("/like/:postID", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postID);

    //check for already like
    if (
      post.likes.filter((like) => like.user.toString() === req.user.id).length >
      0
    ) {
      return res.status(400).json({ msg: "Post already liked!!" });
    }

    post.likes.unshift({ user: req.user.id });

    await post.save();

    res.json(post.likes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error!");
  }
});

//@route    PUT api/posts/unlike/:postID
//@desc     get all post
//@access   Private

router.put("/unlike/:postID", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postID);

    // Check if the post has not yet been liked
    if (!post.likes.some((like) => like.user.toString() === req.user.id)) {
      return res.status(400).json({ msg: "Post has not yet been liked" });
    }

    // remove the like
    post.likes = post.likes.filter(
      ({ user }) => user.toString() !== req.user.id
    );

    await post.save();

    return res.json(post.likes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

//@route    POST api/posts/comment/:postID
//@desc     add comments
//@access   Private

router.post(
  "/comment/:postID",
  [auth, [check("text", "Text is required").notEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const post = await Post.findById(req.params.postID);
      const user = await User.findById(req.user.id).select("-password");
      const { text } = req.body;

      if (!post) {
        return res.status(404).json({ msg: "Post is not found!!" });
      }

      const newComment = {
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      };

      post.comments.unshift(newComment);
      // const comments = new Post(newComment);

      await post.save();
      res.json(post.comments);
    } catch (err) {
      console.error(err.message);
      if (error.kind === "ObjectId") {
        return res.status(404).json({ msg: "Post is not found!!" });
      }
      res.status(500).send("Server Error!");
    }
  }
);

//@route    DELETE api/posts/comment/:postID/:commentID
//@desc     delete comments
//@access   Private

router.delete("/comment/:postID/:commentID", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postID);

    if (!post) {
      return res.status(404).json({ msg: "Post is not found!!" });
    }

    const comment = post.comments.find(
      (comment) => comment.id === req.params.commentID
    );

    if (!comment) {
      return res.status(404).json({ msg: "Comment does not exist" });
    }

    if (comment.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "User not authorized" });
    }

    await post.save();

    return res.json(post.comments);
  } catch (err) {
    console.error(err.message);
    if (error.kind === "ObjectId") {
      return res.status(404).json({ msg: "Post is not found!!" });
    }
    res.status(500).send("Server Error!");
  }
});

module.exports = router;
