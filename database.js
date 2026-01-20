const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(path.join(dataDir, 'journal.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT UNIQUE NOT NULL,
    gratitude TEXT DEFAULT '',
    feeling TEXT DEFAULT '',
    on_mind TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

function getEntry(date) {
  return db.prepare('SELECT * FROM entries WHERE date = ?').get(date);
}

function upsertEntry(date, gratitude, feeling, onMind) {
  const stmt = db.prepare(`
    INSERT INTO entries (date, gratitude, feeling, on_mind, updated_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(date) DO UPDATE SET
      gratitude = excluded.gratitude,
      feeling = excluded.feeling,
      on_mind = excluded.on_mind,
      updated_at = CURRENT_TIMESTAMP
  `);
  stmt.run(date, gratitude, feeling, onMind);
  return getEntry(date);
}

function getAllEntryDates() {
  return db.prepare('SELECT date FROM entries ORDER BY date DESC').all();
}

module.exports = { getEntry, upsertEntry, getAllEntryDates };
