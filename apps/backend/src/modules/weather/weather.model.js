import mongoose from 'mongoose';

const weatherDataSchema = new mongoose.Schema(
  {
    location: {
      name: {
        type: String,
        required: true,
      },
      country: {
        type: String,
        required: true,
      },
      coordinates: {
        lat: {
          type: Number,
          required: true,
        },
        lon: {
          type: Number,
          required: true,
        },
      },
    },
    current: {
      temperature: {
        type: Number,
        required: true,
      },
      humidity: {
        type: Number,
        required: true,
      },
      pressure: {
        type: Number,
        required: true,
      },
      description: {
        type: String,
        required: true,
      },
      icon: {
        type: String,
        required: true,
      },
      windSpeed: {
        type: Number,
        required: true,
      },
      windDirection: {
        type: Number,
        required: true,
      },
    },
    forecast: [{
      date: {
        type: Date,
        required: true,
      },
      temperature: {
        min: {
          type: Number,
          required: true,
        },
        max: {
          type: Number,
          required: true,
        },
      },
      humidity: {
        type: Number,
        required: true,
      },
      description: {
        type: String,
        required: true,
      },
      icon: {
        type: String,
        required: true,
      },
      rain: {
        type: Number,
        default: 0,
      },
    }],
    cachedAt: {
      type: Date,
      default: Date.now,
      expires: 3600, // 1 hour TTL
    },
  },
  {
    timestamps: true,
    collection: 'weather_cache',
  }
);

// Index for location-based queries
weatherDataSchema.index({ 'location.coordinates.lat': 1, 'location.coordinates.lon': 1 });
weatherDataSchema.index({ 'location.name': 1 });
weatherDataSchema.index({ cachedAt: 1 }, { expireAfterSeconds: 3600 });

const WeatherData = mongoose.model('WeatherData', weatherDataSchema);

export default WeatherData;
