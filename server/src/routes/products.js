import express from 'express';
import slugify from 'slugify';
import { Product } from '../models/Product.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { uploadProductImage } from '../middleware/upload.js';
import { toProductDto } from '../utils/productDto.js';

export const productsRouter = express.Router();

function toNumber(v, fallback = undefined) {
  if (v === undefined || v === null || v === '') return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function toBool(v, fallback = false) {
  if (v === undefined || v === null || v === '') return fallback;
  if (typeof v === 'boolean') return v;
  const s = String(v).toLowerCase();
  return s === 'true' || s === '1' || s === 'yes' || s === 'on';
}

function parseWeightOptions(val) {
  if (!val) return [];
  try {
    const arr = typeof val === 'string' ? JSON.parse(val) : val;
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((x) => x && (x.weight != null || x.price != null))
      .map((x) => ({
        weight: String(x.weight ?? '').trim() || 'Default',
        price: toNumber(x.price, 0),
      }))
      .filter((x) => x.price >= 0);
  } catch {
    return [];
  }
}

async function uniqueSlugFromName(name, excludeId) {
  const base = slugify(String(name), { lower: true, strict: true, trim: true });
  if (!base) return `${Date.now()}`;

  const existsQuery = { slug: base };
  if (excludeId) existsQuery._id = { $ne: excludeId };
  const exists = await Product.exists(existsQuery);
  if (!exists) return base;

  // Append a short suffix if base is taken
  const suffix = Math.random().toString(36).slice(2, 6);
  const candidate = `${base}-${suffix}`;
  const exists2Query = { slug: candidate };
  if (excludeId) exists2Query._id = { $ne: excludeId };
  const exists2 = await Product.exists(exists2Query);
  return exists2 ? `${candidate}-${Date.now()}` : candidate;
}

// Public: list products
productsRouter.get('/', async (_req, res) => {
  const docs = await Product.find({}).sort({ createdAt: -1 }).lean();
  const dtos = docs.map(toProductDto).filter(Boolean);
  return res.json(dtos);
});

// Public: product detail by slug
productsRouter.get('/:slug', async (req, res) => {
  const doc = await Product.findOne({ slug: req.params.slug }).lean();
  if (!doc) return res.status(404).json({ error: 'Not found' });
  return res.json(toProductDto(doc));
});

// Admin: create product (multipart/form-data supported, optional `image` file)
productsRouter.post(
  '/',
  requireAuth,
  requireAdmin,
  uploadProductImage.single('image'),
  async (req, res) => {
    const { name, description, categoryId } = req.body || {};
    if (!name || !description || !categoryId) {
      return res.status(400).json({ error: 'name, description, categoryId are required' });
    }

    const slug = await uniqueSlugFromName(name);
    const imageUrl = req.file ? `/uploads/products/${req.file.filename}` : undefined;

    const weightOptions = parseWeightOptions(req.body?.weightOptions);
    if (!weightOptions.length) {
      return res.status(400).json({ error: 'At least one weight option (weight + price) is required' });
    }
    const price = weightOptions[0].price;

    const product = await Product.create({
      name: String(name).trim(),
      slug,
      categoryId: String(categoryId).trim(),
      price,
      originalPrice: toNumber(req.body?.originalPrice),
      description: String(description),
      stock: toNumber(req.body?.stock, 0),
      featured: toBool(req.body?.featured, false),
      images: imageUrl ? [imageUrl] : [],
      weightOptions,
    });

    req.app.get('io')?.emit('products:changed', { type: 'created', id: String(product._id) });
    return res.status(201).json(toProductDto(product));
  }
);

// Admin: update product (multipart/form-data supported, optional `image` file)
productsRouter.put(
  '/:id',
  requireAuth,
  requireAdmin,
  uploadProductImage.single('image'),
  async (req, res) => {
    const { id } = req.params;
    const existing = await Product.findById(id);
    if (!existing) return res.status(404).json({ error: 'Not found' });

    const patch = {};
    if (req.body?.name !== undefined && req.body?.name !== '') {
      patch.name = String(req.body.name).trim();
      patch.slug = await uniqueSlugFromName(patch.name, existing._id);
    }
    if (req.body?.description !== undefined) patch.description = String(req.body.description);
    if (req.body?.categoryId !== undefined && req.body?.categoryId !== '') patch.categoryId = String(req.body.categoryId).trim();
    if (req.body?.originalPrice !== undefined) patch.originalPrice = toNumber(req.body.originalPrice);
    if (req.body?.stock !== undefined) patch.stock = toNumber(req.body.stock, existing.stock);
    if (req.body?.featured !== undefined) patch.featured = toBool(req.body.featured, existing.featured);
    if (req.body?.weightOptions !== undefined) {
      const weightOptions = parseWeightOptions(req.body.weightOptions);
      if (weightOptions.length === 0) {
        return res.status(400).json({ error: 'At least one weight option (weight + price) is required' });
      }
      patch.weightOptions = weightOptions;
      patch.price = weightOptions[0].price;
    }

    if (req.file) {
      const imageUrl = `/uploads/products/${req.file.filename}`;
      patch.images = [imageUrl];
    }

    const updated = await Product.findByIdAndUpdate(id, patch, { new: true });
    req.app.get('io')?.emit('products:changed', { type: 'updated', id: String(updated?._id || id) });
    return res.json(toProductDto(updated));
  }
);

// Admin: delete product
productsRouter.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const deleted = await Product.findByIdAndDelete(id);
  if (!deleted) return res.status(404).json({ error: 'Not found' });
  req.app.get('io')?.emit('products:changed', { type: 'deleted', id });
  return res.json({ ok: true });
});

