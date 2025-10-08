import mongoose from 'mongoose';

const passwordResetSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      select: false,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 }, // TTL index
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    used: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: 'password_resets',
  }
);

// Compound indexes for efficient queries
passwordResetSchema.index({ user: 1, used: 1 });
passwordResetSchema.index({ tokenHash: 1 }, { unique: true, sparse: true });

// TTL index on expiresAt
passwordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const PasswordReset = mongoose.model('PasswordReset', passwordResetSchema);

export default PasswordReset;
