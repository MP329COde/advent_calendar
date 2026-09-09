import { db } from '../config/db.js';

export function getUsers(req, res) {
  const users = db.prepare('SELECT id, name, created_at FROM users ORDER BY id').all();
  res.json(users);
}

export function getUser(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Id invalide' });
  }

  const user = db.prepare('SELECT id, name, created_at FROM users WHERE id = ?').get(id);
  if (!user) {
    return res.status(404).json({ error: 'Utilisateur introuvable' });
  }

  res.json(user);
}

export function createUser(req, res) {
  const { name } = req.body;
  if (typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ error: 'Nom requis' });
  }

  const { lastInsertRowid } = db
    .prepare('INSERT INTO users (name) VALUES (?)')
    .run(name.trim());

  const user = db.prepare('SELECT id, name, created_at FROM users WHERE id = ?').get(lastInsertRowid);
  res.status(201).json(user);
}
