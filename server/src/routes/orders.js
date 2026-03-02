import express from 'express';
import mongoose from 'mongoose';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

export const ordersRouter = express.Router();

function toNumber(v, fallback = 0) {
  if (v === undefined || v === null || v === '') return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

// Create order (customer, requires auth)
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

    // Check sufficient stock
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

    // Deduct stock
    product.stock = product.stock - qty;
    await product.save();

    // Emit low stock notification if stock drops below 10
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

  // Emit new order notification to admin
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

// Customer: list my orders (must be before GET /)
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
  // Support optional status filter and pagination
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

// Admin: update order status
ordersRouter.patch('/:id/status', requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body || {};
  const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'rejected'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  const order = await Order.findByIdAndUpdate(id, { status }, { new: true });
  if (!order) return res.status(404).json({ error: 'Not found' });

  // Emit socket update for real-time sync across admin tabs
  const io = req.app.get('io');
  if (io) {
    io.emit('orders:updated', { id: String(order._id), status: order.status });
  }

  return res.json({ ok: true, status: order.status });
});

// Admin: reject order with reason (restores stock)
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

  // Restore stock for each item
  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.productId, {
      $inc: { stock: item.quantity },
    });
  }

  order.status = 'rejected';
  order.rejectionReason = reason.trim();
  await order.save();

  // Emit socket events
  const io = req.app.get('io');
  if (io) {
    // Notify all admin tabs
    io.emit('orders:updated', {
      id: String(order._id),
      status: 'rejected',
      rejectionReason: reason.trim(),
    });

    // Notify the customer (their personal room)
    io.to(`user:${String(order.userId)}`).emit('orders:rejected', {
      orderId: order.orderId,
      reason: reason.trim(),
      message: `Your order ${order.orderId} was rejected. Reason: ${reason.trim()}`,
    });

    // Admin notification for the notifications page
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

// Admin: product sales data (for per-product report)
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