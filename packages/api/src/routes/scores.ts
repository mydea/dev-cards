import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import type { Bindings } from '../types/index.js';
import {
  SubmitScoreSchema,
  ValidationError,
  DatabaseError,
} from '../types/index.js';

import {
  errorResponse,
  successResponse,
  validateGameState,
} from '../utils/index.js';
import { rateLimitMiddleware } from '../middleware/rate-limit.js';
import { createInstrumentedDatabase } from '../utils/sentry-db.js';

const scores = new Hono<{ Bindings: Bindings }>();

// Submit a new score (with rate limiting)
scores.post(
  '/',
  rateLimitMiddleware('score'),
  zValidator('json', SubmitScoreSchema),
  async (c) => {
    try {
      const scoreData = c.req.valid('json');
      const db = createInstrumentedDatabase(c.env.DB);

      // Basic player name validation (name should not be empty after trimming)
      const trimmedPlayerName = scoreData.player_name.trim();
      if (!trimmedPlayerName) {
        return errorResponse('Player name cannot be empty', 400);
      }

      // Validate game state for basic anti-cheat
      const validation = validateGameState(scoreData);
      if (!validation.valid) {
        return errorResponse(`Invalid game state: ${validation.reason}`, 400);
      }

      // Submit the score
      const game = await db.submitScore(scoreData);

      return successResponse(game, 'Score submitted successfully');
    } catch (error) {
      if (error instanceof ValidationError) {
        return errorResponse(error.message, 400);
      }
      if (error instanceof DatabaseError) {
        return errorResponse(error.message, 400);
      }
      console.error('Score submission error:', error);
      return errorResponse('Internal server error', 500);
    }
  }
);

export { scores };
