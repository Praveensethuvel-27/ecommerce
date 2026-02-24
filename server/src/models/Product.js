import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    categoryId: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, min: 0 },
    description: { type: String, required: true },
    images: { type: [String], default: [] },
    stock: { type: Number, default: 0, min: 0 },
    featured: { type: Boolean, default: false },
    weightOptions: {
      type: [{ weight: { type: String, trim: true }, price: { type: Number, min: 0 } }],
      default: [],
    },

    // Optional fields (kept for compatibility with current frontend)
    ingredients: { type: [String], default: [] },
    healthBenefits: { type: [String], default: [] },
    usageInstructions: { type: [String], default: [] },
    rating: { type: Number },
    reviewCount: { type: Number },
  },
  { timestamps: true }
);

export const Product = mongoose.model('Product', productSchema);

