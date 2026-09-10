import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { requireAdmin } from '../middleware/auth.js';
import { uploadMedia } from '../controllers/mediaController.js';

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.env.DATA_DIR || 'data', 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/svg+xml',
  'image/gif',
  'image/x-icon',
  'video/mp4',
  'video/webm',
]);

const VIDEO_MIME_TYPES = new Set(['video/mp4', 'video/webm']);
const IMAGE_MAX_SIZE = 5 * 1024 * 1024;
const VIDEO_MAX_SIZE = 50 * 1024 * 1024;

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: VIDEO_MAX_SIZE },
  fileFilter(req, file, cb) {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return cb(new Error('Type de fichier non autorisé'));
    }
    cb(null, true);
  },
});

function enforceSizeByType(req, res, next) {
  if (!req.file) return next();
  const maxSize = VIDEO_MIME_TYPES.has(req.file.mimetype) ? VIDEO_MAX_SIZE : IMAGE_MAX_SIZE;
  if (req.file.size > maxSize) {
    fs.unlink(req.file.path, () => {});
    return res.status(400).json({ error: 'Fichier trop volumineux' });
  }
  next();
}

const router = Router();

router.post('/upload', requireAdmin, upload.single('file'), enforceSizeByType, uploadMedia, (error, req, res, _next) => {
  return res.status(400).json({ error: error.message || 'Échec de l’import du fichier' });
});

export default router;
