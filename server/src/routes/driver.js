import express from 'express';
import bcrypt from 'bcryptjs';
import { Driver } from '../models/Driver.js';
import { Order } from '../models/Order.js';
import { signAccessToken, verifyAccessToken } from '../utils/jwt.js';

export const driverRouter = express.Router();

// ─── Driver middleware ────────────────────────────────────────────────────────
async function requireDriver(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [, token] = header.split(' ');
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const decoded = verifyAccessToken(token);
    if (decoded.role !== 'driver') return res.status(403).json({ error: 'Forbidden' });

    const driver = await Driver.findById(decoded.sub).lean();
    if (!driver || !driver.active) return res.status(401).json({ error: 'Unauthorized' });

    req.driver = { id: String(driver._id), name: driver.name, phone: driver.phone };
    return next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

// ─── Admin middleware ─────────────────────────────────────────────────────────
function requireAdmin(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [, token] = header.split(' ');
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const decoded = verifyAccessToken(token);
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

    req.admin = decoded;
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// ─── Driver login ─────────────────────────────────────────────────────────────
driverRouter.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const driver = await Driver.findOne({ email: String(email).toLowerCase().trim() });
  if (!driver) return res.status(401).json({ error: 'Invalid credentials' });
  if (!driver.active) return res.status(403).json({ error: 'Account deactivated' });

  const ok = await bcrypt.compare(String(password), driver.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  const token = signAccessToken({ sub: String(driver._id), role: 'driver' });
  return res.json({
    token,
    driver: { id: String(driver._id), name: driver.name, phone: driver.phone, email: driver.email },
  });
});

// ─── Get assigned orders for driver ──────────────────────────────────────────
driverRouter.get('/orders', requireDriver, async (req, res) => {
  const orders = await Order.find({
    assignedDriverId: req.driver.id,
    status: { $in: ['confirmed', 'shipped'] },
  })
    .sort({ createdAt: -1 })
    .lean();

  const dtos = orders.map((o) => {
    const addr = o.address || {};
    return {
      id: String(o._id),
      orderId: o.orderId,
      customerName: addr.name || '',
      customerPhone: addr.phone || '',
      address: [addr.address1, addr.address2, addr.city, addr.state, addr.pincode]
        .filter(Boolean).join(', '),
      total: o.total,
      status: o.status,
      items: o.items.length,
      createdAt: o.createdAt,
    };
  });

  return res.json(dtos);
});

// ─── Scan QR → mark order as shipped ─────────────────────────────────────────
driverRouter.patch('/scan/:orderId', requireDriver, async (req, res) => {
  const { orderId } = req.params;

  const order = await Order.findOne({
    $or: [
      { orderId: orderId },
      ...(orderId.match(/^[a-f\d]{24}$/i) ? [{ _id: orderId }] : []),
    ],
    assignedDriverId: req.driver.id,
  });

  if (!order) {
    return res.status(404).json({ error: 'Order not found or not assigned to you' });
  }

  if (order.status === 'shipped' || order.status === 'delivered') {
    return res.status(400).json({ error: `Order already ${order.status}` });
  }

  if (order.status === 'rejected' || order.status === 'pending') {
    return res.status(400).json({ error: 'Cannot ship this order' });
  }

  order.status = 'shipped';
  order.shippedAt = new Date();
  await order.save();

  const io = req.app.get('io');
  if (io) {
    io.emit('orders:updated', { id: String(order._id), status: 'shipped' });
    io.to(`user:${String(order.userId)}`).emit('orders:shipped', {
      orderId: order.orderId,
      message: `Your order ${order.orderId} is on the way!`,
      driverName: req.driver.name,
      driverPhone: req.driver.phone,
    });
    io.emit('admin:order_shipped', {
      type: 'order_shipped',
      orderId: order.orderId,
      driverName: req.driver.name,
      message: `Order ${order.orderId} picked up by ${req.driver.name}`,
      timestamp: new Date().toISOString(),
    });
  }

  return res.json({
    ok: true,
    orderId: order.orderId,
    status: 'shipped',
    customerName: order.address?.name || '',
    customerPhone: order.address?.phone || '',
    address: [order.address?.address1, order.address?.city, order.address?.pincode]
      .filter(Boolean).join(', '),
  });
});

// ─── Admin: create driver account ─────────────────────────────────────────────
driverRouter.post('/create', requireAdmin, async (req, res) => {
  const { name, phone, email, password } = req.body || {};
  if (!name || !phone || !email || !password) {
    return res.status(400).json({ error: 'All fields required' });
  }

  const existing = await Driver.findOne({ $or: [{ email: email.toLowerCase() }, { phone }] });
  if (existing) return res.status(409).json({ error: 'Driver already exists with this email or phone' });

  const passwordHash = await bcrypt.hash(String(password), 10);
  const driver = await Driver.create({
    name: name.trim(),
    phone: phone.trim(),
    email: email.toLowerCase().trim(),
    passwordHash,
  });

  return res.status(201).json({
    id: String(driver._id),
    name: driver.name,
    phone: driver.phone,
    email: driver.email,
  });
});

// ─── Admin: list all drivers ──────────────────────────────────────────────────
driverRouter.get('/list', requireAdmin, async (req, res) => {
  const drivers = await Driver.find({}).select('-passwordHash').sort({ createdAt: -1 }).lean();
  return res.json(drivers.map((d) => ({
    id: String(d._id),
    name: d.name,
    phone: d.phone,
    email: d.email,
    active: d.active,
  })));
});

// ─── Admin: assign driver to order ────────────────────────────────────────────
driverRouter.patch('/assign/:orderId', requireAdmin, async (req, res) => {
  const { orderId } = req.params;
  const { driverId } = req.body || {};

  if (!driverId) return res.status(400).json({ error: 'driverId required' });

  const driver = await Driver.findById(driverId);
  if (!driver) return res.status(404).json({ error: 'Driver not found' });

  const order = await Order.findByIdAndUpdate(
    orderId,
    {
      assignedDriverId: driverId,
      assignedDriverName: driver.name,
      assignedDriverPhone: driver.phone,
    },
    { new: true }
  );

  if (!order) return res.status(404).json({ error: 'Order not found' });

  const io = req.app.get('io');
  if (io) {
    io.emit('orders:updated', {
      id: String(order._id),
      assignedDriverName: driver.name,
    });
  }

  return res.json({
    ok: true,
    orderId: order.orderId,
    driverName: driver.name,
    driverPhone: driver.phone,
  });
});