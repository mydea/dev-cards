-- Initial schema for Draw It, Play It, Ship It leaderboard
-- Migration: 0001_initial_schema

-- Games/Scores table - stores individual game results with player names
CREATE TABLE IF NOT EXISTS games (
    id TEXT PRIMARY KEY,
    player_name TEXT NOT NULL,
    score INTEGER NOT NULL,
    rounds INTEGER NOT NULL,
    final_progress INTEGER NOT NULL,
    final_bugs INTEGER NOT NULL,
    final_tech_debt INTEGER NOT NULL,
    game_duration_seconds INTEGER NOT NULL,
    completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    game_state_hash TEXT NOT NULL, -- For basic anti-cheat validation
    cards_played TEXT NOT NULL -- JSON array of card IDs played
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_games_player_name ON games(player_name);
CREATE INDEX IF NOT EXISTS idx_games_score ON games(score DESC);
CREATE INDEX IF NOT EXISTS idx_games_completed_at ON games(completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_games_player_score ON games(player_name, score DESC);