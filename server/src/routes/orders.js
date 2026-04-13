import express from 'express';
import mongoose from 'mongoose';
import crypto from 'node:crypto';
import Razorpay from 'razorpay';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { env } from '../config/env.js';

export const ordersRouter = express.Router();

const razorpay = new Razorpay({
  key_id: env.razorpayKeyId,
  key_secret: env.razorpayKeySecret,
});

function toNumber(v, fallback = 0) {
  if (v === undefined || v === null || v === '') return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

// ─── Razorpay: Create payment order ──────────────────────────────────────────
ordersRouter.post('/razorpay/create', requireAuth, async (req, res) => {
  const { amount } = req.body;
  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }
  try {
    const rzpOrder = await razorpay.orders.create({
      amount: Math.round(amount * 100), // paise
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,
    });
    return res.json({
      orderId: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      keyId: env.razorpayKeyId,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ─── Razorpay: Verify payment + create DB order ───────────────────────────────
ordersRouter.post('/razorpay/verify', requireAuth, async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    cartItems,
    address,
  } = req.body;

  // Verify signature
  const body = razorpay_order_id + '|' + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac('sha256', env.razorpayKeySecret)
    .update(body)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    return res.status(400).json({ error: 'Payment verification failed' });
  }

  const userId = req.user?.id;
  const customerEmail = req.user?.email;
  if (!userId || !customerEmail) {
    return res.status(400).json({ error: 'Authentication required' });
  }

  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    return res.status(400).json({ error: 'Cart is empty' });
  }

  const orderItems = [];
  let subtotal = 0;

  for (const item of cartItems) {
    const product = await Product.findById(item.productId);
    if (!product) {
      return res.status(400).json({ error: `Product not found: ${item.productId}` });
    }
    const qty = Math.max(1, toNumber(item.quantity, 1));
    if (product.stock < qty) {
      return res.status(400).json({ error: `Insufficient stock for ${product.name}. Available: ${product.stock}` });
    }
    let price = product.price;
    if (item.weight && Array.isArray(product.weightOptions) && product.weightOptions.length > 0) {
      const wo = product.weightOptions.find((w) => String(w.weight).trim() === String(item.weight).trim());
      if (wo) price = wo.price;
    }
    orderItems.push({
      productId: product._id,
      productName: product.name,
      weight: item.weight || '',
      price,
      quantity: qty,
    });
    subtotal += price * qty;
    product.stock = product.stock - qty;
    await product.save();

    const io = req.app.get('io');
    if (io && product.stock < 10) {
      io.emit('admin:low_stock', {
        id: String(product._id),
        name: product.name,
        stock: product.stock,
        message: `⚠️ Low Stock: "${product.name}" has only ${product.stock} units left!`,
        timestamp: new Date().toISOString(),
      });
    }
  }

  const shipping = subtotal >= 999 ? 0 : 49;
  const total = subtotal + shipping;
  const orderId = `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const order = await Order.create({
    orderId,
    userId,
    customerEmail,
    items: orderItems,
    subtotal,
    shipping,
    total,
    address: address || {},
    paymentMethod: 'upi',
    paymentId: razorpay_payment_id,
    razorpayOrderId: razorpay_order_id,
    status: 'confirmed', // payment done = auto confirmed
  });

  const io = req.app.get('io');
  if (io) {
    io.emit('admin:new_order', {
      orderId: order.orderId,
      customer: customerEmail,
      total: order.total,
      message: `🛒 New Order: ${order.orderId} from ${customerEmail} — ₹${order.total}`,
      timestamp: new Date().toISOString(),
    });
  }

  return res.status(201).json({
    id: order._id,
    orderId: order.orderId,
    total: order.total,
    status: order.status,
  });
});

// Create order (customer, requires auth) - COD fallback
ordersRouter.post('/', requireAuth, async (req, res) => {
  const userId = req.user?.id;
  const customerEmail = req.user?.email;
  if (!userId || !customerEmail) {
    return res.status(400).json({ error: 'Authentication required' });
  }

  const { items: cartItems, address } = req.body || {};
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    return res.status(400).json({ error: 'Cart is empty' });
  }

  const orderItems = [];
  let subtotal = 0;

  for (const item of cartItems) {
    const product = await Product.findById(item.productId);
    if (!product) {
      return res.status(400).json({ error: `Product not found: ${item.productId}` });
    }

    const qty = Math.max(1, toNumber(item.quantity, 1));

    if (product.stock < qty) {
      return res.status(400).json({ error: `Insufficient stock for ${product.name}. Available: ${product.stock}` });
    }

    let price = product.price;
    if (item.weight && Array.isArray(product.weightOptions) && product.weightOptions.length > 0) {
      const wo = product.weightOptions.find((w) => String(w.weight).trim() === String(item.weight).trim());
      if (wo) price = wo.price;
    }

    orderItems.push({
      productId: product._id,
      productName: product.name,
      weight: item.weight || '',
      price,
      quantity: qty,
    });
    subtotal += price * qty;

    product.stock = product.stock - qty;
    await product.save();

    const io = req.app.get('io');
    if (io && product.stock < 10) {
      io.emit('admin:low_stock', {
        id: String(product._id),
        name: product.name,
        stock: product.stock,
        message: `⚠️ Low Stock: "${product.name}" has only ${product.stock} units left!`,
        timestamp: new Date().toISOString(),
      });
    }
  }

  const shipping = subtotal >= 999 ? 0 : 49;
  const total = subtotal + shipping;

  const orderId = `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const order = await Order.create({
    orderId,
    userId,
    customerEmail,
    items: orderItems,
    subtotal,
    shipping,
    total,
    address: address || {},
    paymentMethod: req.body?.paymentMethod || 'cod',
    status: 'pending',
  });

  const io = req.app.get('io');
  if (io) {
    io.emit('admin:new_order', {
      orderId: order.orderId,
      customer: customerEmail,
      total: order.total,
      message: `🛒 New Order: ${order.orderId} from ${customerEmail} — ₹${order.total}`,
      timestamp: new Date().toISOString(),
    });
  }

  return res.status(201).json({
    id: order._id,
    orderId: order.orderId,
    total: order.total,
    status: order.status,
  });
});

// Customer: list my orders
ordersRouter.get('/my', requireAuth, async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const orders = await Order.find({ userId })
    .sort({ createdAt: -1 })
    .lean();

  const dtos = orders.map((o) => ({
    id: String(o._id),
    orderId: o.orderId,
    date: o.createdAt,
    items: o.items.map((i) => `${i.productName}${i.weight ? ` (${i.weight})` : ''} x${i.quantity}`).join(', '),
    total: o.total,
    status: o.status,
  }));

  return res.json(dtos);
});

// Admin: list all orders
ordersRouter.get('/', requireAuth, requireAdmin, async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const filter = status && status !== 'all' ? { status } : {};
  const skip = (Number(page) - 1) * Number(limit);
  const total = await Order.countDocuments(filter);

  const orders = await Order.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .populate('userId', 'email')
    .lean();

  const dtos = orders.map((o) => {
    const addr = o.address || {};
    return {
      id: String(o._id),
      orderId: o.orderId,
      customerEmail: o.customerEmail,
      customerName: addr.name || '',
      customerPhone: addr.phone || '',
      shippingAddress: {
        name: addr.name || '',
        phone: addr.phone || '',
        line1: addr.address1 || '',
        line2: addr.address2 || '',
        city: addr.city || '',
        state: addr.state || '',
        pincode: addr.pincode || '',
      },
      items: o.items.map((i) => ({
        productId: String(i.productId),
        name: i.productName,
        weight: i.weight || '',
        price: i.price,
        quantity: i.quantity,
      })),
      subtotal: o.subtotal,
      shippingCost: o.shipping,
      total: o.total,
      paymentMethod: o.paymentMethod,
      status: o.status,
      rejectionReason: o.rejectionReason || '',
      assignedDriverId: o.assignedDriverId ? String(o.assignedDriverId) : null,
      assignedDriverName: o.assignedDriverName || '',
      assignedDriverPhone: o.assignedDriverPhone || '',
      createdAt: o.createdAt,
    };
  });

  return res.json({
    orders: dtos,
    pagination: {
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      total,
    },
  });
});

// Admin: summary metrics
ordersRouter.get('/summary', requireAuth, requireAdmin, async (_req, res) => {
  try {
    const stats = await Order.aggregate([
      {
        $project: {
          status: 1,
          totalNumeric: {
            $convert: { input: '$total', to: 'double', onError: 0, onNull: 0 },
          },
        },
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          pendingOrders: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          totalRevenue: { $sum: '$totalNumeric' },
        },
      },
    ]);

    const row = stats?.[0] || { totalOrders: 0, pendingOrders: 0, totalRevenue: 0 };
    return res.json({
      totalOrders: row.totalOrders,
      pendingOrders: row.pendingOrders,
      totalRevenue: row.totalRevenue,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

ordersRouter.patch('/:id/status', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};
    const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const order = await Order.findByIdAndUpdate(id, { status }, { new: true });
    if (!order) return res.status(404).json({ error: 'Not found' });

    const io = req.app.get('io');
    if (io) {
      io.emit('orders:updated', { id: String(order._id), status: order.status });
      if (status !== 'rejected') {
        const statusLabel =
          status === 'confirmed' ? 'Accepted' :
          status === 'shipped' ? 'Shipped' :
          status === 'delivered' ? 'Delivered' : 'Updated';
        io.emit('admin:order_status', {
          orderId: order.orderId,
          status,
          customerEmail: order.customerEmail,
          total: order.total,
          message: `✅ Order ${statusLabel}: ${order.orderId} — ₹${order.total}`,
          timestamp: new Date().toISOString(),
        });
      }
    }

    return res.json({ ok: true, status: order.status });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

ordersRouter.patch('/:id/reject', requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body || {};

  if (!reason || !reason.trim()) {
    return res.status(400).json({ error: 'Rejection reason is required' });
  }

  const order = await Order.findById(id);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  if (order.status === 'rejected') {
    return res.status(400).json({ error: 'Order is already rejected' });
  }

  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.productId, {
      $inc: { stock: item.quantity },
    });
  }

  order.status = 'rejected';
  order.rejectionReason = reason.trim();
  await order.save();

  const io = req.app.get('io');
  if (io) {
    io.emit('orders:updated', { id: String(order._id), status: 'rejected', rejectionReason: reason.trim() });
    io.to(`user:${String(order.userId)}`).emit('orders:rejected', {
      orderId: order.orderId,
      reason: reason.trim(),
      message: `Your order ${order.orderId} was rejected. Reason: ${reason.trim()}`,
    });
    io.emit('admin:order_rejected', {
      type: 'order_rejected',
      orderId: order.orderId,
      customerEmail: order.customerEmail,
      reason: reason.trim(),
      total: order.total,
      message: `❌ Order ${order.orderId} rejected — Reason: ${reason.trim()}`,
      timestamp: new Date().toISOString(),
    });
  }

  return res.json({ ok: true, orderId: order.orderId, status: 'rejected', reason: reason.trim() });
});

ordersRouter.get('/product/:productId/sales', requireAuth, requireAdmin, async (req, res) => {
  const { productId } = req.params;
  const orders = await Order.find({
    'items.productId': new mongoose.Types.ObjectId(productId),
  })
    .sort({ createdAt: -1 })
    .lean();

  let totalQty = 0;
  let totalRevenue = 0;
  const byWeight = {};

  for (const order of orders) {
    for (const item of order.items) {
      if (String(item.productId) === productId) {
        totalQty += item.quantity;
        totalRevenue += item.price * item.quantity;
        const w = item.weight || 'Default';
        byWeight[w] = (byWeight[w] || 0) + item.quantity;
      }
    }
  }

  return res.json({
    productId,
    totalQuantitySold: totalQty,
    totalRevenue,
    byWeight: Object.entries(byWeight).map(([weight, qty]) => ({ weight, quantity: qty })),
    orderCount: orders.length,
  });
});