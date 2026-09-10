import { db } from '../config/db.js';

function serializeFlag(row) {
  return {
    key: row.key,
    enabled: Boolean(row.enabled),
    description: row.description,
    updatedAt: row.updated_at,
  };
}

export function listFeatureFlags(req, res) {
  const rows = db.prepare('SELECT * FROM feature_flags ORDER BY key ASC').all();
  return res.json(rows.map(serializeFlag));
}

export function updateFeatureFlag(req, res) {
  const key = req.params.key;
  const { enabled } = req.body ?? {};

  if (typeof enabled !== 'boolean') {
    return res.status(400).json({ error: 'Le champ "enabled" doit être un booléen' });
  }

  const result = db
    .prepare('UPDATE feature_flags SET enabled = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?')
    .run(enabled ? 1 : 0, key);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Fonctionnalité introuvable' });
  }

  const updated = db.prepare('SELECT * FROM feature_flags WHERE key = ?').get(key);
  return res.json(serializeFlag(updated));
}
