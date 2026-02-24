import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Always resolve relative to the server folder (not the shell cwd)
const productsDir = path.resolve(__dirname, '../../uploads/products');

function ensureProductsDir() {
  fs.mkdirSync(productsDir, { recursive: true });
}

function extFromMime(mime) {
  if (mime === 'image/jpeg') return '.jpg';
  if (mime === 'image/png') return '.png';
  if (mime === 'image/webp') return '.webp';
  return '';
}

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    try {
      ensureProductsDir();
      cb(null, productsDir);
    } catch (err) {
      cb(err);
    }
  },
  filename(_req, file, cb) {
    const safeBase = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname) || extFromMime(file.mimetype) || '';
    cb(null, `${safeBase}${ext.toLowerCase()}`);
  },
});

function fileFilter(_req, file, cb) {
  const allowed = new Set(['image/jpeg', 'image/png', 'image/webp']);
  if (!allowed.has(file.mimetype)) {
    cb(new Error('Only JPEG, PNG, and WEBP images are allowed'));
    return;
  }
  cb(null, true);
}

export const uploadProductImage = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

