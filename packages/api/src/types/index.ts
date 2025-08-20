import { z } from 'zod';

// Environment variables
export type Bindings = {
  DB: D1Database;
  CACHE: KVNamespace;
  RATE_LIMITER: DurableObjectNamespace;
  ENVIRONMENT: string;
  CORS_ORIGIN: string;
};

// Game/Score schemas
export const SubmitScoreSchema = z.object({
  player_name: z.string().min(1).max(50).regex(/^[a-zA-Z0-9_\-\s]+$/, 'Player name can only contain letters, numbers, underscores, hyphens, and spaces'),
  score: z.number().int().min(0).max(10000), // Reasonable max score
  rounds: z.number().int().min(1).max(100), // Reasonable max rounds
  final_progress: z.number().int().min(0).max(100),
  final_bugs: z.number().int().min(0).max(50),
  final_tech_debt: z.number().int().min(0).max(100),
  game_duration_seconds: z.number().int().min(30).max(7200), // 30 seconds to 2 hours
  cards_played: z.array(z.string()).min(1).max(200), // Card IDs
});

export const GameSchema = z.object({
  id: z.string(),
  player_name: z.string(),
  score: z.number(),
  rounds: z.number(),
  final_progress: z.number(),
  final_bugs: z.number(),
  final_tech_debt: z.number(),
  game_duration_seconds: z.number(),
  completed_at: z.string(),
  game_state_hash: z.string(),
  cards_played: z.string(), // JSON string
});

// Leaderboard schemas
export const LeaderboardEntrySchema = z.object({
  game_id: z.string(),
  player_name: z.string(),
  score: z.number(),
  rounds: z.number(),
  final_progress: z.number(),
  final_bugs: z.number(),
  final_tech_debt: z.number(),
  game_duration_seconds: z.number(),
  completed_at: z.string(),
  rank: z.number(),
});

export const PlayerStatsSchema = z.object({
  player_name: z.string(),
  total_games: z.number(),
  best_score: z.number(),
  first_game: z.string(),
  latest_game: z.string(),
  avg_score: z.number(),
  avg_rounds: z.number(),
  best_rounds: z.number(),
  avg_duration: z.number(),
});

// API Response schemas
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  message: z.string().optional(),
});

// Types
export type SubmitScore = z.infer<typeof SubmitScoreSchema>;
export type Game = z.infer<typeof GameSchema>;
export type LeaderboardEntry = z.infer<typeof LeaderboardEntrySchema>;
export type PlayerStats = z.infer<typeof PlayerStatsSchema>;
export type ApiResponse = z.infer<typeof ApiResponseSchema>;

// Error types
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RateLimitError';
  }
}

export class DatabaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}
