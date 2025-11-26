import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  coordinates: {
    lat: Number,
    lon: Number,
  },
  area: Number, // m²
  soilType: [String], // Array of soil types (multiple)
  sunlight: {
    type: String,
    enum: ['full', 'partial', 'shade'],
  },
}, { _id: false });

const notificationSchema = new mongoose.Schema({
  enabled: {
    type: Boolean,
    default: true,
  },
  email: {
    type: Boolean,
    default: true,
  },
  sms: {
    type: Boolean,
    default: false,
  },
  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'custom'],
    default: 'daily',
  },
  customSchedule: [String], // ["08:00", "18:00"]
}, { _id: false });

const careActionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['water', 'fertilize', 'prune', 'check', 'protect'],
    required: true,
  },
  time: String, // "08:00"
  description: String,
  reason: String,
  products: [String],
}, { _id: false });

const dayStrategySchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
  },
  actions: [careActionSchema],
  weather: {
    temp: {
      min: Number,
      max: Number,
    },
    humidity: Number,
    rain: Number,
    alerts: [String],
  },
}, { _id: false });

const careStrategySchema = new mongoose.Schema({
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
  next7Days: [dayStrategySchema],
  summary: String,
}, { _id: false });

const imageSchema = new mongoose.Schema({
  url: String,
  date: {
    type: Date,
    default: Date.now,
  },
  description: String,
}, { _id: false });

const noteSchema = new mongoose.Schema({
  date: {
    type: Date,
    default: Date.now,
  },
  content: String,
  type: {
    type: String,
    enum: ['care', 'observation', 'issue', 'milestone'],
    default: 'observation',
  },
}, { _id: false });

const plantBoxSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // Basic Info
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    plantType: {
      type: String,
      enum: ['existing', 'planned'],
      required: true,
    },
    plantName: {
      type: String,
      required: true,
      trim: true,
    },
    scientificName: String,
    
    // Timing
    plantedDate: Date, // Nếu existing
    plannedDate: Date, // Nếu planned
    expectedHarvestDate: Date,
    
    // Location & Environment
    location: {
      type: locationSchema,
      required: true,
    },
    
    // Plant Details
    quantity: {
      type: Number,
      min: 1,
      default: 1,
    },
    growthStage: {
      type: String,
      enum: ['seed', 'seedling', 'vegetative', 'flowering', 'fruiting'],
    },
    currentHealth: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor'],
    },
    // Health Issues / Diseases
    currentDiseases: [{
      name: String,              // Disease name
      symptoms: String,          // User description of symptoms
      severity: {
        type: String,
        enum: ['mild', 'moderate', 'severe'],
        default: 'moderate',
      },
      detectedDate: {
        type: Date,
        default: Date.now,
      },
      treatmentPlan: String,    // Suggested treatment plan
      status: {
        type: String,
        enum: ['active', 'treating', 'resolved'],
        default: 'active',
      },
      feedback: [{               // User feedback on disease status
        date: {
          type: Date,
          default: Date.now,
        },
        status: {
          type: String,
          enum: ['worse', 'same', 'better', 'resolved'],
          required: true,
        },
        notes: String,           // Additional notes from user
      }],
    }],
    healthNotes: String,        // Additional health notes
    
    // Care Preferences
    careLevel: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    wateringMethod: {
      type: String,
      enum: ['manual', 'drip', 'sprinkler'],
      default: 'manual',
    },
    fertilizerType: String,
    
    // Additional fields
    purpose: {
      type: String,
      enum: ['food', 'ornamental', 'medicinal', 'commercial'],
    },
    budgetRange: String,
    experienceLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'expert'],
    },
    specialRequirements: String,
    companionPlants: [String],
    
    // Notifications
    notifications: {
      type: notificationSchema,
      default: () => ({}),
    },
    
    // AI Strategy (auto-generated)
    careStrategy: {
      type: careStrategySchema,
      default: null,
    },
    
    // Images
    images: {
      type: [imageSchema],
      default: [],
    },
    
    // Notes
    notes: {
      type: [noteSchema],
      default: [],
    },
    
    // Status
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: 'plant_boxes',
  }
);

// Indexes
plantBoxSchema.index({ user: 1, createdAt: -1 });
plantBoxSchema.index({ user: 1, plantType: 1 });
plantBoxSchema.index({ user: 1, isActive: 1 });
plantBoxSchema.index({ 'location.coordinates.lat': 1, 'location.coordinates.lon': 1 });

// Text index for search
plantBoxSchema.index({ name: 'text', plantName: 'text', scientificName: 'text' });

const PlantBox = mongoose.model('PlantBox', plantBoxSchema);

export default PlantBox;

