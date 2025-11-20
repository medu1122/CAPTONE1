import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      index: true,
    },
    activeIngredient: {
      type: String,
      required: true,
    },
    manufacturer: {
      type: String,
      required: true,
    },
    targetDiseases: [{
      type: String,
      required: true,
    }],
    targetCrops: [{
      type: String,
      required: true,
    }],
    dosage: {
      type: String,
      required: true,
    },
    usage: {
      type: String,
      required: true,
    },
    price: {
      type: String,
    },
    imageUrl: {
      type: String,
    },
    source: {
      type: String,
      required: true,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    // Additional details for modal
    frequency: {
      type: String,
    },
    isolationPeriod: {
      type: String,
    },
    precautions: [{
      type: String,
    }],
  },
  {
    timestamps: true,
    collection: 'products',
  }
);

// Indexes for search
ProductSchema.index({ name: 'text', activeIngredient: 'text' });
// Note: Cannot create compound index on two array fields (targetDiseases, targetCrops)
// MongoDB will use single-field queries instead

const Product = mongoose.model('Product', ProductSchema);

export default Product;

