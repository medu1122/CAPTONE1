import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      index: true,
    },
    type: {
      type: String,
      enum: ['post', 'comment', 'analysis'],
      required: [true, 'Report type is required'],
    },
    targetId: {
      type: mongoose.Schema.Types.Mixed, // Can be ObjectId or string (for analysis ID)
      required: [true, 'Target ID is required'],
    },
    targetType: {
      type: String,
      enum: ['post', 'comment', 'analysis'],
      required: [true, 'Target type is required'],
    },
    reason: {
      type: String,
      enum: ['spam', 'inappropriate', 'harassment', 'fake', 'error', 'wrong_result', 'other'],
      required: [true, 'Report reason is required'],
    },
    originalImageUrl: {
      type: String, // Original image URL (for analysis reports - the image user uploaded for analysis)
      default: null,
    },
    images: {
      type: [String], // Array of image URLs (for analysis reports - images user uploaded to show errors/issues)
      default: [],
    },
    description: {
      type: String,
      maxlength: 1000,
      default: null,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'reviewing', 'resolved', 'dismissed'],
      default: 'pending',
    },
    adminNotes: {
      type: String,
      maxlength: 1000,
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'reports',
    strictPopulate: false, // Allow populating even if not in schema
  }
);

// Indexes for queries
reportSchema.index({ user: 1, createdAt: -1 }); // User's reports sorted by date
reportSchema.index({ targetId: 1, targetType: 1 }); // For finding reports for a specific post/comment
reportSchema.index({ status: 1, createdAt: -1 }); // For admin filtering by status
reportSchema.index({ type: 1, reason: 1 }); // For filtering by type and reason
reportSchema.index({ description: 'text' }); // Text search

const Report = mongoose.model('Report', reportSchema);

export default Report;

