import mongoose from 'mongoose';

const taskCompletionTokenSchema = new mongoose.Schema(
  {
    plantBoxId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PlantBox',
      required: true,
      index: true,
    },
    dayIndex: {
      type: Number,
      required: true,
      min: 0,
      max: 6,
    },
    actionId: {
      type: String,
      required: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
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
      index: { expireAfterSeconds: 0 }, // TTL index - auto delete expired tokens
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Compound index for faster lookups
taskCompletionTokenSchema.index({ plantBoxId: 1, dayIndex: 1, actionId: 1, used: 1 });

const TaskCompletionToken = mongoose.model('TaskCompletionToken', taskCompletionTokenSchema);

export default TaskCompletionToken;

