import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Database from "better-sqlite3";

const app = express();
const PORT = 3000;

// Initialize SQLite Database
const db = new Database('apples-to-apricots.db');
db.pragma('journal_mode = WAL');

// Create tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS players (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    points INTEGER DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS unlocked_decks (
    player_id TEXT NOT NULL,
    deck_id TEXT NOT NULL,
    PRIMARY KEY (player_id, deck_id),
    FOREIGN KEY (player_id) REFERENCES players(id)
  );
  CREATE TABLE IF NOT EXISTS friends (
    player_id TEXT NOT NULL,
    friend_id TEXT NOT NULL,
    PRIMARY KEY (player_id, friend_id),
    FOREIGN KEY (player_id) REFERENCES players(id),
    FOREIGN KEY (friend_id) REFERENCES players(id)
  );
  CREATE TABLE IF NOT EXISTS daily_spins (
    player_id TEXT PRIMARY KEY,
    last_spin_date TEXT NOT NULL,
    FOREIGN KEY (player_id) REFERENCES players(id)
  );
`);

// Friends API - Add a friend
app.post('/api/players/:playerId/friends', (req, res) => {
  const { playerId } = req.params;
  const { friendId } = req.body;
  if (!friendId) {
    return res.status(400).json({ message: 'Friend ID is required' });
  }
  try {
    // Check if friendId exists as a player
    const friendExists = db.prepare('SELECT id FROM players WHERE id = ?').get(friendId);
    if (!friendExists) {
      return res.status(404).json({ message: 'Friend not found' });
    }

    db.prepare('INSERT OR IGNORE INTO friends (player_id, friend_id) VALUES (?, ?)').run(playerId, friendId);
    res.status(201).json({ message: 'Friend added', playerId, friendId });
  } catch (error) {
    console.error('Error adding friend:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Friends API - Get a player's friends
app.get('/api/players/:playerId/friends', (req, res) => {
  const { playerId } = req.params;
  try {
    const friends = db.prepare('SELECT p.id, p.name FROM friends JOIN players p ON friends.friend_id = p.id WHERE friends.player_id = ?').all(playerId);
    res.json(friends);
  } catch (error) {
    console.error('Error fetching friends:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Friends API - Remove a friend
app.delete('/api/players/:playerId/friends/:friendId', (req, res) => {
  const { playerId, friendId } = req.params;
  try {
    db.prepare('DELETE FROM friends WHERE player_id = ? AND friend_id = ?').run(playerId, friendId);
    res.json({ message: 'Friend removed', playerId, friendId });
  } catch (error) {
    console.error('Error removing friend:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Middleware to parse JSON bodies
app.use(express.json());

// API routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", database: "connected" });
});

// Player API - Get player by ID
app.get('/api/players/:id', (req, res) => {
  const { id } = req.params;
  try {
    const player = db.prepare('SELECT * FROM players WHERE id = ?').get(id);
    if (player) {
      res.json(player);
    } else {
      res.status(404).json({ message: 'Player not found' });
    }
  } catch (error) {
    console.error('Error fetching player:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Player API - Create or update player
app.post('/api/players', (req, res) => {
  const { id, name, points } = req.body;
  if (!id || !name) {
    return res.status(400).json({ message: 'Player ID and name are required' });
  }
  try {
    const existingPlayer = db.prepare('SELECT id FROM players WHERE id = ?').get(id);
    if (existingPlayer) {
      db.prepare('UPDATE players SET name = ?, points = ? WHERE id = ?').run(name, points || 0, id);
      res.json({ message: 'Player updated', id });
    } else {
      db.prepare('INSERT INTO players (id, name, points) VALUES (?, ?, ?)').run(id, name, points || 0);
      res.status(201).json({ message: 'Player created', id });
    }
  } catch (error) {
    console.error('Error creating/updating player:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Unlocked Decks API - Get unlocked decks for a player
app.get('/api/players/:playerId/unlocked-decks', (req, res) => {
  const { playerId } = req.params;
  try {
    const unlockedDecks = db.prepare('SELECT deck_id FROM unlocked_decks WHERE player_id = ?').all(playerId);
    res.json(unlockedDecks.map((row: { deck_id: string }) => row.deck_id));
  } catch (error) {
    console.error('Error fetching unlocked decks:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Unlocked Decks API - Unlock a deck for a player
app.post('/api/players/:playerId/unlocked-decks', (req, res) => {
  const { playerId } = req.params;
  const { deckId } = req.body;
  if (!deckId) {
    return res.status(400).json({ message: 'Deck ID is required' });
  }
  try {
    db.prepare('INSERT OR IGNORE INTO unlocked_decks (player_id, deck_id) VALUES (?, ?)').run(playerId, deckId);
    res.status(201).json({ message: 'Deck unlocked', playerId, deckId });
  } catch (error) {
    console.error('Error unlocking deck:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
