import { db, getDefaultCalendar } from '../config/db.js';

function serializeDay(row) {
  return {
    id: row.id,
    day: row.day_number,
    title: row.title,
    description: row.description,
    unlockDate: row.unlock_date,
    isEnabled: Boolean(row.is_enabled),
  };
}

export function listAdminDays(req, res) {
  const calendar = getDefaultCalendar();

  if (!calendar) {
    return res.json([]);
  }

  const rows = db
    .prepare(`
      SELECT id, day_number, title, description, unlock_date, is_enabled
      FROM calendar_days
      WHERE calendar_id = ?
      ORDER BY day_number ASC
    `)
    .all(calendar.id);

  return res.json(rows.map(serializeDay));
}

export function updateAdminDay(req, res) {
  const id = Number(req.params.id);
  const day = db.prepare('SELECT * FROM calendar_days WHERE id = ?').get(id);

  if (!day) {
    return res.status(404).json({ error: 'Jour introuvable' });
  }

  const { title, description, unlockDate, isEnabled } = req.body ?? {};

  db.prepare(`
    UPDATE calendar_days
    SET title = COALESCE(?, title),
        description = COALESCE(?, description),
        unlock_date = COALESCE(?, unlock_date),
        is_enabled = COALESCE(?, is_enabled),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    typeof title === 'string' ? title : null,
    typeof description === 'string' ? description : null,
    typeof unlockDate === 'string' ? unlockDate : null,
    typeof isEnabled === 'boolean' ? (isEnabled ? 1 : 0) : null,
    id
  );

  const updated = db.prepare('SELECT * FROM calendar_days WHERE id = ?').get(id);
  return res.json(serializeDay(updated));
}
