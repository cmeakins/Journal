require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;
const SALT_ROUNDS = 10;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'journal-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  }
}));

function requireAuth(req, res, next) {
  if (req.session.userId) {
    next();
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
}

// Auth routes
app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  if (username.length < 3) {
    return res.status(400).json({ error: 'Username must be at least 3 characters' });
  }

  if (password.length < 4) {
    return res.status(400).json({ error: 'Password must be at least 4 characters' });
  }

  try {
    const existing = db.getUserByUsername(username);
    if (existing) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = db.createUser(username, passwordHash);

    req.session.userId = user.id;
    req.session.username = user.username;
    res.json({ success: true, username: user.username });
  } catch (e) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  try {
    const user = db.getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    req.session.userId = user.id;
    req.session.username = user.username;
    res.json({ success: true, username: user.username });
  } catch (e) {
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

app.get('/auth-status', (req, res) => {
  res.json({
    authenticated: !!req.session.userId,
    username: req.session.username || null
  });
});

// API routes
app.get('/api/entry/:date', requireAuth, (req, res) => {
  const entry = db.getEntry(req.session.userId, req.params.date);
  res.json(entry || { date: req.params.date, gratitude: '', feeling: '', on_mind: '' });
});

app.put('/api/entry/:date', requireAuth, (req, res) => {
  const { gratitude, feeling, on_mind } = req.body;
  const entry = db.upsertEntry(req.session.userId, req.params.date, gratitude || '', feeling || '', on_mind || '');
  res.json(entry);
});

app.get('/api/entries', requireAuth, (req, res) => {
  const entries = db.getAllEntryDates(req.session.userId);
  res.json(entries);
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`Journal running at http://localhost:${PORT}`);
});
