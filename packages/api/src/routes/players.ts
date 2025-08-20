import { Hono } from 'hono';
import type { Bindings } from '../types/index.js';
import { DatabaseError } from '../types/index.js';
import { Database } from '../db/queries.js';
import { errorResponse, successResponse } from '../utils/index.js';

const players = new Hono<{ Bindings: Bindings }>();

// Get player stats by name
players.get('/:name/stats', async (c) => {
  try {
    const playerName = decodeURIComponent(c.req.param('name'));
    const db = new Database(c.env.DB);

    const stats = await db.getPlayerStats(playerName);
    if (!stats) {
      return errorResponse('Player not found', 404);
    }

    return successResponse(stats);
  } catch (error) {
    if (error instanceof DatabaseError) {
      return errorResponse(error.message, 400);
    }
    return errorResponse('Internal server error', 500);
  }
});

// Get player's games by name
players.get('/:name/games', async (c) => {
  try {
    const playerName = decodeURIComponent(c.req.param('name'));
    const limit = parseInt(c.req.query('limit') || '50');
    const db = new Database(c.env.DB);

    const games = await db.getPlayerGames(playerName, limit);
    return successResponse(games);
  } catch (error) {
    if (error instanceof DatabaseError) {
      return errorResponse(error.message, 400);
    }
    return errorResponse('Internal server error', 500);
  }
});

export { players };
