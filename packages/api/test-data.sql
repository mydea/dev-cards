-- Test data for local development
-- Insert some sample game results for testing the leaderboard

-- Game 1: High score game by Alice
INSERT INTO games (
  id,
  player_name,
  score,
  rounds,
  final_progress,
  final_bugs,
  final_tech_debt,
  game_duration_seconds,
  completed_at,
  game_state_hash,
  cards_played
) VALUES (
  'test-game-1',
  'Alice_Dev',
  850,
  12,
  100,
  0,
  15,
  420,
  '2024-08-20T10:00:00.000Z',
  'hash1234',
  '["implement-feature", "unit-tests", "code-review", "refactor", "tech-debt-cleanup", "implement-mvp", "integration-testing", "documentation", "pair-programming", "coffee-break", "deep-focus-time", "quick-bug-fix"]'
);

-- Game 2: Another good game by Bob
INSERT INTO games (
  id,
  player_name,
  score,
  rounds,
  final_progress,
  final_bugs,
  final_tech_debt,
  game_duration_seconds,
  completed_at,
  game_state_hash,
  cards_played
) VALUES (
  'test-game-2',
  'Bob_Tester',
  720,
  15,
  100,
  0,
  25,
  680,
  '2024-08-20T10:15:00.000Z',
  'hash5678',
  '["implement-feature", "copy-paste", "skip-review", "emergency-bugfix", "implement-feature", "unit-tests", "refactor", "tech-debt-cleanup", "code-review", "documentation", "integration-testing", "coffee-break", "deep-focus-time", "pair-programming", "quick-bug-fix"]'
);

-- Game 3: A second game by Alice (testing multiple games per player)
INSERT INTO games (
  id,
  player_name,
  score,
  rounds,
  final_progress,
  final_bugs,
  final_tech_debt,
  game_duration_seconds,
  completed_at,
  game_state_hash,
  cards_played
) VALUES (
  'test-game-3',
  'Alice_Dev',
  650,
  18,
  100,
  0,
  35,
  920,
  '2024-08-20T11:00:00.000Z',
  'hash9101',
  '["implement-feature", "rush-implementation", "skip-review", "emergency-bugfix", "unit-tests", "refactor", "tech-debt-cleanup", "code-review", "documentation", "integration-testing", "coffee-break", "deep-focus-time", "pair-programming", "quick-bug-fix", "implement-mvp", "database-migration", "setup-sentry", "rubber-ducking"]'
);

-- Game 4: Another player for more variety
INSERT INTO games (
  id,
  player_name,
  score,
  rounds,
  final_progress,
  final_bugs,
  final_tech_debt,
  game_duration_seconds,
  completed_at,
  game_state_hash,
  cards_played
) VALUES (
  'test-game-4',
  'Charlie_QA',
  780,
  14,
  100,
  0,
  20,
  550,
  '2024-08-20T11:30:00.000Z',
  'hash1121',
  '["implement-feature", "unit-tests", "integration-testing", "code-review", "refactor", "tech-debt-cleanup", "documentation", "pair-programming", "coffee-break", "deep-focus-time", "quick-bug-fix", "implement-mvp", "database-migration", "setup-sentry"]'
);
