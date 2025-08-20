import type { Bindings, Player, Game, LeaderboardEntry, PlayerStats, SubmitScore } from '../types/index.js';
import { DatabaseError } from '../types/index.js';
import { generateId, generateGameStateHash } from '../utils/index.js';

export class Database {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  // Player operations
  async createPlayer(username: string): Promise<Player> {
    const id = generateId();
    const now = new Date().toISOString();

    try {
      await this.db.prepare(`
        INSERT INTO players (id, username, created_at, updated_at, total_games, best_score)
        VALUES (?1, ?2, ?3, ?4, 0, 0)
      `).bind(id, username, now, now).run();

      return {
        id,
        username,
        created_at: now,
        updated_at: now,
        total_games: 0,
        best_score: 0,
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
        throw new DatabaseError('Username already exists');
      }
      throw new DatabaseError(`Failed to create player: ${error}`);
    }
  }

  async getPlayer(playerId: string): Promise<Player | null> {
    try {
      const result = await this.db.prepare(`
        SELECT id, username, created_at, updated_at, total_games, best_score
        FROM players WHERE id = ?1
      `).bind(playerId).first();

      return result as Player | null;
    } catch (error) {
      throw new DatabaseError(`Failed to get player: ${error}`);
    }
  }

  async getPlayerByUsername(username: string): Promise<Player | null> {
    try {
      const result = await this.db.prepare(`
        SELECT id, username, created_at, updated_at, total_games, best_score
        FROM players WHERE username = ?1
      `).bind(username).first();

      return result as Player | null;
    } catch (error) {
      throw new DatabaseError(`Failed to get player by username: ${error}`);
    }
  }

  // Game operations
  async submitScore(scoreData: SubmitScore): Promise<Game> {
    const gameId = generateId();
    const now = new Date().toISOString();
    const cardsPlayedJson = JSON.stringify(scoreData.cards_played);
    const gameStateHash = generateGameStateHash(scoreData);

    try {
      // Start transaction
      const batch = [
        // Insert the game
        this.db.prepare(`
          INSERT INTO games (
            id, player_id, score, rounds, final_progress, final_bugs, 
            final_tech_debt, game_duration_seconds, completed_at, 
            game_state_hash, cards_played
          ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)
        `).bind(
          gameId, scoreData.player_id, scoreData.score, scoreData.rounds,
          scoreData.final_progress, scoreData.final_bugs, scoreData.final_tech_debt,
          scoreData.game_duration_seconds, now, gameStateHash, cardsPlayedJson
        ),
        
        // Update player stats
        this.db.prepare(`
          UPDATE players 
          SET total_games = total_games + 1,
              best_score = MAX(best_score, ?1),
              updated_at = ?2
          WHERE id = ?3
        `).bind(scoreData.score, now, scoreData.player_id)
      ];

      await this.db.batch(batch);

      return {
        id: gameId,
        player_id: scoreData.player_id,
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

  async getPlayerGames(playerId: string, limit: number = 50): Promise<LeaderboardEntry[]> {
    try {
      const results = await this.db.prepare(`
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
          (
            SELECT COUNT(*) + 1 
            FROM games g2 
            WHERE g2.score > g.score 
            OR (g2.score = g.score AND g2.completed_at < g.completed_at)
          ) as rank
        FROM games g
        JOIN players p ON g.player_id = p.id
        WHERE g.player_id = ?1
        ORDER BY g.score DESC, g.completed_at ASC
        LIMIT ?2
      `).bind(playerId, limit).all();

      return results.results as LeaderboardEntry[];
    } catch (error) {
      throw new DatabaseError(`Failed to get player games: ${error}`);
    }
  }

  async getPlayerStats(playerId: string): Promise<PlayerStats | null> {
    try {
      const result = await this.db.prepare(`
        SELECT * FROM player_stats WHERE id = ?1
      `).bind(playerId).first();

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
        SELECT COUNT(*) as count FROM players
      `).first();

      return (result as any)?.count || 0;
    } catch (error) {
      throw new DatabaseError(`Failed to get player count: ${error}`);
    }
  }
}
