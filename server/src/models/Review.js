import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    userName:  { type: String, required: true, trim: true },
    email:     { type: String, trim: true, lowercase: true, default: '' }, // private, not shown
    title:     { type: String, trim: true, default: '' },
    rating:    { type: Number, required: true, min: 1, max: 5 },
    comment:   { type: String, required: true, trim: true, maxlength: 2000 },
    status:    { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    adminNote: { type: String, default: '' },
  },
  { timestamps: true }
);

export const Review = mongoose.model('Review', reviewSchema);