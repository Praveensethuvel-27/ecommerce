import express from 'express';
import { Offer } from '../models/Offer.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

export const offersRouter = express.Router();

// ── Public: GET all active offers (for website banner + app) ──────────────────
offersRouter.get('/', async (_req, res) => {
  try {
    const now = new Date();
    const offers = await Offer.find({
      active: true,
      endDate: { $gte: now },
    })
      .sort({ createdAt: -1 })
      .lean();

    const result = offers.map(toOfferDto);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: err?.message || 'Failed to fetch offers' });
  }
});

// ── Admin: GET all offers (active + inactive) ─────────────────────────────────
offersRouter.get('/admin', requireAuth, requireAdmin, async (_req, res) => {
  try {
    const offers = await Offer.find().sort({ createdAt: -1 }).lean();
    return res.json(offers.map(toOfferDto));
  } catch (err) {
    return res.status(500).json({ error: err?.message || 'Failed to fetch offers' });
  }
});

// ── Admin: CREATE offer ───────────────────────────────────────────────────────
offersRouter.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const {
      title,
      productName,
      discountPercent,
      description,
      startDate,
      endDate,
      showOn,
      bannerImageName,
      active,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }
    if (!discountPercent || Number(discountPercent) < 1 || Number(discountPercent) > 99) {
      return res.status(400).json({ error: 'Discount must be between 1 and 99' });
    }
    if (!endDate) {
      return res.status(400).json({ error: 'End date is required' });
    }

    const offer = await Offer.create({
      title: title.trim(),
      productName: productName?.trim() || '',
      discountPercent: Number(discountPercent),
      description: description?.trim() || '',
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: new Date(endDate),
      showOn: Array.isArray(showOn) && showOn.length > 0 ? showOn : ['website', 'app'],
      bannerImageName: bannerImageName?.trim() || '',
      active: active !== false,
    });

    return res.status(201).json(toOfferDto(offer.toObject()));
  } catch (err) {
    return res.status(400).json({ error: err?.message || 'Failed to create offer' });
  }
});

// ── Admin: UPDATE offer ───────────────────────────────────────────────────────
offersRouter.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const {
      title,
      productName,
      discountPercent,
      description,
      startDate,
      endDate,
      showOn,
      bannerImageName,
      active,
    } = req.body;

    const update = {};
    if (title !== undefined) update.title = title.trim();
    if (productName !== undefined) update.productName = productName.trim();
    if (discountPercent !== undefined) update.discountPercent = Number(discountPercent);
    if (description !== undefined) update.description = description.trim();
    if (startDate !== undefined) update.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined) update.endDate = new Date(endDate);
    if (showOn !== undefined) update.showOn = showOn;
    if (bannerImageName !== undefined) update.bannerImageName = bannerImageName.trim();
    if (active !== undefined) update.active = active;

    const offer = await Offer.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true, runValidators: true }
    ).lean();

    if (!offer) return res.status(404).json({ error: 'Offer not found' });
    return res.json(toOfferDto(offer));
  } catch (err) {
    return res.status(400).json({ error: err?.message || 'Failed to update offer' });
  }
});

// ── Admin: TOGGLE active ──────────────────────────────────────────────────────
offersRouter.patch('/:id/toggle', requireAuth, requireAdmin, async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id).lean();
    if (!offer) return res.status(404).json({ error: 'Offer not found' });

    const updated = await Offer.findByIdAndUpdate(
      req.params.id,
      { $set: { active: !offer.active } },
      { new: true }
    ).lean();

    return res.json(toOfferDto(updated));
  } catch (err) {
    return res.status(400).json({ error: err?.message || 'Failed to toggle offer' });
  }
});

// ── Admin: DELETE offer ───────────────────────────────────────────────────────
offersRouter.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const offer = await Offer.findByIdAndDelete(req.params.id).lean();
    if (!offer) return res.status(404).json({ error: 'Offer not found' });
    return res.json({ success: true });
  } catch (err) {
    return res.status(400).json({ error: err?.message || 'Failed to delete offer' });
  }
});

// ── DTO ───────────────────────────────────────────────────────────────────────
function toOfferDto(doc) {
  if (!doc) return null;
  return {
    id: String(doc._id ?? doc.id),
    title: doc.title,
    productName: doc.productName || '',
    discountPercent: doc.discountPercent,
    description: doc.description || '',
    startDate: doc.startDate ? doc.startDate.toISOString() : null,
    endDate: doc.endDate ? doc.endDate.toISOString() : null,
    showOn: doc.showOn || ['website', 'app'],
    bannerImageName: doc.bannerImageName || '',
    active: doc.active !== false,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}