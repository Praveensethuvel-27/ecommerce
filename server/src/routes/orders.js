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

// Normalise a raw Mongoose order doc → clean DTO for frontend
function orderToDto(o) {
  return {
    id:             String(o._id),
    orderId:        o.orderId,
    createdAt:      o.createdAt,
    updatedAt:      o.updatedAt,
    customerEmail:  o.customerEmail || '',
    customerName:   o.address?.name  || '',
    customerPhone:  o.address?.phone || '',
    shippingAddress: {
      name:    o.address?.name     || '',
      phone:   o.address?.phone    || '',
      line1:   o.address?.address1 || '',
      line2:   o.address?.address2 || '',
      city:    o.address?.city     || '',
      state:   o.address?.state    || '',
      pincode: o.address?.pincode  || '',
    },
    items: (o.items || []).map((item) => ({
      productId:   String(item.productId),
      name:        item.productName || '',
      weight:      item.weight      || '',
      price:       item.price       || 0,
      quantity:    item.quantity    || 1,
    })),
    subtotal:      o.subtotal      || 0,
    shippingCost:  o.shipping      || 0,
    total:         o.total         || 0,
    discount:      o.discount      || 0,
    paymentMethod: o.paymentMethod || 'cod',
    paymentStatus: o.paymentStatus || 'paid',
    paymentId:     o.paymentId     || '',
    status:        o.status        || 'pending',
    courierPartner: o.courierPartner || '',
    awbNumber:      o.awbNumber      || '',
  };
}

// ─── Customer: Place order ────────────────────────────────────────────────────
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
    const product = await Product.findById(item.productId).lean();
    if (!product) {
      return res.status(400).json({ error: `Product not found: ${item.productId}` });
    }

    let price = product.price;
    if (item.weight && Array.isArray(product.weightOptions) && product.weightOptions.length > 0) {
      const wo = product.weightOptions.find((w) => String(w.weight).trim() === String(item.weight).trim());
      if (wo) price = wo.price;
    }

    const qty = Math.max(1, toNumber(item.quantity, 1));
    orderItems.push({
      productId:   product._id,
      productName: product.name,
      weight:      item.weight || '',
      price,
      quantity:    qty,
    });
    subtotal += price * qty;
  }

  const shipping = subtotal >= 999 ? 0 : 49;
  const total    = subtotal + shipping;
  const orderId  = `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  const order = await Order.create({
    orderId,
    userId,
    customerEmail,
    items:         orderItems,
    subtotal,
    shipping,
    total,
    address:       address || {},
    paymentMethod: req.body?.paymentMethod || 'cod',
    status:        'pending',
  });

  // ── Emit real-time event so admin panel instantly shows the new order ──────
  const io = req.app.get('io');
  if (io) {
    io.emit('orders:new', orderToDto(order));
  }

  return res.status(201).json({
    id:      order._id,
    orderId: order.orderId,
    total:   order.total,
    status:  order.status,
  });
});

// ─── Customer: My orders ──────────────────────────────────────────────────────
ordersRouter.get('/my', requireAuth, async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const orders = await Order.find({ userId }).sort({ createdAt: -1 }).lean();

  const dtos = orders.map((o) => ({
    id:      String(o._id),
    orderId: o.orderId,
    date:    o.createdAt,
    items:   o.items.map((i) => `${i.productName}${i.weight ? ` (${i.weight})` : ''} x${i.quantity}`).join(', '),
    total:   o.total,
    status:  o.status,
  }));

  return res.json(dtos);
});

// ─── Admin: List all orders (full detail) ─────────────────────────────────────
ordersRouter.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;

    const filter = {};
    if (status && status !== 'all') filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Order.countDocuments(filter),
    ]);

    return res.json({
      orders: orders.map(orderToDto),
      pagination: {
        total,
        page:  Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    console.error('[GET /api/orders]', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

// ─── Admin: Update order status ───────────────────────────────────────────────
// When admin sets status to 'confirmed', the frontend will auto-generate
// the shipping label + invoice PDF (this happens client-side in AdminOrders.jsx)
ordersRouter.patch('/:id/status', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Allowed: ${validStatuses.join(', ')}` });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: new Date() },
      { new: true, lean: true }
    );

    if (!order) return res.status(404).json({ error: 'Order not found' });

    const dto = orderToDto(order);

    const io = req.app.get('io');
    if (io) {
      // Notify all admin tabs
      io.emit('orders:updated', dto);

      // Notify the specific customer when their order is confirmed
      if (status === 'confirmed') {
        io.to('user:' + String(order.userId)).emit('orders:confirmed', {
          orderId:      order.orderId,
          customerName: order.address?.name || '',
          total:        order.total,
          status:       'confirmed',
        });
      }
    }

    return res.json(dto);
  } catch (err) {
    console.error('[PATCH /api/orders/:id/status]', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

// ─── Admin: Product sales data ────────────────────────────────────────────────
ordersRouter.get('/product/:productId/sales', requireAuth, requireAdmin, async (req, res) => {
  const { productId } = req.params;
  const orders = await Order.find({
    'items.productId': new mongoose.Types.ObjectId(productId),
  }).sort({ createdAt: -1 }).lean();

  let totalQty = 0;
  let totalRevenue = 0;
  const byWeight = {};

  for (const order of orders) {
    for (const item of order.items) {
      if (String(item.productId) === productId) {
        totalQty     += item.quantity;
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