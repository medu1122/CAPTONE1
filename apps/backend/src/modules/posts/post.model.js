const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: [true, 'Comment content is required'],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Post title is required'],
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Post content is required'],
    },
    images: [{
      url: String,
      caption: String,
    }],
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    tags: [{
      type: String,
      trim: true,
    }],
    likes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    comments: [commentSchema],
    plants: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Plant',
    }],
  },
  {
    timestamps: true,
  }
);

// Add text index for search
postSchema.index({ 
  title: 'text', 
  content: 'text', 
  tags: 'text' 
});

const Post = mongoose.model('Post', postSchema);

module.exports = Post;
