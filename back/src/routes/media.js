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
]);

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
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return cb(new Error('Type de fichier non autorisé'));
    }
    cb(null, true);
  },
});

const router = Router();

router.post('/upload', requireAdmin, upload.single('file'), uploadMedia, (error, req, res, _next) => {
  return res.status(400).json({ error: error.message || 'Échec de l’import du fichier' });
});

export default router;
