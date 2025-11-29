import mongoose from 'mongoose';

const soilTypeSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
  },
  domsoil: String,
  faosoil: String,
}, { _id: false });

const cropMonthSchema = new mongoose.Schema({
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12,
  },
  planting: [String],
  harvesting: [String],
}, { _id: false });

const articleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  source: String,
  date: Date,
  imageUrl: String, // Image URL from article
}, { _id: false });

const provinceAgricultureSchema = new mongoose.Schema(
  {
    provinceCode: {
      type: String,
      required: true,
      unique: true,
    },
    simpleMapsId: {
      type: String,
      required: false, // Optional, for SVG mapping
    },
    provinceName: {
      type: String,
      required: true,
    },
    soilTypes: {
      type: [soilTypeSchema],
      default: [],
    },
    cropCalendar: {
      type: [cropMonthSchema],
      default: [],
    },
    articles: {
      type: [articleSchema],
      default: [],
    },
    source: {
      type: String,
      default: 'Open Development Mekong - CC-BY-SA-4.0',
    },
  },
  {
    timestamps: true,
    collection: 'province_agriculture',
  }
);

// Index for search
provinceAgricultureSchema.index({ provinceName: 'text' });
provinceAgricultureSchema.index({ provinceCode: 1 });

const ProvinceAgriculture = mongoose.model('ProvinceAgriculture', provinceAgricultureSchema);

export default ProvinceAgriculture;

