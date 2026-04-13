import express from 'express';
import { Product } from '../models/Product.js';
import { RestockNotification } from '../models/RestockNotification.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { sendRestockEmail } from '../utils/mailer.js';
import { env } from '../config/env.js';

export const restockRouter = express.Router();

/**
 * POST /api/restock/subscribe
 * Customer subscribes to restock notification for an out-of-stock product.
 * Body: { productId, email }
 */
restockRouter.post('/subscribe', async (req, res) => {
  try {
    const { productId, email } = req.body || {};
    if (!productId || !email) {
      return res.status(400).json({ error: 'productId and email are required' });
    }

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    if (product.stock > 0) {
      return res.status(400).json({ error: 'Product is already in stock' });
    }

    // Upsert — if already subscribed, reset notified flag
    await RestockNotification.findOneAndUpdate(
      { productId, email },
      { notified: false, notifiedAt: null },
      { upsert: true, new: true }
    );

    res.json({ ok: true, message: 'You will be notified when this product is back in stock.' });
  } catch (err) {
    console.error('POST /api/restock/subscribe ERROR:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/restock/notify/:productId
 * Admin triggers restock notification manually — sends emails to all subscribers.
 * (This is also called automatically from the PUT /api/products/:id route when stock > 0)
 */
restockRouter.post('/notify/:productId', requireAuth, requireAdmin, async (req, res) => {
  try {
    await triggerRestockNotifications(req.params.productId, req.app.get('io'));
    res.json({ ok: true });
  } catch (err) {
    console.error('POST /api/restock/notify ERROR:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/restock/subscribers/:productId
 * Admin: see how many subscribers a product has.
 */
restockRouter.get('/subscribers/:productId', requireAuth, requireAdmin, async (req, res) => {
  try {
    const count = await RestockNotification.countDocuments({
      productId: req.params.productId,
      notified: false,
    });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Internal helper — send emails + mark notified.
 * Called from products route on restock.
 */
export async function triggerRestockNotifications(productId, io) {
  const product = await Product.findById(productId).lean();
  if (!product) return;

  const subscribers = await RestockNotification.find({ productId, notified: false });
  if (!subscribers.length) return;

  const clientOrigin = env.clientOrigin || 'http://localhost:5173';

  const results = await Promise.allSettled(
    subscribers.map((sub) =>
      sendRestockEmail({
        to: sub.email,
        productName: product.name,
        productSlug: product.slug,
        clientOrigin,
      })
    )
  );

  // Mark as notified those that succeeded
  const notifiedIds = subscribers
    .filter((_, i) => results[i].status === 'fulfilled')
    .map((s) => s._id);

  if (notifiedIds.length > 0) {
    await RestockNotification.updateMany(
      { _id: { $in: notifiedIds } },
      { notified: true, notifiedAt: new Date() }
    );
  }

  // Emit socket event so admin panel can update
  io?.emit('restock:notified', { productId, count: notifiedIds.length });

  console.log(`Restock emails sent: ${notifiedIds.length}/${subscribers.length} for "${product.name}"`);
}