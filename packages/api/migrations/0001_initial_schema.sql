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

-- View for leaderboard - top scores
CREATE VIEW IF NOT EXISTS leaderboard AS
SELECT 
    g.id as game_id,
    g.player_name,
    g.score,
    g.rounds,
    g.final_progress,
    g.final_bugs,
    g.final_tech_debt,
    g.game_duration_seconds,
    g.completed_at,
    -- Calculate rank
    ROW_NUMBER() OVER (ORDER BY g.score DESC, g.completed_at ASC) as rank
FROM games g
ORDER BY g.score DESC, g.completed_at ASC;

-- View for player statistics
CREATE VIEW IF NOT EXISTS player_stats AS
SELECT 
    g.player_name,
    COUNT(*) as total_games,
    MAX(g.score) as best_score,
    MIN(g.completed_at) as first_game,
    MAX(g.completed_at) as latest_game,
    AVG(g.score) as avg_score,
    AVG(g.rounds) as avg_rounds,
    MIN(g.rounds) as best_rounds,
    AVG(g.game_duration_seconds) as avg_duration
FROM games g
GROUP BY g.player_name;
