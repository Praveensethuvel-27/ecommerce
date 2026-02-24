import express from 'express';
import { User } from '../models/User.js';
import { Order } from '../models/Order.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

export const customersRouter = express.Router();

async function getCustomerDtos(users) {
  if (users.length === 0) return [];
  const orderCounts = await Order.aggregate([
    { $match: { userId: { $in: users.map((u) => u._id) } } },
    { $group: { _id: '$userId', count: { $sum: 1 }, lastOrder: { $max: '$createdAt' } } },
  ]);
  const countMap = Object.fromEntries(
    orderCounts.map((o) => [String(o._id), { count: o.count, lastOrder: o.lastOrder }])
  );
  return users.map((u) => {
    const stats = countMap[String(u._id)] || { count: 0, lastOrder: null };
    const dto = {
      id: String(u._id),
      email: u.email,
      registeredAt: u.createdAt,
      orderCount: stats.count,
      lastOrder: stats.lastOrder,
    };
    if (u.blocked != null) dto.blocked = u.blocked;
    if (u.blockType != null) dto.blockType = u.blockType;
    if (u.blockReason != null) dto.blockReason = u.blockReason;
    if (u.blockedAt != null) dto.blockedAt = u.blockedAt;
    return dto;
  });
}

// Admin: list registered customers (exclude blocked)
customersRouter.get('/', requireAuth, requireAdmin, async (req, res) => {
  const users = await User.find({ role: 'customer', blocked: { $ne: true } })
    .select('email createdAt')
    .sort({ createdAt: -1 })
    .lean();
  const dtos = await getCustomerDtos(users);
  return res.json(dtos);
});

// Admin: list blocked customers
customersRouter.get('/blocked', requireAuth, requireAdmin, async (req, res) => {
  const users = await User.find({ role: 'customer', blocked: true })
    .select('email createdAt blockType blockReason blockedAt')
    .sort({ blockedAt: -1 })
    .lean();
  const dtos = await getCustomerDtos(users);
  return res.json(dtos);
});

// Admin: block customer
customersRouter.post('/:id/block', requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { blockType, reason } = req.body || {};
  if (!blockType || !['permanent', 'temporary'].includes(blockType)) {
    return res.status(400).json({ error: 'blockType must be "permanent" or "temporary"' });
  }
  const user = await User.findOne({ _id: id, role: 'customer' });
  if (!user) return res.status(404).json({ error: 'Customer not found' });
  user.blocked = true;
  user.blockType = blockType;
  user.blockReason = String(reason || '').trim();
  user.blockedAt = new Date();
  await user.save();
  return res.json({ ok: true });
});

// Admin: unblock customer
customersRouter.post('/:id/unblock', requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const user = await User.findOne({ _id: id, role: 'customer' });
  if (!user) return res.status(404).json({ error: 'Customer not found' });
  user.blocked = false;
  user.blockType = null;
  user.blockReason = '';
  user.blockedAt = null;
  await user.save();
  return res.json({ ok: true });
});
