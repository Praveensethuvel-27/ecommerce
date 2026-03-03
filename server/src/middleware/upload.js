import multer from 'multer';

// Use memory storage - we'll upload to Cloudinary from the buffer
const storage = multer.memoryStorage();

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
