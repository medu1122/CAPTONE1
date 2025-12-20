import mongoose from 'mongoose';

const phoneVerificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    otp: {
      type: String,
      required: true,
      select: false, // Don't return OTP by default
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
    attempts: {
      type: Number,
      default: 0,
      max: 5, // Max 5 attempts
    },
  },
  {
    timestamps: true,
    collection: 'phone_verifications',
  }
);

// Compound indexes for efficient queries
phoneVerificationSchema.index({ user: 1, used: 1 });
phoneVerificationSchema.index({ phone: 1, used: 1 });
phoneVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 600 }); // TTL: 10 minutes

const PhoneVerification = mongoose.model('PhoneVerification', phoneVerificationSchema);

export default PhoneVerification;

