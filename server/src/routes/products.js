import express from 'express';
import slugify from 'slugify';
import { Product } from '../models/Product.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { uploadProductImage } from '../middleware/upload.js';
import { toProductDto } from '../utils/productDto.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';
import { env } from '../config/env.js';
import { triggerRestockNotifications } from './restock.js';

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
  return ['true', '1', 'yes', 'on'].includes(s);
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
  } catch (err) {
    console.error("Weight Parse Error:", err);
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

  return `${base}-${Math.random().toString(36).slice(2, 6)}`;
}

/* ===============================
   PUBLIC ROUTES
================================= */

// GET all products
productsRouter.get('/', async (_req, res) => {
  try {
    const docs = await Product.find({}).sort({ createdAt: -1 }).lean();
    const dtos = docs.map(toProductDto).filter(Boolean);
    res.json(dtos);
  } catch (error) {
    console.error("GET /products ERROR:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET product by slug
productsRouter.get('/:slug', async (req, res) => {
  try {
    const doc = await Product.findOne({ slug: req.params.slug }).lean();
    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.json(toProductDto(doc));
  } catch (error) {
    console.error("GET /products/:slug ERROR:", error);
    res.status(500).json({ error: error.message });
  }
});

/* ===============================
   ADMIN ROUTES
================================= */

// CREATE product
productsRouter.post(
  '/',
  requireAuth,
  requireAdmin,
  uploadProductImage.array('images', 4),
  async (req, res) => {
    try {
      const { name, description, categoryId } = req.body || {};
      if (!name || !description || !categoryId) {
        return res.status(400).json({ error: 'name, description, categoryId required' });
      }

      const slug = await uniqueSlugFromName(name);
      const imageUrls = [];
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          if (env.cloudinaryCloudName) {
            const url = await uploadToCloudinary(file.buffer);
            imageUrls.push(url);
          } else {
            const { writeFileToDisk } = await import('../utils/localUpload.js');
            const url = await writeFileToDisk(file);
            imageUrls.push(url);
          }
        }
      }

      const weightOptions = parseWeightOptions(req.body?.weightOptions);
      if (!weightOptions.length) {
        return res.status(400).json({ error: 'At least one weight option required' });
      }

      const product = await Product.create({
        name: name.trim(),
        slug,
        categoryId: categoryId.trim(),
        price: weightOptions[0].price,
        originalPrice: toNumber(req.body?.originalPrice),
        description,
        stock: Math.max(0, toNumber(req.body?.stock, 0)),
        featured: toBool(req.body?.featured, false),
        images: imageUrls,
        weightOptions,
      });

      req.app.get('io')?.emit('products:changed', { type: 'created' });

      res.status(201).json(toProductDto(product));
    } catch (error) {
      console.error("POST /products ERROR:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

// UPDATE product
productsRouter.put(
  '/:id',
  requireAuth,
  requireAdmin,
  uploadProductImage.array('images', 4),
  async (req, res) => {
    try {
      const existing = await Product.findById(req.params.id);
      if (!existing) return res.status(404).json({ error: 'Not found' });

      const patch = {};
      if (req.body?.name) {
        patch.name = req.body.name.trim();
        patch.slug = await uniqueSlugFromName(patch.name, existing._id);
      }

      if (req.body?.description) patch.description = req.body.description;
      if (req.body?.categoryId) patch.categoryId = req.body.categoryId.trim();
      if (req.body?.stock !== undefined) patch.stock = Math.max(0, toNumber(req.body.stock, 0));
      if (req.body?.featured !== undefined) patch.featured = toBool(req.body.featured);

      if (req.body?.weightOptions) {
        const weightOptions = parseWeightOptions(req.body.weightOptions);
        if (!weightOptions.length) {
          return res.status(400).json({ error: 'At least one weight option required' });
        }
        patch.weightOptions = weightOptions;
        patch.price = weightOptions[0].price;
      }

      if (req.files && req.files.length > 0) {
        const imageUrls = [];
        for (const file of req.files) {
          if (env.cloudinaryCloudName) {
            const url = await uploadToCloudinary(file.buffer);
            imageUrls.push(url);
          } else {
            const { writeFileToDisk } = await import('../utils/localUpload.js');
            const url = await writeFileToDisk(file);
            imageUrls.push(url);
          }
        }
        patch.images = imageUrls;
      }

      const prevStock = existing.stock || 0;
      const updated = await Product.findByIdAndUpdate(req.params.id, patch, { new: true });

      req.app.get('io')?.emit('products:changed', { type: 'updated' });

      // Auto-trigger restock emails if stock was 0 and now > 0
      const newStock = patch.stock !== undefined ? patch.stock : prevStock;
      if (prevStock === 0 && newStock > 0) {
        triggerRestockNotifications(req.params.id, req.app.get('io')).catch((err) => {
          console.error('Restock notification error:', err);
        });
      }

      res.json(toProductDto(updated));
    } catch (error) {
      console.error("PUT /products ERROR:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

// DELETE product
productsRouter.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Not found' });

    req.app.get('io')?.emit('products:changed', { type: 'deleted' });

    res.json({ ok: true });
  } catch (error) {
    console.error("DELETE /products ERROR:", error);
    res.status(500).json({ error: error.message });
  }
});