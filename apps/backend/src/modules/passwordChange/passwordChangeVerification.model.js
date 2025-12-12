import mongoose from 'mongoose';

const passwordChangeVerificationSchema = new mongoose.Schema(
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
      index: true,
    },
    used: {
      type: Boolean,
      default: false,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 }, // Auto-delete expired documents
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
passwordChangeVerificationSchema.index({ user: 1, used: 1, expiresAt: 1 });

const PasswordChangeVerification = mongoose.model('PasswordChangeVerification', passwordChangeVerificationSchema);

export default PasswordChangeVerification;

