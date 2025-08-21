import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Database } from './queries.js';
import { DatabaseError } from '../types/index.js';
import type { SubmitScore, LeaderboardEntry, PlayerStats, Game } from '../types/index.js';

// Mock the utils to avoid actual UUID generation in tests
vi.mock('../utils/index.js', () => ({
  generateId: vi.fn(() => 'mocked-uuid-123'),
  generateGameStateHash: vi.fn(() => 'mocked-hash-abc'),
}));

// Create mock D1Database
const createMockD1Database = () => {
  const mockPreparedStatement = {
    bind: vi.fn().mockReturnThis(),
    run: vi.fn(),
    all: vi.fn(),
    first: vi.fn(),
  };

  const mockDB = {
    prepare: vi.fn(() => mockPreparedStatement),
  } as unknown as D1Database;

  return { mockDB, mockPreparedStatement };
};

describe('Database', () => {
  let database: Database;
  let mockDB: D1Database;
  let mockPreparedStatement: any;

  beforeEach(() => {
    const mock = createMockD1Database();
    mockDB = mock.mockDB;
    mockPreparedStatement = mock.mockPreparedStatement;
    database = new Database(mockDB);
    vi.clearAllMocks();
  });

  describe('submitScore', () => {
    const mockScoreData: SubmitScore = {
      player_name: 'TestPlayer',
      score: 1500,
      rounds: 15,
      final_progress: 100,
      final_bugs: 0,
      final_tech_debt: 5,
      game_duration_seconds: 300,
      cards_played: ['card1', 'card2', 'card3'],
    };

    it('should successfully submit a score', async () => {
      mockPreparedStatement.run.mockResolvedValue({ success: true });

      const result = await database.submitScore(mockScoreData);

      expect(mockDB.prepare).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO games')
      );
      expect(mockPreparedStatement.bind).toHaveBeenCalledWith(
        'mocked-uuid-123',
        'TestPlayer',
        1500,
        15,
        100,
        0,
        5,
        300,
        expect.any(String), // timestamp
        'mocked-hash-abc',
        JSON.stringify(['card1', 'card2', 'card3'])
      );
      expect(mockPreparedStatement.run).toHaveBeenCalled();

      expect(result).toEqual({
        id: 'mocked-uuid-123',
        player_name: 'TestPlayer',
        score: 1500,
        rounds: 15,
        final_progress: 100,
        final_bugs: 0,
        final_tech_debt: 5,
        game_duration_seconds: 300,
        completed_at: expect.any(String),
        game_state_hash: 'mocked-hash-abc',
        cards_played: JSON.stringify(['card1', 'card2', 'card3']),
      });
    });

    it('should handle database errors during score submission', async () => {
      mockPreparedStatement.run.mockRejectedValue(new Error('Database connection failed'));

      await expect(database.submitScore(mockScoreData)).rejects.toThrow(DatabaseError);
      await expect(database.submitScore(mockScoreData)).rejects.toThrow(
        'Failed to submit score: Error: Database connection failed'
      );
    });
  });

  describe('getLeaderboard', () => {
    it('should get leaderboard with default parameters', async () => {
      const mockLeaderboard: LeaderboardEntry[] = [
        {
          game_id: 'game1',
          player_name: 'Player1',
          score: 2000,
          rounds: 10,
          final_progress: 100,
          final_bugs: 0,
          final_tech_debt: 0,
          game_duration_seconds: 250,
          completed_at: '2023-01-01T00:00:00Z',
          rank: 1,
        },
        {
          game_id: 'game2',
          player_name: 'Player2',
          score: 1800,
          rounds: 12,
          final_progress: 100,
          final_bugs: 0,
          final_tech_debt: 2,
          game_duration_seconds: 300,
          completed_at: '2023-01-02T00:00:00Z',
          rank: 2,
        },
      ];

      mockPreparedStatement.all.mockResolvedValue({ results: mockLeaderboard });

      const result = await database.getLeaderboard();

      expect(mockDB.prepare).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM leaderboard')
      );
      expect(mockPreparedStatement.bind).toHaveBeenCalledWith(100, 0);
      expect(result).toEqual(mockLeaderboard);
    });

    it('should get leaderboard with custom limit and offset', async () => {
      const mockLeaderboard: LeaderboardEntry[] = [];
      mockPreparedStatement.all.mockResolvedValue({ results: mockLeaderboard });

      const result = await database.getLeaderboard(50, 25);

      expect(mockPreparedStatement.bind).toHaveBeenCalledWith(50, 25);
      expect(result).toEqual(mockLeaderboard);
    });

    it('should handle database errors during leaderboard retrieval', async () => {
      mockPreparedStatement.all.mockRejectedValue(new Error('Query failed'));

      await expect(database.getLeaderboard()).rejects.toThrow(DatabaseError);
      await expect(database.getLeaderboard()).rejects.toThrow(
        'Failed to get leaderboard: Error: Query failed'
      );
    });
  });

  describe('getPlayerGames', () => {
    it('should get player games with default limit', async () => {
      const mockGames: LeaderboardEntry[] = [
        {
          game_id: 'game1',
          player_name: 'TestPlayer',
          score: 1500,
          rounds: 15,
          final_progress: 100,
          final_bugs: 0,
          final_tech_debt: 5,
          game_duration_seconds: 300,
          completed_at: '2023-01-01T00:00:00Z',
          rank: 5,
        },
      ];

      mockPreparedStatement.all.mockResolvedValue({ results: mockGames });

      const result = await database.getPlayerGames('TestPlayer');

      expect(mockDB.prepare).toHaveBeenCalledWith(
        expect.stringContaining('FROM games g')
      );
      expect(mockPreparedStatement.bind).toHaveBeenCalledWith('TestPlayer', 50);
      expect(result).toEqual(mockGames);
    });

    it('should get player games with custom limit', async () => {
      const mockGames: LeaderboardEntry[] = [];
      mockPreparedStatement.all.mockResolvedValue({ results: mockGames });

      const result = await database.getPlayerGames('TestPlayer', 25);

      expect(mockPreparedStatement.bind).toHaveBeenCalledWith('TestPlayer', 25);
      expect(result).toEqual(mockGames);
    });

    it('should handle database errors during player games retrieval', async () => {
      mockPreparedStatement.all.mockRejectedValue(new Error('Player query failed'));

      await expect(database.getPlayerGames('TestPlayer')).rejects.toThrow(DatabaseError);
      await expect(database.getPlayerGames('TestPlayer')).rejects.toThrow(
        'Failed to get player games: Error: Player query failed'
      );
    });
  });

  describe('getPlayerStats', () => {
    it('should get player stats when player exists', async () => {
      const mockStats: PlayerStats = {
        player_name: 'TestPlayer',
        total_games: 10,
        best_score: 2000,
        first_game: '2023-01-01T00:00:00Z',
        latest_game: '2023-01-10T00:00:00Z',
        avg_score: 1500,
        avg_rounds: 15,
        best_rounds: 10,
        avg_duration: 300,
      };

      mockPreparedStatement.first.mockResolvedValue(mockStats);

      const result = await database.getPlayerStats('TestPlayer');

      expect(mockDB.prepare).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM player_stats')
      );
      expect(mockPreparedStatement.bind).toHaveBeenCalledWith('TestPlayer');
      expect(result).toEqual(mockStats);
    });

    it('should return null when player does not exist', async () => {
      mockPreparedStatement.first.mockResolvedValue(null);

      const result = await database.getPlayerStats('NonexistentPlayer');

      expect(result).toBe(null);
    });

    it('should handle database errors during player stats retrieval', async () => {
      mockPreparedStatement.first.mockRejectedValue(new Error('Stats query failed'));

      await expect(database.getPlayerStats('TestPlayer')).rejects.toThrow(DatabaseError);
      await expect(database.getPlayerStats('TestPlayer')).rejects.toThrow(
        'Failed to get player stats: Error: Stats query failed'
      );
    });
  });

  describe('getGameCount', () => {
    it('should get total game count', async () => {
      mockPreparedStatement.first.mockResolvedValue({ count: 150 });

      const result = await database.getGameCount();

      expect(mockDB.prepare).toHaveBeenCalledWith(
        expect.stringContaining('SELECT COUNT(*) as count FROM games')
      );
      expect(result).toBe(150);
    });

    it('should return 0 when no games exist', async () => {
      mockPreparedStatement.first.mockResolvedValue(null);

      const result = await database.getGameCount();

      expect(result).toBe(0);
    });

    it('should handle database errors during game count retrieval', async () => {
      mockPreparedStatement.first.mockRejectedValue(new Error('Count query failed'));

      await expect(database.getGameCount()).rejects.toThrow(DatabaseError);
      await expect(database.getGameCount()).rejects.toThrow(
        'Failed to get game count: Error: Count query failed'
      );
    });
  });

  describe('getPlayerCount', () => {
    it('should get total player count', async () => {
      mockPreparedStatement.first.mockResolvedValue({ count: 75 });

      const result = await database.getPlayerCount();

      expect(mockDB.prepare).toHaveBeenCalledWith(
        expect.stringContaining('SELECT COUNT(DISTINCT player_name) as count FROM games')
      );
      expect(result).toBe(75);
    });

    it('should return 0 when no players exist', async () => {
      mockPreparedStatement.first.mockResolvedValue(null);

      const result = await database.getPlayerCount();

      expect(result).toBe(0);
    });

    it('should handle database errors during player count retrieval', async () => {
      mockPreparedStatement.first.mockRejectedValue(new Error('Player count query failed'));

      await expect(database.getPlayerCount()).rejects.toThrow(DatabaseError);
      await expect(database.getPlayerCount()).rejects.toThrow(
        'Failed to get player count: Error: Player count query failed'
      );
    });
  });

  describe('SQL query validation', () => {
    it('should use correct SQL for score submission', async () => {
      mockPreparedStatement.run.mockResolvedValue({ success: true });

      await database.submitScore({
        player_name: 'TestPlayer',
        score: 1500,
        rounds: 15,
        final_progress: 100,
        final_bugs: 0,
        final_tech_debt: 5,
        game_duration_seconds: 300,
        cards_played: ['card1', 'card2'],
      });

      expect(mockDB.prepare).toHaveBeenCalledWith(
        expect.stringMatching(/INSERT INTO games.*VALUES.*\?1.*\?11/)
      );
    });

    it('should use correct SQL for player games with ranking', async () => {
      mockPreparedStatement.all.mockResolvedValue({ results: [] });

      await database.getPlayerGames('TestPlayer');

      const query = (mockDB.prepare as any).mock.calls[0][0];
      expect(query).toContain('SELECT COUNT(*) + 1');
      expect(query).toContain('FROM games g2');
      expect(query).toContain('WHERE g2.score > g.score');
      expect(query).toContain('ORDER BY g.score DESC');
    });
  });
});
