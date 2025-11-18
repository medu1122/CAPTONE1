import mongoose from 'mongoose';

const BiologicalMethodSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      index: true,
    },
    targetDiseases: [{
      type: String,
      required: true,
      index: true,
    }],
    materials: {
      type: String,
      required: true,
    },
    steps: {
      type: String,
      required: true,
    },
    timeframe: {
      type: String,
      required: true,
    },
    effectiveness: {
      type: String,
      required: true,
    },
    source: {
      type: String,
      required: true,
    },
    verified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: 'biological_methods',
  }
);

// Indexes for search
BiologicalMethodSchema.index({ name: 'text', targetDiseases: 'text' });
BiologicalMethodSchema.index({ targetDiseases: 1 });

const BiologicalMethod = mongoose.model('BiologicalMethod', BiologicalMethodSchema);

export default BiologicalMethod;

