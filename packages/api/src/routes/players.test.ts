import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { players } from './players.js';
import type { Bindings } from '../types/index.js';

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
  app.route('/', players);
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

describe('Players Routes', () => {
  let app: Hono;
  let mockDatabase: any;

  beforeEach(() => {
    app = createTestApp();
    mockDatabase = {
      getPlayerStats: vi.fn(),
      getPlayerGames: vi.fn(),
    };

    vi.mocked(createInstrumentedDatabase).mockReturnValue(mockDatabase);
    vi.clearAllMocks();
  });

  describe('GET /:name/stats', () => {
    it('should return player stats when player exists', async () => {
      const mockStats = {
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

      const mockSuccessResponse = new Response(
        JSON.stringify({
          success: true,
          data: mockStats,
        })
      );

      mockDatabase.getPlayerStats.mockResolvedValue(mockStats);
      vi.mocked(successResponse).mockReturnValue(mockSuccessResponse);

      const response = await app.request(
        '/TestPlayer/stats',
        {
          method: 'GET',
        },
        mockEnv
      );

      expect(createInstrumentedDatabase).toHaveBeenCalledWith(mockEnv.DB);
      expect(mockDatabase.getPlayerStats).toHaveBeenCalledWith('TestPlayer');
      expect(successResponse).toHaveBeenCalledWith(mockStats);
    });

    it('should return 404 when player does not exist', async () => {
      const mockErrorResponse = new Response(
        JSON.stringify({
          success: false,
          error: 'Player not found',
        }),
        { status: 404 }
      );

      mockDatabase.getPlayerStats.mockResolvedValue(null);
      vi.mocked(errorResponse).mockReturnValue(mockErrorResponse);

      const response = await app.request(
        '/NonexistentPlayer/stats',
        {
          method: 'GET',
        },
        mockEnv
      );

      expect(mockDatabase.getPlayerStats).toHaveBeenCalledWith(
        'NonexistentPlayer'
      );
      expect(errorResponse).toHaveBeenCalledWith('Player not found', 404);
    });

    it('should handle URL encoded player names', async () => {
      const mockStats = {
        player_name: 'Player Name',
        total_games: 5,
        best_score: 1000,
        first_game: '2023-01-01T00:00:00Z',
        latest_game: '2023-01-05T00:00:00Z',
        avg_score: 800,
        avg_rounds: 20,
        best_rounds: 15,
        avg_duration: 400,
      };

      const mockSuccessResponse = new Response(
        JSON.stringify({
          success: true,
          data: mockStats,
        })
      );

      mockDatabase.getPlayerStats.mockResolvedValue(mockStats);
      vi.mocked(successResponse).mockReturnValue(mockSuccessResponse);

      const response = await app.request(
        '/Player%20Name/stats',
        {
          method: 'GET',
        },
        mockEnv
      );

      expect(mockDatabase.getPlayerStats).toHaveBeenCalledWith('Player Name');
    });

    it('should handle database errors', async () => {
      const mockErrorResponse = new Response(
        JSON.stringify({
          success: false,
          error: 'Database connection failed',
        }),
        { status: 400 }
      );

      mockDatabase.getPlayerStats.mockRejectedValue(
        new Error('Database connection failed')
      );
      vi.mocked(errorResponse).mockReturnValue(mockErrorResponse);

      const response = await app.request(
        '/TestPlayer/stats',
        {
          method: 'GET',
        },
        mockEnv
      );

      expect(errorResponse).toHaveBeenCalledWith('Internal server error', 500);
    });
  });

  describe('GET /:name/games', () => {
    it('should return player games with default limit', async () => {
      const mockGames = [
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

      const mockSuccessResponse = new Response(
        JSON.stringify({
          success: true,
          data: mockGames,
        })
      );

      mockDatabase.getPlayerGames.mockResolvedValue(mockGames);
      vi.mocked(successResponse).mockReturnValue(mockSuccessResponse);

      const response = await app.request(
        '/TestPlayer/games',
        {
          method: 'GET',
        },
        mockEnv
      );

      expect(mockDatabase.getPlayerGames).toHaveBeenCalledWith(
        'TestPlayer',
        50
      );
      expect(successResponse).toHaveBeenCalledWith(mockGames);
    });

    it('should return player games with custom limit', async () => {
      const mockGames: any[] = [];
      const mockSuccessResponse = new Response(
        JSON.stringify({
          success: true,
          data: mockGames,
        })
      );

      mockDatabase.getPlayerGames.mockResolvedValue(mockGames);
      vi.mocked(successResponse).mockReturnValue(mockSuccessResponse);

      const response = await app.request(
        '/TestPlayer/games?limit=25',
        {
          method: 'GET',
        },
        mockEnv
      );

      expect(mockDatabase.getPlayerGames).toHaveBeenCalledWith(
        'TestPlayer',
        25
      );
      expect(successResponse).toHaveBeenCalledWith(mockGames);
    });

    it('should handle invalid limit parameter', async () => {
      const mockGames: any[] = [];
      const mockSuccessResponse = new Response(
        JSON.stringify({
          success: true,
          data: mockGames,
        })
      );

      mockDatabase.getPlayerGames.mockResolvedValue(mockGames);
      vi.mocked(successResponse).mockReturnValue(mockSuccessResponse);

      const response = await app.request(
        '/TestPlayer/games?limit=invalid',
        {
          method: 'GET',
        },
        mockEnv
      );

      // Should use NaN when invalid (parseInt('invalid') = NaN)
      expect(mockDatabase.getPlayerGames).toHaveBeenCalledWith(
        'TestPlayer',
        NaN
      );
    });

    it('should handle URL encoded player names', async () => {
      const mockGames: any[] = [];
      const mockSuccessResponse = new Response(
        JSON.stringify({
          success: true,
          data: mockGames,
        })
      );

      mockDatabase.getPlayerGames.mockResolvedValue(mockGames);
      vi.mocked(successResponse).mockReturnValue(mockSuccessResponse);

      const response = await app.request(
        '/Player%20Name/games',
        {
          method: 'GET',
        },
        mockEnv
      );

      expect(mockDatabase.getPlayerGames).toHaveBeenCalledWith(
        'Player Name',
        50
      );
    });

    it('should handle database errors', async () => {
      const mockErrorResponse = new Response(
        JSON.stringify({
          success: false,
          error: 'Database query failed',
        }),
        { status: 400 }
      );

      mockDatabase.getPlayerGames.mockRejectedValue(
        new Error('Database query failed')
      );
      vi.mocked(errorResponse).mockReturnValue(mockErrorResponse);

      const response = await app.request(
        '/TestPlayer/games',
        {
          method: 'GET',
        },
        mockEnv
      );

      expect(errorResponse).toHaveBeenCalledWith('Internal server error', 500);
    });
  });

  describe('Error handling', () => {
    it('should handle DatabaseError specifically', async () => {
      const { DatabaseError } = await import('../types/index.js');

      const mockErrorResponse = new Response(
        JSON.stringify({
          success: false,
          error: 'Database connection failed',
        }),
        { status: 400 }
      );

      mockDatabase.getPlayerStats.mockRejectedValue(
        new DatabaseError('Database connection failed')
      );
      vi.mocked(errorResponse).mockReturnValue(mockErrorResponse);

      const response = await app.request(
        '/TestPlayer/stats',
        {
          method: 'GET',
        },
        mockEnv
      );

      expect(errorResponse).toHaveBeenCalledWith(
        'Database connection failed',
        400
      );
    });
  });
});
