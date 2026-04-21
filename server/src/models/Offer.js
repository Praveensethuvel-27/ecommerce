import mongoose from 'mongoose';

const offerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    productName: { type: String, trim: true, default: '' },
    discountPercent: { type: Number, required: true, min: 1, max: 99 },
    description: { type: String, trim: true, default: '' },
    startDate: { type: Date },
    endDate: { type: Date, required: true },
    showOn: {
      type: [{ type: String, enum: ['website', 'app'] }],
      default: ['website', 'app'],
    },
    bannerImageName: { type: String, default: '' },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Offer = mongoose.model('Offer', offerSchema);  