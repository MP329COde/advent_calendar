import { db } from '../config/db.js';

export function uploadMedia(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'Aucun fichier reçu' });
  }

  const url = `/uploads/${req.file.filename}`;
  const mediaType = req.file.mimetype.startsWith('video/')
    ? 'video'
    : req.file.mimetype.startsWith('audio/')
      ? 'audio'
      : req.file.mimetype.startsWith('image/')
        ? 'image'
        : 'file';

  db.prepare(`
    INSERT INTO media (
      media_type, filename, original_name, mime_type, path, size, uploaded_by
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    mediaType,
    req.file.filename,
    req.file.originalname,
    req.file.mimetype,
    url,
    req.file.size,
    req.user?.id ?? null
  );

  return res.status(201).json({ url, mediaType, size: req.file.size });
}
