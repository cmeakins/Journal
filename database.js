const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(path.join(dataDir, 'journal.db'));

// Create users table
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Check if entries table needs migration (add user_id column)
const tableInfo = db.prepare("PRAGMA table_info(entries)").all();
const hasUserId = tableInfo.some(col => col.name === 'user_id');

if (!hasUserId) {
  // Create new entries table with user_id
  db.exec(`
    CREATE TABLE IF NOT EXISTS entries_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      gratitude TEXT DEFAULT '',
      feeling TEXT DEFAULT '',
      on_mind TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, date),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Check if old entries table exists and has data
  const oldTableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='entries'").get();
  if (oldTableExists) {
    // Drop old table (data will be lost since we can't associate with users)
    db.exec('DROP TABLE entries');
  }

  // Rename new table to entries
  db.exec('ALTER TABLE entries_new RENAME TO entries');
} else {
  // Table already has user_id, ensure it exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      gratitude TEXT DEFAULT '',
      feeling TEXT DEFAULT '',
      on_mind TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, date),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
}

// User functions
function createUser(username, passwordHash) {
  const stmt = db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)');
  const result = stmt.run(username, passwordHash);
  return { id: result.lastInsertRowid, username };
}

function getUserByUsername(username) {
  return db.prepare('SELECT * FROM users WHERE username = ?').get(username);
}

// Entry functions (now require userId)
function getEntry(userId, date) {
  return db.prepare('SELECT * FROM entries WHERE user_id = ? AND date = ?').get(userId, date);
}

function upsertEntry(userId, date, gratitude, feeling, onMind) {
  const stmt = db.prepare(`
    INSERT INTO entries (user_id, date, gratitude, feeling, on_mind, updated_at)
    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(user_id, date) DO UPDATE SET
      gratitude = excluded.gratitude,
      feeling = excluded.feeling,
      on_mind = excluded.on_mind,
      updated_at = CURRENT_TIMESTAMP
  `);
  stmt.run(userId, date, gratitude, feeling, onMind);
  return getEntry(userId, date);
}

function getAllEntryDates(userId) {
  return db.prepare('SELECT date FROM entries WHERE user_id = ? ORDER BY date DESC').all(userId);
}

module.exports = { createUser, getUserByUsername, getEntry, upsertEntry, getAllEntryDates };
