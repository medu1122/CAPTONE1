import mongoose from 'mongoose';

const analysisResultSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    image: {
      url: String,
      publicId: String,
    },
    query: {
      text: String,
      imageBase64: String, // Optional, might be used for displaying in history
    },
    result: {
      plantIdentification: {
        isPlant: Boolean,
        probability: Number,
        suggestions: [{
          id: String,
          name: String,
          commonNames: [String],
          scientificName: String,
          probability: Number,
          details: {
            wikiDescription: String,
            taxonomy: Object,
            url: String,
          },
        }],
      },
      healthAssessment: {
        isHealthy: Boolean,
        diseases: [{
          name: String,
          probability: Number,
          description: String,
          treatment: String,
        }],
      },
      careInstructions: {
        watering: String,
        sunlight: String,
        soil: String,
        fertilizer: String,
        pruning: String,
      },
      products: [{
        name: String,
        description: String,
        category: String,
        price: Number,
        url: String,
        imageUrl: String,
      }],
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// Add text index for search
analysisResultSchema.index({ 
  'result.plantIdentification.suggestions.name': 'text',
  'result.plantIdentification.suggestions.commonNames': 'text',
  'result.plantIdentification.suggestions.scientificName': 'text',
});

const Analysis = mongoose.model('Analysis', analysisResultSchema);

export default Analysis;
