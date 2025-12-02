import mongoose from 'mongoose';

const complaintSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      index: true,
    },
    type: {
      type: String,
      enum: ['analysis', 'chatbot', 'my-plants', 'map', 'general'],
      required: [true, 'Complaint type is required'],
    },
    category: {
      type: String,
      enum: ['error', 'suggestion', 'bug', 'other'],
      default: 'other',
    },
    title: {
      type: String,
      required: [true, 'Complaint title is required'],
      maxlength: 200,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Complaint description is required'],
      maxlength: 2000,
      trim: true,
    },
    relatedId: {
      type: mongoose.Schema.Types.Mixed, // Allow both ObjectId and String (e.g., province codes)
      default: null,
    },
    relatedType: {
      type: String,
      enum: ['analysis', 'post', 'plant', 'plantBox', 'map', null],
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'reviewing', 'resolved', 'rejected'],
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
    attachments: [{
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
    }],
  },
  {
    timestamps: true,
    collection: 'complaints',
  }
);

// Indexes for queries
complaintSchema.index({ user: 1, createdAt: -1 }); // User's complaints sorted by date
complaintSchema.index({ status: 1, createdAt: -1 }); // For admin filtering by status
complaintSchema.index({ type: 1, status: 1 }); // For filtering by type and status
complaintSchema.index({ relatedId: 1, relatedType: 1 }); // For finding related complaints
complaintSchema.index({ title: 'text', description: 'text' }); // Text search

const Complaint = mongoose.model('Complaint', complaintSchema);

export default Complaint;

