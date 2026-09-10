import { db, getDefaultCalendar } from '../config/db.js';

function parseConfig(raw) {
  try {
    return JSON.parse(raw) ?? {};
  } catch {
    return {};
  }
}

function serializeTheme(theme) {
  return {
    id: theme.id,
    name: theme.name,
    slug: theme.slug,
    description: theme.description,
    isDefault: Boolean(theme.is_default),
    isActive: Boolean(theme.is_active),
    config: parseConfig(theme.config),
    updatedAt: theme.updated_at,
  };
}

export function listThemes(req, res) {
  const includeInactive = req.query.all === '1';

  const rows = db
    .prepare(`
      SELECT *
      FROM themes
      ${includeInactive ? '' : 'WHERE is_active = 1'}
      ORDER BY is_default DESC, name ASC
    `)
    .all();

  return res.json(rows.map(serializeTheme));
}

export function getActiveTheme(req, res) {
  const calendar = getDefaultCalendar();

  const theme = calendar?.theme_id
    ? db.prepare('SELECT * FROM themes WHERE id = ?').get(calendar.theme_id)
    : db.prepare('SELECT * FROM themes WHERE is_default = 1').get();

  if (!theme) {
    return res.status(404).json({ error: 'Aucun thème actif' });
  }

  return res.json(serializeTheme(theme));
}

export function getTheme(req, res) {
  const theme = db.prepare('SELECT * FROM themes WHERE id = ?').get(Number(req.params.id));

  if (!theme) {
    return res.status(404).json({ error: 'Thème introuvable' });
  }

  return res.json(serializeTheme(theme));
}

function slugify(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function createTheme(req, res) {
  const { name, description = '', config = {} } = req.body ?? {};

  if (typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ error: 'Le nom du thème est requis' });
  }

  let slug = slugify(name);
  if (!slug) {
    return res.status(400).json({ error: 'Nom de thème invalide' });
  }

  const existing = db.prepare('SELECT id FROM themes WHERE slug = ?').get(slug);
  if (existing) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  const { lastInsertRowid } = db
    .prepare(`
      INSERT INTO themes (name, slug, description, config, is_default, is_active)
      VALUES (?, ?, ?, ?, 0, 1)
    `)
    .run(name.trim(), slug, description, JSON.stringify(config));

  const theme = db.prepare('SELECT * FROM themes WHERE id = ?').get(lastInsertRowid);
  return res.status(201).json(serializeTheme(theme));
}

export function updateTheme(req, res) {
  const id = Number(req.params.id);
  const theme = db.prepare('SELECT * FROM themes WHERE id = ?').get(id);

  if (!theme) {
    return res.status(404).json({ error: 'Thème introuvable' });
  }

  const { name, description, config, isActive } = req.body ?? {};

  db.prepare(`
    UPDATE themes
    SET name = COALESCE(?, name),
        description = COALESCE(?, description),
        config = COALESCE(?, config),
        is_active = COALESCE(?, is_active),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    typeof name === 'string' && name.trim() !== '' ? name.trim() : null,
    typeof description === 'string' ? description : null,
    config && typeof config === 'object' ? JSON.stringify(config) : null,
    typeof isActive === 'boolean' ? (isActive ? 1 : 0) : null,
    id
  );

  const updated = db.prepare('SELECT * FROM themes WHERE id = ?').get(id);
  return res.json(serializeTheme(updated));
}

export function deleteTheme(req, res) {
  const id = Number(req.params.id);
  const theme = db.prepare('SELECT * FROM themes WHERE id = ?').get(id);

  if (!theme) {
    return res.status(404).json({ error: 'Thème introuvable' });
  }

  if (theme.is_default) {
    return res.status(400).json({ error: 'Impossible de supprimer le thème par défaut' });
  }

  db.prepare('UPDATE calendars SET theme_id = NULL WHERE theme_id = ?').run(id);
  db.prepare('DELETE FROM themes WHERE id = ?').run(id);

  return res.status(204).end();
}

export function activateTheme(req, res) {
  const id = Number(req.params.id);
  const theme = db.prepare('SELECT * FROM themes WHERE id = ? AND is_active = 1').get(id);

  if (!theme) {
    return res.status(404).json({ error: 'Thème introuvable ou inactif' });
  }

  const calendar = getDefaultCalendar();

  const applyTheme = db.transaction(() => {
    db.prepare('UPDATE themes SET is_default = 0 WHERE is_default = 1');
    db.prepare('UPDATE themes SET is_default = 1 WHERE id = ?').run(id);

    if (calendar) {
      db.prepare(`
        UPDATE calendars
        SET theme_id = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(id, calendar.id);

      const colors = parseConfig(theme.config).colors ?? {};

      db.prepare(`
        UPDATE calendar_themes
        SET primary_color = COALESCE(?, primary_color),
            secondary_color = COALESCE(?, secondary_color),
            accent_color = COALESCE(?, accent_color),
            background_color = COALESCE(?, background_color),
            text_color = COALESCE(?, text_color),
            muted_text_color = COALESCE(?, muted_text_color),
            updated_at = CURRENT_TIMESTAMP
        WHERE calendar_id = ?
      `).run(
        colors.primary ?? null,
        colors.secondary ?? null,
        colors.accent ?? null,
        colors.background ?? null,
        colors.text ?? null,
        colors.muted ?? null,
        calendar.id
      );
    }
  });

  applyTheme();

  const updated = db.prepare('SELECT * FROM themes WHERE id = ?').get(id);
  return res.json(serializeTheme(updated));
}
