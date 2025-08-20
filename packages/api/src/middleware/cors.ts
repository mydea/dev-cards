import { createMiddleware } from 'hono/factory';
import type { Bindings } from '../types/index.js';

export const corsMiddleware = createMiddleware<{ Bindings: Bindings }>(async (c, next) => {
  const origin = c.req.header('Origin');
  const allowedOrigin = c.env.CORS_ORIGIN;
  
  // Set CORS headers
  if (origin === allowedOrigin || c.env.ENVIRONMENT === 'development') {
    c.header('Access-Control-Allow-Origin', origin || allowedOrigin);
    c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    c.header('Access-Control-Max-Age', '86400');
  }
  
  // Handle preflight requests
  if (c.req.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }
  
  await next();
});
