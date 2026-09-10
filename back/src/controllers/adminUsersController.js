import { db } from '../config/db.js';

function serializeUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    isActive: Boolean(row.is_active),
    lastLoginAt: row.last_login_at,
    createdAt: row.created_at,
    roles: row.roles ? row.roles.split(',') : [],
  };
}

export function listUsers(req, res) {
  const rows = db
    .prepare(`
      SELECT
        u.id, u.name, u.email, u.is_active, u.last_login_at, u.created_at,
        GROUP_CONCAT(r.name) AS roles
      FROM users u
      LEFT JOIN user_roles ur ON ur.user_id = u.id
      LEFT JOIN roles r ON r.id = ur.role_id
      GROUP BY u.id
      ORDER BY u.created_at ASC
    `)
    .all();

  return res.json(rows.map(serializeUser));
}

export function updateUser(req, res) {
  const id = Number(req.params.id);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);

  if (!user) {
    return res.status(404).json({ error: 'Utilisateur introuvable' });
  }

  const { isActive, role } = req.body ?? {};

  const applyUpdate = db.transaction(() => {
    if (typeof isActive === 'boolean') {
      if (user.id === req.user.id && !isActive) {
        throw new Error('SELF_DEACTIVATE');
      }
      db.prepare('UPDATE users SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(isActive ? 1 : 0, id);
    }

    if (typeof role === 'string') {
      const roleRow = db.prepare('SELECT id FROM roles WHERE name = ?').get(role);
      const org = db.prepare('SELECT id FROM organizations WHERE slug = ?').get('default');

      if (!roleRow || !org) {
        throw new Error('INVALID_ROLE');
      }

      if (user.id === req.user.id && role !== 'admin') {
        throw new Error('SELF_DEMOTE');
      }

      db.prepare('DELETE FROM user_roles WHERE user_id = ? AND organization_id = ?')
        .run(id, org.id);
      db.prepare('INSERT INTO user_roles (user_id, role_id, organization_id) VALUES (?, ?, ?)')
        .run(id, roleRow.id, org.id);
    }
  });

  try {
    applyUpdate();
  } catch (error) {
    if (error.message === 'SELF_DEACTIVATE') {
      return res.status(400).json({ error: 'Impossible de désactiver votre propre compte' });
    }
    if (error.message === 'SELF_DEMOTE') {
      return res.status(400).json({ error: 'Impossible de retirer votre propre rôle administrateur' });
    }
    if (error.message === 'INVALID_ROLE') {
      return res.status(400).json({ error: 'Rôle invalide' });
    }
    throw error;
  }

  const updated = db
    .prepare(`
      SELECT
        u.id, u.name, u.email, u.is_active, u.last_login_at, u.created_at,
        GROUP_CONCAT(r.name) AS roles
      FROM users u
      LEFT JOIN user_roles ur ON ur.user_id = u.id
      LEFT JOIN roles r ON r.id = ur.role_id
      WHERE u.id = ?
      GROUP BY u.id
    `)
    .get(id);

  return res.json(serializeUser(updated));
}

export function deleteUser(req, res) {
  const id = Number(req.params.id);

  if (id === req.user.id) {
    return res.status(400).json({ error: 'Impossible de supprimer votre propre compte' });
  }

  const result = db.prepare('DELETE FROM users WHERE id = ?').run(id);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Utilisateur introuvable' });
  }

  return res.status(204).end();
}
