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

// Check if we need to migrate from old schema (with unique constraint on user_id, date)
const tableInfo = db.prepare("PRAGMA table_info(entries)").all();
const hasUserId = tableInfo.some(col => col.name === 'user_id');

if (!hasUserId || tableInfo.length === 0) {
  // Fresh install or old schema without user_id - create new table
  db.exec(`DROP TABLE IF EXISTS entries`);
  db.exec(`
    CREATE TABLE entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      gratitude TEXT DEFAULT '',
      feeling TEXT DEFAULT '',
      on_mind TEXT DEFAULT '',
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_entries_user_date ON entries(user_id, date)`);
} else {
  // Check if old unique constraint exists by trying to find it
  const indexInfo = db.prepare("PRAGMA index_list(entries)").all();
  const hasUniqueConstraint = indexInfo.some(idx => idx.unique === 1 && idx.name.includes('user_id'));

  if (hasUniqueConstraint) {
    // Migrate: recreate table without unique constraint
    db.exec(`
      CREATE TABLE IF NOT EXISTS entries_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        gratitude TEXT DEFAULT '',
        feeling TEXT DEFAULT '',
        on_mind TEXT DEFAULT '',
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
    db.exec(`INSERT INTO entries_new (id, user_id, date, created_at, gratitude, feeling, on_mind)
             SELECT id, user_id, date, created_at, gratitude, feeling, on_mind FROM entries`);
    db.exec(`DROP TABLE entries`);
    db.exec(`ALTER TABLE entries_new RENAME TO entries`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_entries_user_date ON entries(user_id, date)`);
  }
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

// Entry functions
function getEntriesByDate(userId, date) {
  return db.prepare('SELECT * FROM entries WHERE user_id = ? AND date = ? ORDER BY created_at ASC')
    .all(userId, date);
}

function getEntryById(userId, entryId) {
  return db.prepare('SELECT * FROM entries WHERE id = ? AND user_id = ?').get(entryId, userId);
}

function createEntry(userId, date, gratitude, feeling, onMind) {
  const stmt = db.prepare(`
    INSERT INTO entries (user_id, date, gratitude, feeling, on_mind)
    VALUES (?, ?, ?, ?, ?)
  `);
  const result = stmt.run(userId, date, gratitude, feeling, onMind);
  return getEntryById(userId, result.lastInsertRowid);
}

function updateEntry(userId, entryId, gratitude, feeling, onMind) {
  const stmt = db.prepare(`
    UPDATE entries SET gratitude = ?, feeling = ?, on_mind = ?
    WHERE id = ? AND user_id = ?
  `);
  stmt.run(gratitude, feeling, onMind, entryId, userId);
  return getEntryById(userId, entryId);
}

function deleteEntry(userId, entryId) {
  const stmt = db.prepare('DELETE FROM entries WHERE id = ? AND user_id = ?');
  return stmt.run(entryId, userId);
}

function getAllEntryDates(userId) {
  return db.prepare('SELECT DISTINCT date FROM entries WHERE user_id = ? ORDER BY date DESC').all(userId);
}

module.exports = {
  createUser,
  getUserByUsername,
  getEntriesByDate,
  getEntryById,
  createEntry,
  updateEntry,
  deleteEntry,
  getAllEntryDates
};
