import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import type { Bindings } from '../types/index.js';
import { SubmitScoreSchema, ValidationError, DatabaseError } from '../types/index.js';
import { Database } from '../db/queries.js';
import { errorResponse, successResponse, validateGameState } from '../utils/index.js';
import { rateLimitMiddleware } from '../middleware/rate-limit.js';

const scores = new Hono<{ Bindings: Bindings }>();

// Submit a new score (with rate limiting)
scores.post('/', rateLimitMiddleware('score'), zValidator('json', SubmitScoreSchema), async (c) => {
  try {
    const scoreData = c.req.valid('json');
    const db = new Database(c.env.DB);
    
    // Verify player exists
    const player = await db.getPlayer(scoreData.player_id);
    if (!player) {
      return errorResponse('Player not found', 404);
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
});

export { scores };
