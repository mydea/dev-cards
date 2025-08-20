import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import type { Bindings } from '../types/index.js';
import { CreatePlayerSchema, ValidationError, DatabaseError } from '../types/index.js';
import { Database } from '../db/queries.js';
import { errorResponse, successResponse } from '../utils/index.js';

const players = new Hono<{ Bindings: Bindings }>();

// Create a new player
players.post('/', zValidator('json', CreatePlayerSchema), async (c) => {
  try {
    const { username } = c.req.valid('json');
    const db = new Database(c.env.DB);
    
    // Check if username already exists
    const existingPlayer = await db.getPlayerByUsername(username);
    if (existingPlayer) {
      return errorResponse('Username already exists', 409);
    }
    
    const player = await db.createPlayer(username);
    return successResponse(player, 'Player created successfully');
  } catch (error) {
    if (error instanceof DatabaseError) {
      return errorResponse(error.message, 400);
    }
    return errorResponse('Internal server error', 500);
  }
});

// Get player by ID
players.get('/:id', async (c) => {
  try {
    const playerId = c.req.param('id');
    const db = new Database(c.env.DB);
    
    const player = await db.getPlayer(playerId);
    if (!player) {
      return errorResponse('Player not found', 404);
    }
    
    return successResponse(player);
  } catch (error) {
    if (error instanceof DatabaseError) {
      return errorResponse(error.message, 400);
    }
    return errorResponse('Internal server error', 500);
  }
});

// Get player stats
players.get('/:id/stats', async (c) => {
  try {
    const playerId = c.req.param('id');
    const db = new Database(c.env.DB);
    
    const stats = await db.getPlayerStats(playerId);
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

// Get player's games
players.get('/:id/games', async (c) => {
  try {
    const playerId = c.req.param('id');
    const limit = parseInt(c.req.query('limit') || '50');
    const db = new Database(c.env.DB);
    
    const games = await db.getPlayerGames(playerId, limit);
    return successResponse(games);
  } catch (error) {
    if (error instanceof DatabaseError) {
      return errorResponse(error.message, 400);
    }
    return errorResponse('Internal server error', 500);
  }
});

export { players };
