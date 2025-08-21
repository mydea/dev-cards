import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { leaderboard } from './leaderboard.js';
import type { Bindings, LeaderboardEntry, PlayerStats } from '../types/index.js';

// Mock the utils and database
vi.mock('../utils/index.js', () => ({
  errorResponse: vi.fn(),
  successResponse: vi.fn(),
}));

vi.mock('../utils/sentry-db.js', () => ({
  createInstrumentedDatabase: vi.fn(),
}));

import { errorResponse, successResponse } from '../utils/index.js';
import { createInstrumentedDatabase } from '../utils/sentry-db.js';

// Create a test app
const createTestApp = () => {
  const app = new Hono<{ Bindings: Bindings }>();
  app.route('/', leaderboard);
  return app;
};

const mockEnv: Bindings = {
  DB: {} as D1Database,
  CACHE: {} as KVNamespace,
  RATE_LIMITER: {} as DurableObjectNamespace,
  ENVIRONMENT: 'test',
  CORS_ORIGIN: '*',
  SENTRY_DSN: 'test-dsn',
  CF_VERSION_METADATA: { id: 'test-version' },
};

describe('Leaderboard Routes', () => {
  let app: Hono;
  let mockDatabase: any;

  beforeEach(() => {
    app = createTestApp();
    mockDatabase = {
      getLeaderboard: vi.fn(),
      getPlayerGames: vi.fn(),
      getPlayerStats: vi.fn(),
      getGameCount: vi.fn(),
      getPlayerCount: vi.fn(),
    };
    
    vi.mocked(createInstrumentedDatabase).mockReturnValue(mockDatabase);
    vi.clearAllMocks();
  });

  describe('GET /', () => {
    const mockLeaderboardEntries: LeaderboardEntry[] = [
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

    it('should return leaderboard with default parameters', async () => {
      const mockSuccessResponse = new Response(JSON.stringify({
        success: true,
        data: {
          entries: mockLeaderboardEntries,
          pagination: {
            limit: 100,
            offset: 0,
            hasMore: false,
          },
        },
      }));

      mockDatabase.getLeaderboard.mockResolvedValue(mockLeaderboardEntries);
      vi.mocked(successResponse).mockReturnValue(mockSuccessResponse);

      const response = await app.request('/', {
        method: 'GET',
      }, mockEnv);

      expect(createInstrumentedDatabase).toHaveBeenCalledWith(mockEnv.DB);
      expect(mockDatabase.getLeaderboard).toHaveBeenCalledWith(100, 0);
      expect(successResponse).toHaveBeenCalledWith({
        entries: mockLeaderboardEntries,
        pagination: {
          limit: 100,
          offset: 0,
          hasMore: false,
        },
      });
    });

    it('should return leaderboard with custom limit and offset', async () => {
      const limitedEntries = mockLeaderboardEntries.slice(0, 1);
      const mockSuccessResponse = new Response(JSON.stringify({
        success: true,
        data: {
          entries: limitedEntries,
          pagination: {
            limit: 50,
            offset: 25,
            hasMore: false,
          },
        },
      }));

      mockDatabase.getLeaderboard.mockResolvedValue(limitedEntries);
      vi.mocked(successResponse).mockReturnValue(mockSuccessResponse);

      const response = await app.request('/?limit=50&offset=25', {
        method: 'GET',
      }, mockEnv);

      expect(mockDatabase.getLeaderboard).toHaveBeenCalledWith(50, 25);
      expect(successResponse).toHaveBeenCalledWith({
        entries: limitedEntries,
        pagination: {
          limit: 50,
          offset: 25,
          hasMore: false,
        },
      });
    });

    it('should enforce maximum limit of 100', async () => {
      mockDatabase.getLeaderboard.mockResolvedValue([]);
      vi.mocked(successResponse).mockReturnValue(new Response('{}'));

      const response = await app.request('/?limit=200', {
        method: 'GET',
      }, mockEnv);

      expect(mockDatabase.getLeaderboard).toHaveBeenCalledWith(100, 0);
    });

    it('should indicate hasMore when results equal limit', async () => {
      const fullPageEntries = Array(50).fill(null).map((_, i) => ({
        game_id: `game${i}`,
        player_name: `Player${i}`,
        score: 1000 - i,
        rounds: 15,
        final_progress: 100,
        final_bugs: 0,
        final_tech_debt: 0,
        game_duration_seconds: 300,
        completed_at: '2023-01-01T00:00:00Z',
        rank: i + 1,
      }));

      const mockSuccessResponse = new Response(JSON.stringify({
        success: true,
        data: {
          entries: fullPageEntries,
          pagination: {
            limit: 50,
            offset: 0,
            hasMore: true,
          },
        },
      }));

      mockDatabase.getLeaderboard.mockResolvedValue(fullPageEntries);
      vi.mocked(successResponse).mockReturnValue(mockSuccessResponse);

      const response = await app.request('/?limit=50', {
        method: 'GET',
      }, mockEnv);

      expect(successResponse).toHaveBeenCalledWith({
        entries: fullPageEntries,
        pagination: {
          limit: 50,
          offset: 0,
          hasMore: true,
        },
      });
    });

    it('should handle database errors', async () => {
      const mockErrorResponse = new Response(JSON.stringify({
        success: false,
        error: 'Internal server error',
      }), { status: 500 });

      mockDatabase.getLeaderboard.mockRejectedValue(new Error('Database failed'));
      vi.mocked(errorResponse).mockReturnValue(mockErrorResponse);

      const response = await app.request('/', {
        method: 'GET',
      }, mockEnv);

      expect(errorResponse).toHaveBeenCalledWith('Internal server error', 500);
    });
  });

  describe('GET /player/:name', () => {
    const mockPlayerStats: PlayerStats = {
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

    const mockPlayerGames: LeaderboardEntry[] = [
      {
        game_id: 'game1',
        player_name: 'TestPlayer',
        score: 2000,
        rounds: 10,
        final_progress: 100,
        final_bugs: 0,
        final_tech_debt: 0,
        game_duration_seconds: 250,
        completed_at: '2023-01-10T00:00:00Z',
        rank: 1,
      },
    ];

    it('should return player leaderboard data', async () => {
      const mockSuccessResponse = new Response(JSON.stringify({
        success: true,
        data: {
          player_name: 'TestPlayer',
          stats: mockPlayerStats,
          games: mockPlayerGames,
        },
      }));

      mockDatabase.getPlayerGames.mockResolvedValue(mockPlayerGames);
      mockDatabase.getPlayerStats.mockResolvedValue(mockPlayerStats);
      vi.mocked(successResponse).mockReturnValue(mockSuccessResponse);

      const response = await app.request('/player/TestPlayer', {
        method: 'GET',
      }, mockEnv);

      expect(mockDatabase.getPlayerGames).toHaveBeenCalledWith('TestPlayer', 50);
      expect(mockDatabase.getPlayerStats).toHaveBeenCalledWith('TestPlayer');
      expect(successResponse).toHaveBeenCalledWith({
        player_name: 'TestPlayer',
        stats: mockPlayerStats,
        games: mockPlayerGames,
      });
    });

    it('should handle URL encoded player names', async () => {
      const mockSuccessResponse = new Response(JSON.stringify({
        success: true,
        data: {
          player_name: 'Player Name',
          stats: { ...mockPlayerStats, player_name: 'Player Name' },
          games: [],
        },
      }));

      mockDatabase.getPlayerGames.mockResolvedValue([]);
      mockDatabase.getPlayerStats.mockResolvedValue({ ...mockPlayerStats, player_name: 'Player Name' });
      vi.mocked(successResponse).mockReturnValue(mockSuccessResponse);

      const response = await app.request('/player/Player%20Name', {
        method: 'GET',
      }, mockEnv);

      expect(mockDatabase.getPlayerGames).toHaveBeenCalledWith('Player Name', 50);
      expect(mockDatabase.getPlayerStats).toHaveBeenCalledWith('Player Name');
    });

    it('should return 404 when player does not exist', async () => {
      const mockErrorResponse = new Response(JSON.stringify({
        success: false,
        error: 'Player not found',
      }), { status: 404 });

      mockDatabase.getPlayerGames.mockResolvedValue([]);
      mockDatabase.getPlayerStats.mockResolvedValue(null);
      vi.mocked(errorResponse).mockReturnValue(mockErrorResponse);

      const response = await app.request('/player/NonexistentPlayer', {
        method: 'GET',
      }, mockEnv);

      expect(errorResponse).toHaveBeenCalledWith('Player not found', 404);
    });

    it('should use custom limit parameter', async () => {
      const mockSuccessResponse = new Response(JSON.stringify({
        success: true,
        data: {
          player_name: 'TestPlayer',
          stats: mockPlayerStats,
          games: mockPlayerGames,
        },
      }));

      mockDatabase.getPlayerGames.mockResolvedValue(mockPlayerGames);
      mockDatabase.getPlayerStats.mockResolvedValue(mockPlayerStats);
      vi.mocked(successResponse).mockReturnValue(mockSuccessResponse);

      const response = await app.request('/player/TestPlayer?limit=25', {
        method: 'GET',
      }, mockEnv);

      expect(mockDatabase.getPlayerGames).toHaveBeenCalledWith('TestPlayer', 25);
    });

    it('should enforce maximum limit of 50', async () => {
      mockDatabase.getPlayerGames.mockResolvedValue([]);
      mockDatabase.getPlayerStats.mockResolvedValue(mockPlayerStats);
      vi.mocked(successResponse).mockReturnValue(new Response('{}'));

      const response = await app.request('/player/TestPlayer?limit=100', {
        method: 'GET',
      }, mockEnv);

      expect(mockDatabase.getPlayerGames).toHaveBeenCalledWith('TestPlayer', 50);
    });

    it('should handle database errors', async () => {
      const mockErrorResponse = new Response(JSON.stringify({
        success: false,
        error: 'Internal server error',
      }), { status: 500 });

      mockDatabase.getPlayerGames.mockRejectedValue(new Error('Database failed'));
      vi.mocked(errorResponse).mockReturnValue(mockErrorResponse);

      const response = await app.request('/player/TestPlayer', {
        method: 'GET',
      }, mockEnv);

      expect(errorResponse).toHaveBeenCalledWith('Internal server error', 500);
    });
  });

  describe('GET /stats', () => {
    it('should return global statistics', async () => {
      const mockSuccessResponse = new Response(JSON.stringify({
        success: true,
        data: {
          total_games: 1500,
          total_players: 250,
        },
      }));

      mockDatabase.getGameCount.mockResolvedValue(1500);
      mockDatabase.getPlayerCount.mockResolvedValue(250);
      vi.mocked(successResponse).mockReturnValue(mockSuccessResponse);

      const response = await app.request('/stats', {
        method: 'GET',
      }, mockEnv);

      expect(mockDatabase.getGameCount).toHaveBeenCalled();
      expect(mockDatabase.getPlayerCount).toHaveBeenCalled();
      expect(successResponse).toHaveBeenCalledWith({
        total_games: 1500,
        total_players: 250,
      });
    });

    it('should handle database errors', async () => {
      const mockErrorResponse = new Response(JSON.stringify({
        success: false,
        error: 'Internal server error',
      }), { status: 500 });

      mockDatabase.getGameCount.mockRejectedValue(new Error('Database failed'));
      vi.mocked(errorResponse).mockReturnValue(mockErrorResponse);

      const response = await app.request('/stats', {
        method: 'GET',
      }, mockEnv);

      expect(errorResponse).toHaveBeenCalledWith('Internal server error', 500);
    });

    it('should handle partial database failures', async () => {
      const mockErrorResponse = new Response(JSON.stringify({
        success: false,
        error: 'Internal server error',
      }), { status: 500 });

      mockDatabase.getGameCount.mockResolvedValue(1500);
      mockDatabase.getPlayerCount.mockRejectedValue(new Error('Player count failed'));
      vi.mocked(errorResponse).mockReturnValue(mockErrorResponse);

      const response = await app.request('/stats', {
        method: 'GET',
      }, mockEnv);

      expect(errorResponse).toHaveBeenCalledWith('Internal server error', 500);
    });
  });

  describe('Error handling', () => {
    it('should handle DatabaseError specifically', async () => {
      const { DatabaseError } = await import('../types/index.js');
      
      const mockErrorResponse = new Response(JSON.stringify({
        success: false,
        error: 'Database connection failed',
      }), { status: 400 });

      mockDatabase.getLeaderboard.mockRejectedValue(new DatabaseError('Database connection failed'));
      vi.mocked(errorResponse).mockReturnValue(mockErrorResponse);

      const response = await app.request('/', {
        method: 'GET',
      }, mockEnv);

      expect(errorResponse).toHaveBeenCalledWith('Database connection failed', 400);
    });
  });
});
