import { db, getDefaultCalendar } from '../config/db.js';

function parseSettings(raw) {
  try {
    const parsed = JSON.parse(raw || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function serializeDay(row) {
  const settings = parseSettings(row.settings);

  return {
    id: row.id,
    day: row.day_number,
    title: row.title,
    description: row.description,
    unlockDate: row.unlock_date,
    isEnabled: Boolean(row.is_enabled),
    imageUrl: settings.imageUrl ?? null,
    audioUrl: settings.audioUrl ?? null,
  };
}

export function listAdminDays(req, res) {
  const calendar = getDefaultCalendar();

  if (!calendar) {
    return res.json([]);
  }

  const rows = db
    .prepare(`
      SELECT id, day_number, title, description, unlock_date, is_enabled, settings
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

  const { title, description, unlockDate, isEnabled, imageUrl, audioUrl } = req.body ?? {};

  const currentSettings = parseSettings(day.settings);
  const nextSettings = { ...currentSettings };
  if (typeof imageUrl === 'string' || imageUrl === null) nextSettings.imageUrl = imageUrl || undefined;
  if (typeof audioUrl === 'string' || audioUrl === null) nextSettings.audioUrl = audioUrl || undefined;
  const settingsChanged = imageUrl !== undefined || audioUrl !== undefined;

  db.prepare(`
    UPDATE calendar_days
    SET title = COALESCE(?, title),
        description = COALESCE(?, description),
        unlock_date = COALESCE(?, unlock_date),
        is_enabled = COALESCE(?, is_enabled),
        settings = COALESCE(?, settings),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    typeof title === 'string' ? title : null,
    typeof description === 'string' ? description : null,
    typeof unlockDate === 'string' ? unlockDate : null,
    typeof isEnabled === 'boolean' ? (isEnabled ? 1 : 0) : null,
    settingsChanged ? JSON.stringify(nextSettings) : null,
    id
  );

  const updated = db.prepare('SELECT * FROM calendar_days WHERE id = ?').get(id);
  return res.json(serializeDay(updated));
}
