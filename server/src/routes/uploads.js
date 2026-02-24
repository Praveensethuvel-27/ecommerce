import express from 'express';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { uploadProductImage } from '../middleware/upload.js';

export const uploadsRouter = express.Router();

// Admin-only: upload a product image and return the URL/path to store in MongoDB.
uploadsRouter.post(
  '/product-image',
  requireAuth,
  requireAdmin,
  uploadProductImage.single('image'),
  (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Image is required' });
    const url = `/uploads/products/${req.file.filename}`;
    return res.json({ url });
  }
);

