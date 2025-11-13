import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      select: false,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    status: {
      type: String,
      enum: ['active', 'blocked'],
      default: 'active',
    },
    profileImage: {
      type: String,
      default: '',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    // User Profile Management Fields
    phone: {
      type: String,
      default: null,
      trim: true,
    },
    bio: {
      type: String,
      default: null,
      maxlength: 500,
      trim: true,
    },
    location: {
      address: { type: String, default: null },
      province: { type: String, default: null },
      city: { type: String, default: null },
      coordinates: {
        lat: { type: Number, default: null },
        lng: { type: Number, default: null },
      },
    },
    settings: {
      emailNotifications: { type: Boolean, default: true },
      smsNotifications: { type: Boolean, default: false },
      language: { type: String, default: 'vi', enum: ['vi', 'en'] },
      theme: { type: String, default: 'light', enum: ['light', 'dark'] },
      privacy: {
        profileVisibility: { type: String, default: 'public', enum: ['public', 'private', 'friends'] },
        showEmail: { type: Boolean, default: false },
        showPhone: { type: Boolean, default: false },
      },
    },
    stats: {
      totalPosts: { type: Number, default: 0 },
      totalComments: { type: Number, default: 0 },
      totalLikes: { type: Number, default: 0 },
      totalPlants: { type: Number, default: 0 },
      joinDate: { type: Date, default: null },
      lastActiveAt: { type: Date, default: null },
    },
    farmerProfile: {
      farmName: { type: String, default: null },
      farmSize: { type: String, default: null },
      farmType: { type: String, default: null },
      crops: [{ type: String }],
      experience: { type: String, default: null },
      certifications: [{ type: String }],
    },
    buyerProfile: {
      preferences: [{ type: String }],
      budgetRange: { type: String, default: null },
      purchaseFrequency: { type: String, default: null },
    },
  },
  {
    timestamps: true,
  }
);

// Unique index on email is handled by unique: true in schema

// Indexes for profile management
userSchema.index({ 'farmerProfile.farmType': 1 });
userSchema.index({ 'stats.totalPosts': -1 });
userSchema.index({ 'stats.lastActiveAt': -1 });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) {
    return next();
  }
  
  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10;
  const salt = await bcrypt.genSalt(saltRounds);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

// Auto-set stats.joinDate from createdAt on first save
userSchema.pre('save', function (next) {
  // Only set joinDate if it's a new user and joinDate is not set
  if (this.isNew && (!this.stats || !this.stats.joinDate)) {
    if (!this.stats) {
      this.stats = {};
    }
    // createdAt will be set by timestamps option, use current date
    this.stats.joinDate = new Date();
  }
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

// Check if user is active
userSchema.methods.isActive = function () {
  return this.status === 'active';
};

const User = mongoose.model('User', userSchema);

export default User;
