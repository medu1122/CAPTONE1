import mongoose from 'mongoose';

const authTokenSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    refreshTokenHash: {
      type: String,
      required: true,
      select: false,
    },
    userAgent: {
      type: String,
      required: true,
      trim: true,
    },
    ip: {
      type: String,
      required: true,
      trim: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 }, // TTL index
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: 'auth_tokens',
  }
);

// Compound indexes for efficient queries
authTokenSchema.index({ user: 1, isActive: 1 });
authTokenSchema.index({ refreshTokenHash: 1 }, { unique: true, sparse: true });

// TTL index on expiresAt
authTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const AuthToken = mongoose.model('AuthToken', authTokenSchema);

export default AuthToken;
