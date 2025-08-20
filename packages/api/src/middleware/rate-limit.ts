import { createMiddleware } from 'hono/factory';
import type { Bindings } from '../types/index.js';
import { RateLimitError } from '../types/index.js';
import { getClientIP, errorResponse } from '../utils/index.js';

// Simple in-memory rate limiter for demonstration
// In production, you'd want to use Durable Objects or KV store
class SimpleRateLimiter {
  private requests: Map<string, { count: number; resetTime: number }> = new Map();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number = 60, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  isAllowed(key: string): boolean {
    const now = Date.now();
    const record = this.requests.get(key);

    if (!record || now > record.resetTime) {
      this.requests.set(key, { count: 1, resetTime: now + this.windowMs });
      return true;
    }

    if (record.count >= this.maxRequests) {
      return false;
    }

    record.count++;
    return true;
  }

  cleanup() {
    const now = Date.now();
    for (const [key, record] of this.requests) {
      if (now > record.resetTime) {
        this.requests.delete(key);
      }
    }
  }
}

const generalLimiter = new SimpleRateLimiter(60, 60000); // 60 requests per minute
const scoreLimiter = new SimpleRateLimiter(10, 60000); // 10 score submissions per minute

// Cleanup old entries every 5 minutes
setInterval(() => {
  generalLimiter.cleanup();
  scoreLimiter.cleanup();
}, 5 * 60 * 1000);

export const rateLimitMiddleware = (type: 'general' | 'score' = 'general') => {
  return createMiddleware<{ Bindings: Bindings }>(async (c, next) => {
    const clientIP = getClientIP(c.req.raw);
    const limiter = type === 'score' ? scoreLimiter : generalLimiter;
    
    if (!limiter.isAllowed(clientIP)) {
      return errorResponse(
        `Rate limit exceeded. Too many ${type} requests.`,
        429
      );
    }
    
    await next();
  });
};
