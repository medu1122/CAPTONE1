import mongoose from 'mongoose';

const plantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Plant name is required'],
      trim: true,
    },
    scientificName: {
      type: String,
      required: [true, 'Scientific name is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    careInstructions: {
      watering: {
        type: String,
        required: true,
      },
      sunlight: {
        type: String,
        required: true,
      },
      soil: {
        type: String,
        required: true,
      },
      temperature: {
        type: String,
        required: true,
      },
    },
    growthStages: [{
      stage: String,
      description: String,
      duration: String,
    }],
    commonDiseases: [{
      name: String,
      symptoms: String,
      treatment: String,
    }],
    images: [{
      url: String,
      caption: String,
    }],
    category: {
      type: String,
      enum: ['vegetable', 'fruit', 'herb', 'flower', 'tree', 'other'],
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Add text index for search
plantSchema.index({ 
  name: 'text', 
  scientificName: 'text', 
  description: 'text' 
});

const Plant = mongoose.model('Plant', plantSchema);

export default Plant;
