import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, required: true, enum: ['admin', 'customer'], default: 'customer' },
    blocked: { type: Boolean, default: false },
    blockType: { type: String, enum: ['permanent', 'temporary'], default: null },
    blockReason: { type: String, default: '' },
    blockedAt: { type: Date, default: null },
    savedAddress: {
      name: { type: String, default: '' },
      phone: { type: String, default: '' },
      address1: { type: String, default: '' },
      address2: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      pincode: { type: String, default: '' },
    },
  },
  { timestamps: true }
);

export const User = mongoose.model('User', userSchema);