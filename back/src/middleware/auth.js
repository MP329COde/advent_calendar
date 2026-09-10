import crypto from 'crypto';
import { db } from '../config/db.js';

export const SESSION_COOKIE = 'session';

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function resolveSessionUser(cookieValue) {
  if (typeof cookieValue !== 'string' || !cookieValue.includes(':')) {
    return null;
  }

  const [sessionId, rawToken] = cookieValue.split(':');

  const session = db
    .prepare(`
      SELECT id, user_id, token_hash, expires_at
      FROM user_sessions
      WHERE id = ?
    `)
    .get(sessionId);

  if (!session || session.expires_at < new Date().toISOString()) {
    return null;
  }

  if (session.token_hash !== hashToken(rawToken)) {
    return null;
  }

  const user = db
    .prepare(`
      SELECT id, name, email, avatar_url, is_active
      FROM users
      WHERE id = ?
    `)
    .get(session.user_id);

  if (!user || !user.is_active) {
    return null;
  }

  const roles = db
    .prepare(`
      SELECT r.name
      FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = ?
    `)
    .all(user.id)
    .map((row) => row.name);

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatar_url,
    roles,
  };
}

export function requireAuth(req, res, next) {
  const user = resolveSessionUser(req.cookies?.[SESSION_COOKIE]);

  if (!user) {
    return res.status(401).json({ error: 'Authentification requise' });
  }

  req.user = user;
  next();
}

export function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (!req.user.roles.includes('admin')) {
      return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
    }
    next();
  });
}
