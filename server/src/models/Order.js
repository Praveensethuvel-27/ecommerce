import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  weight: { type: String, default: '' },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
});

const orderSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    customerEmail: { type: String, required: true },
    items: [orderItemSchema],
    subtotal: { type: Number, required: true },
    shipping: { type: Number, default: 0 },
    total: { type: Number, required: true },
    address: {
      name: String,
      phone: String,
      address1: String,
      address2: String,
      city: String,
      state: String,
      pincode: String,
    },
    paymentMethod: { type: String, default: 'cod' },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'shipped', 'delivered', 'rejected'],
      default: 'pending',
    },
    rejectionReason: { type: String, default: '' },
    // Driver assignment fields
    assignedDriverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', default: null },
    assignedDriverName: { type: String, default: '' },
    assignedDriverPhone: { type: String, default: '' },
    shippedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const Order = mongoose.model('Order', orderSchema);