import mongoose from 'mongoose';

const emailVerificationSchema = new mongoose.Schema(
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
    collection: 'email_verifications',
  }
);

// Compound indexes for efficient queries
emailVerificationSchema.index({ user: 1, used: 1 });
emailVerificationSchema.index({ tokenHash: 1 }, { unique: true, sparse: true });

// TTL index on expiresAt is handled by MongoDB automatically

const EmailVerification = mongoose.model('EmailVerification', emailVerificationSchema);

export default EmailVerification;
