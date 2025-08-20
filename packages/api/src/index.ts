import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import type { Bindings } from './types/index.js';
import { corsMiddleware } from './middleware/cors.js';
import { rateLimitMiddleware } from './middleware/rate-limit.js';
import { players } from './routes/players.js';
import { scores } from './routes/scores.js';
import { leaderboard } from './routes/leaderboard.js';
import { successResponse, errorResponse } from './utils/index.js';

const app = new Hono<{ Bindings: Bindings }>();

// Global middleware
app.use('*', logger());
app.use('*', corsMiddleware);
app.use('*', prettyJSON());
app.use('/api/*', rateLimitMiddleware('general'));

// Health check endpoint
app.get('/', async (c) => {
  return successResponse({
    service: 'Draw It, Play It, Ship It API',
    version: '1.0.0',
    environment: c.env.ENVIRONMENT,
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.route('/api/players', players);
app.route('/api/scores', scores);
app.route('/api/leaderboard', leaderboard);

// 404 handler
app.notFound((c) => {
  return errorResponse('Not found', 404);
});

// Error handler
app.onError((err, c) => {
  console.error('API Error:', err);
  return errorResponse('Internal server error', 500);
});

export default app;
