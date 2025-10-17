import mongoose from 'mongoose';

const chatSessionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      length: 36, // UUID v4 length
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: null,
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    messagesCount: {
      type: Number,
      default: 0,
      min: [0, 'Messages count cannot be negative'],
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    collection: 'chat_sessions',
  }
);

// Compound indexes for efficient queries
// sessionId unique index is handled by unique: true in schema
chatSessionSchema.index({ user: 1, lastMessageAt: -1 });

// Text index for title search
chatSessionSchema.index({ title: 'text' });

const ChatSession = mongoose.model('ChatSession', chatSessionSchema);

export default ChatSession;
