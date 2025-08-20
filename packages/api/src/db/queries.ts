import type { Bindings, Game, LeaderboardEntry, PlayerStats, SubmitScore } from '../types/index.js';
import { DatabaseError } from '../types/index.js';
import { generateId, generateGameStateHash } from '../utils/index.js';

export class Database {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  // Game operations
  async submitScore(scoreData: SubmitScore): Promise<Game> {
    const gameId = generateId();
    const now = new Date().toISOString();
    const cardsPlayedJson = JSON.stringify(scoreData.cards_played);
    const gameStateHash = generateGameStateHash(scoreData);

    try {
      // Insert the game
      await this.db.prepare(`
        INSERT INTO games (
          id, player_name, score, rounds, final_progress, final_bugs, 
          final_tech_debt, game_duration_seconds, completed_at, 
          game_state_hash, cards_played
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)
      `).bind(
        gameId, scoreData.player_name, scoreData.score, scoreData.rounds,
        scoreData.final_progress, scoreData.final_bugs, scoreData.final_tech_debt,
        scoreData.game_duration_seconds, now, gameStateHash, cardsPlayedJson
      ).run();

      return {
        id: gameId,
        player_name: scoreData.player_name,
        score: scoreData.score,
        rounds: scoreData.rounds,
        final_progress: scoreData.final_progress,
        final_bugs: scoreData.final_bugs,
        final_tech_debt: scoreData.final_tech_debt,
        game_duration_seconds: scoreData.game_duration_seconds,
        completed_at: now,
        game_state_hash: gameStateHash,
        cards_played: cardsPlayedJson,
      };
    } catch (error) {
      throw new DatabaseError(`Failed to submit score: ${error}`);
    }
  }

  // Leaderboard operations
  async getLeaderboard(limit: number = 100, offset: number = 0): Promise<LeaderboardEntry[]> {
    try {
      const results = await this.db.prepare(`
        SELECT * FROM leaderboard
        LIMIT ?1 OFFSET ?2
      `).bind(limit, offset).all();

      return results.results as LeaderboardEntry[];
    } catch (error) {
      throw new DatabaseError(`Failed to get leaderboard: ${error}`);
    }
  }

  async getPlayerGames(playerName: string, limit: number = 50): Promise<LeaderboardEntry[]> {
    try {
      const results = await this.db.prepare(`
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
          (
            SELECT COUNT(*) + 1 
            FROM games g2 
            WHERE g2.score > g.score 
            OR (g2.score = g.score AND g2.completed_at < g.completed_at)
          ) as rank
        FROM games g
        WHERE g.player_name = ?1
        ORDER BY g.score DESC, g.completed_at ASC
        LIMIT ?2
      `).bind(playerName, limit).all();

      return results.results as LeaderboardEntry[];
    } catch (error) {
      throw new DatabaseError(`Failed to get player games: ${error}`);
    }
  }

  async getPlayerStats(playerName: string): Promise<PlayerStats | null> {
    try {
      const result = await this.db.prepare(`
        SELECT * FROM player_stats WHERE player_name = ?1
      `).bind(playerName).first();

      return result as PlayerStats | null;
    } catch (error) {
      throw new DatabaseError(`Failed to get player stats: ${error}`);
    }
  }

  // Admin/utility operations
  async getGameCount(): Promise<number> {
    try {
      const result = await this.db.prepare(`
        SELECT COUNT(*) as count FROM games
      `).first();

      return (result as any)?.count || 0;
    } catch (error) {
      throw new DatabaseError(`Failed to get game count: ${error}`);
    }
  }

  async getPlayerCount(): Promise<number> {
    try {
      const result = await this.db.prepare(`
        SELECT COUNT(DISTINCT player_name) as count FROM games
      `).first();

      return (result as any)?.count || 0;
    } catch (error) {
      throw new DatabaseError(`Failed to get player count: ${error}`);
    }
  }
}
