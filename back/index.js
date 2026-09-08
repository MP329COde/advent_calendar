import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialisation / Connexion à la base SQLite
const db = new Database('database.db');

// Création d'une table d'exemple
db.exec(`
  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
  )
`);

// Routes API
app.get('/api/items', (req, res) => {
  const items = db.prepare('SELECT * FROM items').all();
  res.json(items);
});

app.post('/api/items', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Le nom est requis' });

  const stmt = db.prepare('INSERT INTO items (name) VALUES (?)');
  const info = stmt.run(name);
  res.status(201).json({ id: info.lastInsertRowid, name });
});

app.listen(PORT, () => {
  console.log(`Server back démarré sur http://localhost:${PORT}`);
});