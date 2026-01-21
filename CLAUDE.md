# Journal App

A simple self-hosted journaling web app with multi-user support.

## Tech Stack
- **Backend**: Node.js + Express
- **Database**: SQLite (stored in `data/journal.db`)
- **Frontend**: Vanilla HTML/CSS/JS
- **Auth**: bcrypt for password hashing

## Project Structure
```
server.js       - Express server, routes, auth
database.js     - SQLite setup and queries (users + entries tables)
public/
  index.html    - Single page app with modal editor
  style.css     - Responsive styles (supports dark mode)
  app.js        - Frontend logic
```

## Running Locally
```bash
npm install
npm start
```
Opens at http://localhost:3000

## Configuration
Edit `.env` file:
- `SESSION_SECRET` - Session encryption key
- `PORT` - Server port (default: 3000)

## Database Schema
- **users**: `id`, `username` (unique), `password_hash`, `created_at`
- **entries**: `id`, `user_id`, `date`, `created_at`, `gratitude`, `feeling`, `on_mind`
  - Multiple entries per day allowed (timestamped)
  - Indexed on `(user_id, date)`

## Daily Entry Template
Each journal entry has three sections:
1. Gratitude
2. How am I feeling
3. What's on my mind

## Key Features
- Multi-user accounts (register/login with username + password)
- Private entries per user
- Multiple entries per day with timestamps
- Auto-save as you type
- Date navigation (prev/next buttons, date picker)
- Modal editor for entries
- Delete entries
- Mobile-friendly responsive design
- Dark mode support

## API Endpoints
- `POST /register` - Create new account (username, password)
- `POST /login` - Login (username, password)
- `GET /logout` - Logout
- `GET /auth-status` - Check auth status and get username
- `GET /api/entries/:date` - Get all entries for a date (auth required)
- `POST /api/entry` - Create new entry (date, gratitude, feeling, on_mind)
- `PUT /api/entry/:id` - Update entry by id (auth required)
- `DELETE /api/entry/:id` - Delete entry by id (auth required)
- `GET /api/entries` - Get all dates that have entries (auth required)
