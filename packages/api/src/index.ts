import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import * as Sentry from '@sentry/cloudflare';
import type { Bindings } from './types/index.js';
import { rateLimitMiddleware } from './middleware/rate-limit.js';
import { players } from './routes/players.js';
import { scores } from './routes/scores.js';
import { leaderboard } from './routes/leaderboard.js';
import { successResponse, errorResponse } from './utils/index.js';

const app = new Hono<{ Bindings: Bindings }>();

// Global middleware
app.use('*', logger());
app.use('*', async (c, next) => {
  const corsMiddlewareHandler = cors({
    origin: c.env.CORS_ORIGIN,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'Sentry-Trace', 'Baggage'],
    maxAge: 86400,
  });
  return corsMiddlewareHandler(c, next);
});
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
app.notFound((_c) => {
  return errorResponse('Not found', 404);
});

// Wrap with Sentry for monitoring
export default Sentry.withSentry((env: Bindings) => {
  const { id: versionId } = env.CF_VERSION_METADATA;

  return {
    dsn: env.SENTRY_DSN,
    release: versionId,
    environment: env.ENVIRONMENT,

    // Adds request headers and IP for users
    sendDefaultPii: true,

    // Enable logs to be sent to Sentry
    enableLogs: true,

    // Set tracesSampleRate to capture performance data
    tracesSampleRate: 1,
  };
}, app);
