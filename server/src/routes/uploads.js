import express from 'express';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { uploadProductImage } from '../middleware/upload.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';
import { env } from '../config/env.js';

export const uploadsRouter = express.Router();

// Admin-only: upload a product image and return the URL to store in MongoDB.
uploadsRouter.post(
  '/product-image',
  requireAuth,
  requireAdmin,
  uploadProductImage.single('image'),
  async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Image is required' });
    try {
      let url;
      if (env.cloudinaryCloudName) {
        url = await uploadToCloudinary(req.file.buffer);
      } else {
        const { writeFileToDisk } = await import('../utils/localUpload.js');
        url = await writeFileToDisk(req.file);
      }
      return res.json({ url });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
);
