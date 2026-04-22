import express from 'express';
import { Review } from '../models/Review.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import jwt from 'jsonwebtoken';

export const reviewRouter = express.Router();

// ── Public: GET /api/reviews?productId=xxx&status=approved ───────────────────
// Called by ProductReviews.jsx on website
reviewRouter.get('/', async (req, res) => {
  try {
    const { productId } = req.query;
    if (!productId) return res.status(400).json({ error: 'productId is required' });
    const reviews = await Review.find({ productId, status: 'approved' })
      .sort({ createdAt: -1 }).lean();
    return res.json(reviews.map(toDto));
  } catch (err) {
    return res.status(500).json({ error: err?.message || 'Failed to fetch reviews' });
  }
});

// ── Public/Auth: POST /api/reviews ────────────────────────────────────────────
// No login required — guest can submit with name+email
reviewRouter.post('/', async (req, res) => {
  try {
    const { productId, rating, comment, name, email, title, userName } = req.body;
    if (!productId) return res.status(400).json({ error: 'productId is required' });
    if (!rating || Number(rating) < 1 || Number(rating) > 5)
      return res.status(400).json({ error: 'Rating must be 1–5' });
    if (!comment?.trim() || comment.trim().length < 10)
      return res.status(400).json({ error: 'Review must be at least 10 characters' });

    const resolvedName = (userName || name || 'Customer').trim();

    // Optional auth — try to get userId from token
    let userId = null;
    const authHeader = req.headers.authorization || '';
    if (authHeader.startsWith('Bearer ')) {
      try {
        const decoded = jwt.verify(
          authHeader.split(' ')[1],
          process.env.JWT_SECRET
        );
        userId = decoded.sub;
        // Prevent duplicate for logged-in users
        const existing = await Review.findOne({ productId, userId });
        if (existing)
          return res.status(409).json({ error: 'You have already reviewed this product' });
      } catch (_) { /* guest — ok */ }
    }

    const review = await Review.create({
      productId,
      userId: userId || null,
      userName: resolvedName,
      email: email?.trim().toLowerCase() || '',
      title: title?.trim() || '',
      rating: Number(rating),
      comment: comment.trim(),
      status: 'pending',
    });
    return res.status(201).json(toDto(review.toObject()));
  } catch (err) {
    return res.status(400).json({ error: err?.message || 'Failed to submit review' });
  }
});

// ── Admin: GET all reviews ────────────────────────────────────────────────────
reviewRouter.get('/admin/all', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status && status !== 'all' ? { status } : {};
    const reviews = await Review.find(filter)
      .populate('productId', 'name images')
      .sort({ createdAt: -1 }).lean();
    return res.json(reviews.map(toDtoPopulated));
  } catch (err) {
    return res.status(500).json({ error: err?.message });
  }
});

// ── Admin: Approve ────────────────────────────────────────────────────────────
reviewRouter.patch('/admin/:id/approve', requireAuth, requireAdmin, async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { $set: { status: 'approved', adminNote: '' } },
      { new: true }
    ).lean();
    if (!review) return res.status(404).json({ error: 'Review not found' });
    return res.json(toDto(review));
  } catch (err) {
    return res.status(400).json({ error: err?.message });
  }
});

// ── Admin: Reject ─────────────────────────────────────────────────────────────
reviewRouter.patch('/admin/:id/reject', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { adminNote } = req.body;
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { $set: { status: 'rejected', adminNote: adminNote || '' } },
      { new: true }
    ).lean();
    if (!review) return res.status(404).json({ error: 'Review not found' });
    return res.json(toDto(review));
  } catch (err) {
    return res.status(400).json({ error: err?.message });
  }
});

// ── Admin: Delete ─────────────────────────────────────────────────────────────
reviewRouter.delete('/admin/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id).lean();
    if (!review) return res.status(404).json({ error: 'Review not found' });
    return res.json({ success: true });
  } catch (err) {
    return res.status(400).json({ error: err?.message });
  }
});

function toDto(doc) {
  return {
    id: String(doc._id ?? doc.id),
    productId: String(doc.productId),
    userId: doc.userId ? String(doc.userId) : null,
    userName: doc.userName,
    name: doc.userName,
    title: doc.title || '',
    rating: doc.rating,
    comment: doc.comment,
    body: doc.comment,
    status: doc.status,
    adminNote: doc.adminNote || '',
    verifiedPurchase: !!doc.userId,
    createdAt: doc.createdAt,
  };
}

function toDtoPopulated(doc) {
  return {
    ...toDto(doc),
    productName: doc.productId?.name || '',
    productImage: doc.productId?.images?.[0] || '',
    productId: String(doc.productId?._id || doc.productId),
  };
}