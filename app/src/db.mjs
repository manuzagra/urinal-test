import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

export function openDb(path) {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS games (
      code TEXT PRIMARY KEY,
      status TEXT NOT NULL DEFAULT 'lobby',           -- lobby | playing | revealed
      scenario_ids TEXT NOT NULL,                      -- JSON array, in play order
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_code TEXT NOT NULL REFERENCES games(code) ON DELETE CASCADE,
      nickname TEXT NOT NULL,
      token TEXT NOT NULL,
      is_host INTEGER NOT NULL DEFAULT 0,
      joined_at INTEGER NOT NULL,
      UNIQUE (game_code, nickname)
    );
    CREATE TABLE IF NOT EXISTS answers (
      game_code TEXT NOT NULL REFERENCES games(code) ON DELETE CASCADE,
      player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
      scenario_id TEXT NOT NULL,
      spot INTEGER NOT NULL,
      answered_at INTEGER NOT NULL,
      PRIMARY KEY (game_code, player_id, scenario_id)
    );
  `);
  // Added after v0: migrate older databases in place.
  const cols = db.prepare('PRAGMA table_info(games)').all().map((c) => c.name);
  if (!cols.includes('history')) db.exec("ALTER TABLE games ADD COLUMN history TEXT NOT NULL DEFAULT '[]'"); // ids played in this group's rounds so far
  if (!cols.includes('next_code')) db.exec('ALTER TABLE games ADD COLUMN next_code TEXT'); // the "play again" round
  return db;
}
