import mongoose from 'mongoose';
import { CHAT_ROLES, CHAT_LIMITS } from './chat.constants.js';

const attachmentSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
  },
  filename: {
    type: String,
    required: true,
  },
  mimeType: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    required: true,
  },
}, { _id: false });

const relatedSchema = new mongoose.Schema({
  analysisId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Analysis',
  },
  plantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plant',
  },
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
  },
}, { _id: false });

const chatMessageSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: [true, 'Session ID is required'],
      index: true,
      length: CHAT_LIMITS.SESSION_ID_LENGTH,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      sparse: true, // Allow multiple documents without user field
    },
    role: {
      type: String,
      required: [true, 'Role is required'],
      enum: Object.values(CHAT_ROLES),
      default: CHAT_ROLES.USER,
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      maxlength: [CHAT_LIMITS.MESSAGE_MAX_LENGTH, `Message cannot exceed ${CHAT_LIMITS.MESSAGE_MAX_LENGTH} characters`],
    },
    attachments: {
      type: [attachmentSchema],
      default: [],
    },
    related: {
      type: relatedSchema,
      default: null,
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    collection: 'chats',
  }
);

// Compound indexes for efficient queries
chatMessageSchema.index({ sessionId: 1, createdAt: 1 });
chatMessageSchema.index({ user: 1, createdAt: -1 }, { sparse: true });

// Ensure sessionId is unique per session-user combination (if user exists)
chatMessageSchema.index({ sessionId: 1, user: 1 }, { sparse: true });

// Text index for message search
chatMessageSchema.index({ message: 'text' });

// Virtual for message ID (alias)
chatMessageSchema.virtual('messageId').get(function() {
  return this._id;
});

// Ensure virtual fields are serialized
chatMessageSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);

export default ChatMessage;
