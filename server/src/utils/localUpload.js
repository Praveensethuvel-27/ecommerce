// Local dev fallback: save multer memoryStorage buffer to disk
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const productsDir = path.resolve(__dirname, '../../uploads/products');

export async function writeFileToDisk(file) {
  fs.mkdirSync(productsDir, { recursive: true });
  const safeBase = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
  const filename = `${safeBase}${ext}`;
  fs.writeFileSync(path.join(productsDir, filename), file.buffer);
  return `/uploads/products/${filename}`;
}
