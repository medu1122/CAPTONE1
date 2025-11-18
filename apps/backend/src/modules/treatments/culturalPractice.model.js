import mongoose from 'mongoose';

const CulturalPracticeSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
      enum: ['soil', 'water', 'fertilizer', 'light', 'spacing'],
      index: true,
    },
    action: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    priority: {
      type: String,
      required: true,
      enum: ['High', 'Medium', 'Low'],
      default: 'Medium',
    },
    applicableTo: [{
      type: String,
      required: true,
    }],
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
    collection: 'cultural_practices',
  }
);

// Indexes for search
CulturalPracticeSchema.index({ category: 1, priority: 1 });
CulturalPracticeSchema.index({ action: 'text', description: 'text' });

const CulturalPractice = mongoose.model('CulturalPractice', CulturalPracticeSchema);

export default CulturalPractice;

