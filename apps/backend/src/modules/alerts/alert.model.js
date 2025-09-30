const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        required: true,
      },
      address: {
        type: String,
        required: true,
      },
    },
    plants: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Plant',
    }],
    alertTypes: {
      weather: {
        type: Boolean,
        default: true,
      },
      frost: {
        type: Boolean,
        default: true,
      },
      drought: {
        type: Boolean,
        default: true,
      },
      heavyRain: {
        type: Boolean,
        default: true,
      },
    },
    lastSent: {
      type: Date,
      default: null,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Add geospatial index for location-based queries
alertSchema.index({ 'location.coordinates': '2dsphere' });

const Alert = mongoose.model('Alert', alertSchema);

module.exports = Alert;
