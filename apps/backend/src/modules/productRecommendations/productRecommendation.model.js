import mongoose from 'mongoose';

const productRecommendationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [200, 'Product name cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    category: {
      type: String,
      required: [true, 'Product category is required'],
      enum: [
        'fertilizer',
        'pesticide',
        'seed',
        'tool',
        'soil',
        'pot',
        'irrigation',
        'protection',
        'other'
      ],
    },
    subcategory: {
      type: String,
      trim: true,
      maxlength: [100, 'Subcategory cannot exceed 100 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Price cannot be negative'],
    },
    currency: {
      type: String,
      default: 'VND',
      enum: ['VND', 'USD'],
    },
    imageUrl: {
      type: String,
      required: [true, 'Product image is required'],
      validate: {
        validator: function(v) {
          return /^https?:\/\/.+\.(jpg|jpeg|png|webp)$/i.test(v);
        },
        message: 'Image URL must be a valid image link',
      },
    },
    externalLinks: [{
      platform: {
        type: String,
        required: true,
        enum: ['shopee', 'tiki', 'lazada', 'sendo', 'other'],
      },
      url: {
        type: String,
        required: true,
        validate: {
          validator: function(v) {
            return /^https?:\/\/.+/.test(v);
          },
          message: 'External link must be a valid URL',
        },
      },
      price: {
        type: Number,
        min: 0,
      },
      availability: {
        type: String,
        enum: ['in_stock', 'out_of_stock', 'limited'],
        default: 'in_stock',
      },
    }],
    tags: [{
      type: String,
      trim: true,
      lowercase: true,
    }],
    plantTypes: [{
      type: String,
      trim: true,
      lowercase: true,
    }],
    diseaseTypes: [{
      type: String,
      trim: true,
      lowercase: true,
    }],
    usageInstructions: {
      type: String,
      trim: true,
      maxlength: [2000, 'Usage instructions cannot exceed 2000 characters'],
    },
    safetyNotes: {
      type: String,
      trim: true,
      maxlength: [500, 'Safety notes cannot exceed 500 characters'],
    },
    rating: {
      average: {
        type: Number,
        min: 0,
        max: 5,
        default: 0,
      },
      count: {
        type: Number,
        min: 0,
        default: 0,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
    collection: 'product_recommendations',
  }
);

// Indexes for efficient queries
productRecommendationSchema.index({ category: 1, isActive: 1 });
productRecommendationSchema.index({ plantTypes: 1, isActive: 1 });
productRecommendationSchema.index({ diseaseTypes: 1, isActive: 1 });
productRecommendationSchema.index({ tags: 1, isActive: 1 });
productRecommendationSchema.index({ 'rating.average': -1, 'rating.count': -1 });
productRecommendationSchema.index({ price: 1, isActive: 1 });

// Text index for search
productRecommendationSchema.index({
  name: 'text',
  description: 'text',
  tags: 'text',
  plantTypes: 'text',
});

const ProductRecommendation = mongoose.model('ProductRecommendation', productRecommendationSchema);

export default ProductRecommendation;
