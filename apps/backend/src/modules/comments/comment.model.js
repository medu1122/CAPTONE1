import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
      index: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
      index: true,
    },
    content: {
      type: String,
      required: [true, 'Comment content is required'],
    },
    images: [{
      url: String,
      caption: String,
    }],
    likes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    replyCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    collection: 'comments',
  }
);

// Indexes for efficient queries
commentSchema.index({ post: 1, createdAt: -1 });
commentSchema.index({ author: 1, createdAt: -1 });
commentSchema.index({ parentComment: 1, createdAt: -1 });
commentSchema.index({ post: 1, parentComment: 1 });
commentSchema.index({ post: 1, parentComment: null, createdAt: -1 }); // Root comments only

const Comment = mongoose.model('Comment', commentSchema);

export default Comment;

