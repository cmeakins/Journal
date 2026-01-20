require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;
const PASSWORD = process.env.PASSWORD || 'journal';

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
  if (req.session.authenticated) {
    next();
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
}

// Auth routes
app.post('/login', (req, res) => {
  const { password } = req.body;
  if (password === PASSWORD) {
    req.session.authenticated = true;
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

app.get('/auth-status', (req, res) => {
  res.json({ authenticated: !!req.session.authenticated });
});

// API routes
app.get('/api/entry/:date', requireAuth, (req, res) => {
  const entry = db.getEntry(req.params.date);
  res.json(entry || { date: req.params.date, gratitude: '', feeling: '', on_mind: '' });
});

app.put('/api/entry/:date', requireAuth, (req, res) => {
  const { gratitude, feeling, on_mind } = req.body;
  const entry = db.upsertEntry(req.params.date, gratitude || '', feeling || '', on_mind || '');
  res.json(entry);
});

app.get('/api/entries', requireAuth, (req, res) => {
  const entries = db.getAllEntryDates();
  res.json(entries);
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`Journal running at http://localhost:${PORT}`);
});
