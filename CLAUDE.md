# Journal App

A simple self-hosted journaling web app.

## Tech Stack
- **Backend**: Node.js + Express
- **Database**: SQLite (stored in `data/journal.db`)
- **Frontend**: Vanilla HTML/CSS/JS

## Project Structure
```
server.js       - Express server, routes, auth
database.js     - SQLite setup and queries
public/
  index.html    - Single page app
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
- `PASSWORD` - Login password (default: "journal")
- `SESSION_SECRET` - Session encryption key
- `PORT` - Server port (default: 3000)

## Daily Entry Template
Each journal entry has three sections:
1. Gratitude
2. How am I feeling
3. What's on my mind

## Key Features
- Auto-save as you type
- Date navigation (prev/next buttons, date picker)
- Mobile-friendly responsive design
- Simple password authentication
