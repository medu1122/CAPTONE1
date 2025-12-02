import mongoose from 'mongoose';

const inputImageSchema = new mongoose.Schema({
  url: String,
  base64: String,
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, { _id: false });

const resultTopSchema = new mongoose.Schema({
  plant: {
    commonName: String,
    scientificName: String,
  },
  confidence: Number,
  summary: String,
}, { _id: false });

const analysisResultSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false, // Allow null for anonymous users
      index: true,
      sparse: true, // Index only for non-null values
    },
    source: {
      type: String,
      required: true,
      enum: ['plantid', 'manual', 'ai'],
      default: 'plantid',
    },
    inputImages: {
      type: [inputImageSchema],
      default: [],
    },
    resultTop: {
      type: resultTopSchema,
      default: null,
    },
    raw: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'analyses',
  }
);

// Add compound index for efficient queries
analysisResultSchema.index({ user: 1, createdAt: -1 });
analysisResultSchema.index({ createdAt: 1 }); // For daily analysis count queries
analysisResultSchema.index({ source: 1, createdAt: -1 }); // For filtering by source (plantid/manual/ai)
analysisResultSchema.index({ 'resultTop.plant.commonName': 1 }); // For top plants statistics

const Analysis = mongoose.model('Analysis', analysisResultSchema);

export default Analysis;
