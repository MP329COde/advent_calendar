import { db } from '../config/db.js';

function isDayUnlocked(day, now = new Date()) {
  const isDecember = now.getMonth() === 11;
  return isDecember && day <= now.getDate();
}

export function getDays(req, res) {
  const rows = db.prepare('SELECT id, title, description FROM days ORDER BY id').all();
  const now = new Date();

  const days = rows.map((row) => {
    const unlocked = isDayUnlocked(row.id, now);
    return {
      day: row.id,
      unlocked,
      title: unlocked ? row.title : null,
      description: unlocked ? row.description : null,
    };
  });

  res.json(days);
}

export function getDay(req, res) {
  const day = Number(req.params.day);
  if (!Number.isInteger(day) || day < 1 || day > 24) {
    return res.status(400).json({ error: 'Jour invalide' });
  }

  const row = db.prepare('SELECT id, title, description FROM days WHERE id = ?').get(day);
  if (!row) {
    return res.status(404).json({ error: 'Jour introuvable' });
  }

  const unlocked = isDayUnlocked(row.id);
  if (!unlocked) {
    return res.status(403).json({ error: 'Ce jour n\'est pas encore débloqué' });
  }

  res.json({ day: row.id, unlocked, title: row.title, description: row.description });
}
