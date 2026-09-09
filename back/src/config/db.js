import Database from 'better-sqlite3';
import fs from 'fs';

const DATA_DIR = process.env.DATA_DIR || 'data';
fs.mkdirSync(DATA_DIR, { recursive: true });

export const db = new Database(`${DATA_DIR}/database.db`);

db.exec(`
  CREATE TABLE IF NOT EXISTS days (
    id INTEGER PRIMARY KEY CHECK (id BETWEEN 1 AND 24),
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT ''
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS user_days (
    user_id INTEGER NOT NULL,
    day_id INTEGER NOT NULL,
    PRIMARY KEY (user_id, day_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (day_id) REFERENCES days(id) ON DELETE CASCADE
  )
`);

const count = db.prepare('SELECT COUNT(*) AS count FROM days').get().count;
if (count === 0) {
  const insert = db.prepare(
    'INSERT INTO days (id, title, description) VALUES (?, ?, ?)'
  );
  const seed = db.transaction(() => {
    for (let day = 1; day <= 24; day += 1) {
      insert.run(day, `Défi du jour ${day}`, '');
    }
  });
  seed();
}
