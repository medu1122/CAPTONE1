import mongoose from 'mongoose';

const passwordChangeOTPSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    otpHash: {
      type: String,
      required: true,
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
passwordChangeOTPSchema.index({ user: 1, used: 1, expiresAt: 1 });

const PasswordChangeOTP = mongoose.model('PasswordChangeOTP', passwordChangeOTPSchema);

export default PasswordChangeOTP;

