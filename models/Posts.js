const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const PostsSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "user",
  },
  title: {
    type: String,
    required: true
  },
  tags: {
    type: [String]
  },
  name: {
    type: String,
    required: true,
  },
  avatar: {
    type: String,
  },
  coverimage: {
    type: String,
    default: "no-photo.jpg",
  },
  description: {
    type: String,
    required: true
  },
  likes: [
    {
      user: {
        type: Schema.Types.ObjectId,
        ref: "user",
      },
    },
  ],
  comments: [
    {
      user: {
        type: Schema.Types.ObjectId,
        ref: "user",
      },
      text: {
        type: String,
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      avatar: {
        type: String,
      },
      date: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("posts", PostsSchema);
