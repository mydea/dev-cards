-- Initial schema for Draw It, Play It, Ship It leaderboard
-- Migration: 0001_initial_schema

-- Players table - stores basic player information
CREATE TABLE IF NOT EXISTS players (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    total_games INTEGER DEFAULT 0,
    best_score INTEGER DEFAULT 0
);

-- Games/Scores table - stores individual game results
CREATE TABLE IF NOT EXISTS games (
    id TEXT PRIMARY KEY,
    player_id TEXT NOT NULL,
    score INTEGER NOT NULL,
    rounds INTEGER NOT NULL,
    final_progress INTEGER NOT NULL,
    final_bugs INTEGER NOT NULL,
    final_tech_debt INTEGER NOT NULL,
    game_duration_seconds INTEGER NOT NULL,
    completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    game_state_hash TEXT NOT NULL, -- For basic anti-cheat validation
    cards_played TEXT NOT NULL, -- JSON array of card IDs played
    
    -- Foreign key constraint
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_games_player_id ON games(player_id);
CREATE INDEX IF NOT EXISTS idx_games_score ON games(score DESC);
CREATE INDEX IF NOT EXISTS idx_games_completed_at ON games(completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_players_best_score ON players(best_score DESC);
CREATE INDEX IF NOT EXISTS idx_games_player_score ON games(player_id, score DESC);

-- View for leaderboard - top scores with player info
CREATE VIEW IF NOT EXISTS leaderboard AS
SELECT 
    g.id as game_id,
    p.id as player_id,
    p.username,
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
JOIN players p ON g.player_id = p.id
ORDER BY g.score DESC, g.completed_at ASC;

-- View for player statistics
CREATE VIEW IF NOT EXISTS player_stats AS
SELECT 
    p.id,
    p.username,
    p.total_games,
    p.best_score,
    p.created_at,
    COALESCE(AVG(g.score), 0) as avg_score,
    COALESCE(AVG(g.rounds), 0) as avg_rounds,
    COALESCE(MIN(g.rounds), 0) as best_rounds,
    COALESCE(AVG(g.game_duration_seconds), 0) as avg_duration
FROM players p
LEFT JOIN games g ON p.id = g.player_id
GROUP BY p.id, p.username, p.total_games, p.best_score, p.created_at;
