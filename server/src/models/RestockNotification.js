import mongoose from 'mongoose';

const restockNotificationSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    notified: { type: Boolean, default: false },
    notifiedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// One email per product only
restockNotificationSchema.index({ productId: 1, email: 1 }, { unique: true });

export const RestockNotification = mongoose.model('RestockNotification', restockNotificationSchema);