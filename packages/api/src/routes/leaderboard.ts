import { Hono } from 'hono';
import type { Bindings } from '../types/index.js';
import { DatabaseError } from '../types/index.js';
import { Database } from '../db/queries.js';
import { errorResponse, successResponse } from '../utils/index.js';

const leaderboard = new Hono<{ Bindings: Bindings }>();

// Get global leaderboard
leaderboard.get('/', async (c) => {
  try {
    const limit = Math.min(parseInt(c.req.query('limit') || '100'), 100); // Max 100 entries
    const offset = parseInt(c.req.query('offset') || '0');

    const db = new Database(c.env.DB);
    const entries = await db.getLeaderboard(limit, offset);

    return successResponse({
      entries,
      pagination: {
        limit,
        offset,
        hasMore: entries.length === limit,
      },
    });
  } catch (error) {
    if (error instanceof DatabaseError) {
      return errorResponse(error.message, 400);
    }
    return errorResponse('Internal server error', 500);
  }
});

// Get leaderboard for a specific player
leaderboard.get('/player/:name', async (c) => {
  try {
    const playerName = decodeURIComponent(c.req.param('name'));
    const limit = Math.min(parseInt(c.req.query('limit') || '50'), 50);

    const db = new Database(c.env.DB);

    const games = await db.getPlayerGames(playerName, limit);
    const stats = await db.getPlayerStats(playerName);

    if (!stats) {
      return errorResponse('Player not found', 404);
    }

    return successResponse({
      player_name: playerName,
      stats,
      games,
    });
  } catch (error) {
    if (error instanceof DatabaseError) {
      return errorResponse(error.message, 400);
    }
    return errorResponse('Internal server error', 500);
  }
});

// Get leaderboard statistics
leaderboard.get('/stats', async (c) => {
  try {
    const db = new Database(c.env.DB);

    const [gameCount, playerCount] = await Promise.all([
      db.getGameCount(),
      db.getPlayerCount(),
    ]);

    return successResponse({
      total_games: gameCount,
      total_players: playerCount,
    });
  } catch (error) {
    if (error instanceof DatabaseError) {
      return errorResponse(error.message, 400);
    }
    return errorResponse('Internal server error', 500);
  }
});

export { leaderboard };
