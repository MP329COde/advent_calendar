import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { db } from '../config/db.js';
import { SESSION_COOKIE, hashToken, resolveSessionUser } from '../middleware/auth.js';

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS_WINDOW_MS = 15 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 10;

const loginAttempts = new Map();

function isRateLimited(key) {
  const now = Date.now();
  const attempts = (loginAttempts.get(key) ?? []).filter(
    (timestamp) => now - timestamp < MAX_LOGIN_ATTEMPTS_WINDOW_MS
  );
  attempts.push(now);
  loginAttempts.set(key, attempts);
  return attempts.length > MAX_LOGIN_ATTEMPTS;
}

function issueSession(userId, req) {
  const id = crypto.randomUUID();
  const rawToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();

  db.prepare(`
    INSERT INTO user_sessions (id, user_id, token_hash, ip_address, user_agent, expires_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, userId, hashToken(rawToken), req.ip, req.headers['user-agent'] ?? null, expiresAt);

  return `${id}:${rawToken}`;
}

function setSessionCookie(res, value) {
  res.cookie(SESSION_COOKIE, value, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_DURATION_MS,
    path: '/',
  });
}

function serializeUser(user) {
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

export function login(req, res) {
  const { email, password } = req.body ?? {};

  if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
    return res.status(400).json({ error: 'Email et mot de passe requis' });
  }

  if (isRateLimited(email.trim().toLowerCase())) {
    return res.status(429).json({ error: 'Trop de tentatives, réessayez plus tard' });
  }

  const user = db
    .prepare('SELECT * FROM users WHERE email = ? AND is_active = 1')
    .get(email.trim().toLowerCase());

  if (!user || !user.password_hash || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Identifiants invalides' });
  }

  const cookieValue = issueSession(user.id, req);
  setSessionCookie(res, cookieValue);

  db.prepare('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);

  return res.json(serializeUser(user));
}

export function logout(req, res) {
  const cookieValue = req.cookies?.[SESSION_COOKIE];

  if (cookieValue?.includes(':')) {
    const [sessionId] = cookieValue.split(':');
    db.prepare('DELETE FROM user_sessions WHERE id = ?').run(sessionId);
  }

  res.clearCookie(SESSION_COOKIE, { path: '/' });
  res.status(204).end();
}

export function me(req, res) {
  const user = resolveSessionUser(req.cookies?.[SESSION_COOKIE]);

  if (!user) {
    return res.json(null);
  }

  return res.json(user);
}
