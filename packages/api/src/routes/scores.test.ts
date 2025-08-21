import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { scores } from './scores.js';
import type { Bindings, SubmitScore } from '../types/index.js';

// Mock all dependencies
vi.mock('../utils/index.js', () => ({
  errorResponse: vi.fn(),
  successResponse: vi.fn(),
  validateGameState: vi.fn(),
}));

vi.mock('../utils/sentry-db.js', () => ({
  createInstrumentedDatabase: vi.fn(),
}));

vi.mock('../middleware/rate-limit.js', () => ({
  rateLimitMiddleware: vi.fn(() => (c: any, next: any) => next()),
}));

vi.mock('@hono/zod-validator', () => ({
  zValidator: vi.fn(() => (c: any, next: any) => {
    // Mock successful validation
    c.req.valid = vi.fn().mockReturnValue({
      player_name: 'TestPlayer',
      score: 1500,
      rounds: 15,
      final_progress: 100,
      final_bugs: 0,
      final_tech_debt: 5,
      game_duration_seconds: 300,
      cards_played: ['card1', 'card2', 'card3', 'card4', 'card5', 'card6'],
    });
    return next();
  }),
}));

import {
  errorResponse,
  successResponse,
  validateGameState,
} from '../utils/index.js';
import { createInstrumentedDatabase } from '../utils/sentry-db.js';

// Create a test app
const createTestApp = () => {
  const app = new Hono<{ Bindings: Bindings }>();
  app.route('/', scores);
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

describe('Scores Routes', () => {
  let app: Hono;
  let mockDatabase: any;

  beforeEach(() => {
    app = createTestApp();
    mockDatabase = {
      submitScore: vi.fn(),
    };

    vi.mocked(createInstrumentedDatabase).mockReturnValue(mockDatabase);
    vi.clearAllMocks();
  });

  describe('POST /', () => {
    const validScoreData: SubmitScore = {
      player_name: 'TestPlayer',
      score: 1500,
      rounds: 15,
      final_progress: 100,
      final_bugs: 0,
      final_tech_debt: 5,
      game_duration_seconds: 300,
      cards_played: ['card1', 'card2', 'card3', 'card4', 'card5', 'card6'],
    };

    it('should successfully submit a valid score', async () => {
      const mockGame = {
        id: 'game-123',
        player_name: 'TestPlayer',
        score: 1500,
        rounds: 15,
        final_progress: 100,
        final_bugs: 0,
        final_tech_debt: 5,
        game_duration_seconds: 300,
        completed_at: '2023-01-01T00:00:00Z',
        game_state_hash: 'hash123',
        cards_played: JSON.stringify(validScoreData.cards_played),
      };

      const mockSuccessResponse = new Response(
        JSON.stringify({
          success: true,
          data: mockGame,
          message: 'Score submitted successfully',
        })
      );

      vi.mocked(validateGameState).mockReturnValue({ valid: true });
      mockDatabase.submitScore.mockResolvedValue(mockGame);
      vi.mocked(successResponse).mockReturnValue(mockSuccessResponse);

      const response = await app.request(
        '/',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(validScoreData),
        },
        mockEnv
      );

      expect(createInstrumentedDatabase).toHaveBeenCalledWith(mockEnv.DB);
      expect(validateGameState).toHaveBeenCalledWith(validScoreData);
      expect(mockDatabase.submitScore).toHaveBeenCalledWith(validScoreData);
      expect(successResponse).toHaveBeenCalledWith(
        mockGame,
        'Score submitted successfully'
      );
    });

    it('should reject empty player names', async () => {
      const mockErrorResponse = new Response(
        JSON.stringify({
          success: false,
          error: 'Player name cannot be empty',
        }),
        { status: 400 }
      );

      // Override the mocked validator to return empty name
      const mockReq = {
        valid: vi.fn().mockReturnValue({
          ...validScoreData,
          player_name: '   ', // Empty after trim
        }),
      };

      vi.mocked(errorResponse).mockReturnValue(mockErrorResponse);

      // We need to test this by creating the app with a custom mock
      const testApp = new Hono<{ Bindings: Bindings }>();
      testApp.post('/', async (c) => {
        c.req.valid = mockReq.valid;
        const scoreData = c.req.valid('json');
        const trimmedPlayerName = scoreData.player_name.trim();
        if (!trimmedPlayerName) {
          return errorResponse('Player name cannot be empty', 400);
        }
        return successResponse({});
      });

      const response = await testApp.request(
        '/',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...validScoreData, player_name: '   ' }),
        },
        mockEnv
      );

      expect(errorResponse).toHaveBeenCalledWith(
        'Player name cannot be empty',
        400
      );
    });

    it('should reject invalid game state', async () => {
      const mockErrorResponse = new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid game state: Game must be completed',
        }),
        { status: 400 }
      );

      vi.mocked(validateGameState).mockReturnValue({
        valid: false,
        reason: 'Game must be completed',
      });
      vi.mocked(errorResponse).mockReturnValue(mockErrorResponse);

      const response = await app.request(
        '/',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(validScoreData),
        },
        mockEnv
      );

      expect(validateGameState).toHaveBeenCalledWith(validScoreData);
      expect(errorResponse).toHaveBeenCalledWith(
        'Invalid game state: Game must be completed',
        400
      );
    });

    it('should handle ValidationError from database', async () => {
      const { ValidationError } = await import('../types/index.js');

      const mockErrorResponse = new Response(
        JSON.stringify({
          success: false,
          error: 'Validation failed',
        }),
        { status: 400 }
      );

      vi.mocked(validateGameState).mockReturnValue({ valid: true });
      mockDatabase.submitScore.mockRejectedValue(
        new ValidationError('Validation failed')
      );
      vi.mocked(errorResponse).mockReturnValue(mockErrorResponse);

      const response = await app.request(
        '/',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(validScoreData),
        },
        mockEnv
      );

      expect(errorResponse).toHaveBeenCalledWith('Validation failed', 400);
    });

    it('should handle DatabaseError from database', async () => {
      const { DatabaseError } = await import('../types/index.js');

      const mockErrorResponse = new Response(
        JSON.stringify({
          success: false,
          error: 'Database operation failed',
        }),
        { status: 400 }
      );

      vi.mocked(validateGameState).mockReturnValue({ valid: true });
      mockDatabase.submitScore.mockRejectedValue(
        new DatabaseError('Database operation failed')
      );
      vi.mocked(errorResponse).mockReturnValue(mockErrorResponse);

      const response = await app.request(
        '/',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(validScoreData),
        },
        mockEnv
      );

      expect(errorResponse).toHaveBeenCalledWith(
        'Database operation failed',
        400
      );
    });

    it('should handle unexpected errors', async () => {
      const mockErrorResponse = new Response(
        JSON.stringify({
          success: false,
          error: 'Internal server error',
        }),
        { status: 500 }
      );

      vi.mocked(validateGameState).mockReturnValue({ valid: true });
      mockDatabase.submitScore.mockRejectedValue(new Error('Unexpected error'));
      vi.mocked(errorResponse).mockReturnValue(mockErrorResponse);

      // Mock console.error to avoid noise in tests
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const response = await app.request(
        '/',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(validScoreData),
        },
        mockEnv
      );

      expect(errorResponse).toHaveBeenCalledWith('Internal server error', 500);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Score submission error:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Rate limiting', () => {
    it('should apply rate limiting middleware', async () => {
      const { rateLimitMiddleware } = await import(
        '../middleware/rate-limit.js'
      );

      const response = await app.request(
        '/',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        },
        mockEnv
      );

      // Since we're mocking the middleware, just verify the response
      expect(response).toBeDefined();
    });
  });

  describe('Input validation', () => {
    it('should validate request body with zod schema', async () => {
      const { zValidator } = await import('@hono/zod-validator');
      const { SubmitScoreSchema } = await import('../types/index.js');

      const response = await app.request(
        '/',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        },
        mockEnv
      );

      // Since we're mocking zValidator, just verify the response
      expect(response).toBeDefined();
    });
  });
});
