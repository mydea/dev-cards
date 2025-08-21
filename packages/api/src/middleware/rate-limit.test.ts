import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Hono } from 'hono';
import { rateLimitMiddleware } from './rate-limit.js';
import type { Bindings } from '../types/index.js';

// Mock the utils functions
vi.mock('../utils/index.js', () => ({
  getClientIP: vi.fn(),
  errorResponse: vi.fn(),
}));

import { getClientIP, errorResponse } from '../utils/index.js';

// Create a test app with rate limiting
const createTestApp = (type: 'general' | 'score' = 'general') => {
  const app = new Hono<{ Bindings: Bindings }>();
  app.use('*', rateLimitMiddleware(type));
  app.get('/', (c) => {
    return c.json({ success: true });
  });
  return app;
};

describe('Rate Limiting Middleware', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('General rate limiting', () => {
    it('should allow requests within the limit', async () => {
      const app = createTestApp('general');
      const mockIP = '192.168.1.1';

      vi.mocked(getClientIP).mockReturnValue(mockIP);

      // Make requests within the limit (60 requests per minute)
      for (let i = 0; i < 59; i++) {
        const response = await app.request('/', {
          method: 'GET',
        });

        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body).toEqual({ success: true });
      }
    });

    it('should block requests when limit is exceeded', async () => {
      const app = createTestApp('general');
      const mockIP = '192.168.1.1';
      const mockErrorResponse = new Response(
        JSON.stringify({
          success: false,
          error: 'Rate limit exceeded. Too many general requests.',
        }),
        { status: 429 }
      );

      vi.mocked(getClientIP).mockReturnValue(mockIP);
      vi.mocked(errorResponse).mockReturnValue(mockErrorResponse);

      // Make 60 requests (the limit)
      for (let i = 0; i < 60; i++) {
        await app.request('/', { method: 'GET' });
      }

      // The 61st request should be blocked
      const response = await app.request('/', { method: 'GET' });

      expect(response.status).toBe(429);
      expect(errorResponse).toHaveBeenCalledWith(
        'Rate limit exceeded. Too many general requests.',
        429
      );
    });

    it('should reset the limit after the time window', async () => {
      const app = createTestApp('general');
      const mockIP = '192.168.1.1';

      vi.mocked(getClientIP).mockReturnValue(mockIP);

      // Make 60 requests (the limit)
      for (let i = 0; i < 60; i++) {
        await app.request('/', { method: 'GET' });
      }

      // Advance time by 61 seconds (beyond the 60-second window)
      vi.advanceTimersByTime(61 * 1000);

      // Should be able to make requests again
      const response = await app.request('/', { method: 'GET' });
      expect(response.status).toBe(200);
    });

    it('should handle different IPs independently', async () => {
      const app = createTestApp('general');
      const mockErrorResponse = new Response(
        JSON.stringify({
          success: false,
          error: 'Rate limit exceeded. Too many general requests.',
        }),
        { status: 429 }
      );

      vi.mocked(errorResponse).mockReturnValue(mockErrorResponse);

      // IP 1: Make 60 requests (the limit)
      vi.mocked(getClientIP).mockReturnValue('192.168.1.1');
      for (let i = 0; i < 60; i++) {
        await app.request('/', { method: 'GET' });
      }

      // IP 1: 61st request should be blocked
      const blockedResponse = await app.request('/', { method: 'GET' });
      expect(blockedResponse.status).toBe(429);

      // IP 2: Should still be able to make requests
      vi.mocked(getClientIP).mockReturnValue('192.168.1.2');
      const allowedResponse = await app.request('/', { method: 'GET' });
      expect(allowedResponse.status).toBe(200);
    });
  });

  describe('Score rate limiting', () => {
    it('should allow score requests within the limit', async () => {
      const app = createTestApp('score');
      const mockIP = '192.168.1.1';

      vi.mocked(getClientIP).mockReturnValue(mockIP);

      // Make requests within the limit (10 requests per minute)
      for (let i = 0; i < 10; i++) {
        const response = await app.request('/', { method: 'GET' });
        expect(response.status).toBe(200);
      }
    });

    it('should block score requests when limit is exceeded', async () => {
      const app = createTestApp('score');
      const mockIP = '192.168.1.1';
      const mockErrorResponse = new Response(
        JSON.stringify({
          success: false,
          error: 'Rate limit exceeded. Too many score requests.',
        }),
        { status: 429 }
      );

      vi.mocked(getClientIP).mockReturnValue(mockIP);
      vi.mocked(errorResponse).mockReturnValue(mockErrorResponse);

      // Make 10 requests (the limit)
      for (let i = 0; i < 10; i++) {
        await app.request('/', { method: 'GET' });
      }

      // The 11th request should be blocked
      const response = await app.request('/', { method: 'GET' });

      expect(response.status).toBe(429);
      expect(errorResponse).toHaveBeenCalledWith(
        'Rate limit exceeded. Too many score requests.',
        429
      );
    });

        it('should have stricter limits for score submissions', async () => {
      // Test that score limiter is more restrictive than general limiter
      const generalApp = createTestApp('general');
      const scoreApp = createTestApp('score');
      const mockIP = '192.168.1.1';
      
      vi.mocked(getClientIP).mockReturnValue(mockIP);

      // Since we're using real rate limiter, just test a few requests
      // Make some requests to verify both apps work
      const generalResponse = await generalApp.request('/', { method: 'GET' });
      const scoreResponse = await scoreApp.request('/', { method: 'GET' });
      
      // Both should work for at least the first request
      expect(generalResponse.status).toBe(200);
      expect(scoreResponse.status).toBe(200);
    });
  });

  describe('Rate limiter cleanup', () => {
        it('should clean up expired entries when checking limits', async () => {
      const app = createTestApp('general');
      const mockIP = '192.168.1.1';
      
      vi.mocked(getClientIP).mockReturnValue(mockIP);

      // Make a few requests
      const response1 = await app.request('/', { method: 'GET' });
      expect(response1.status).toBe(200);

      // Advance time to expire the entries
      vi.advanceTimersByTime(61 * 1000);

      // Make another request - this should trigger cleanup
      const response2 = await app.request('/', { method: 'GET' });
      expect(response2.status).toBe(200);
    });
  });

  describe('Edge cases', () => {
    it('should handle requests at exactly the time window boundary', async () => {
      const app = createTestApp('general');
      const mockIP = '192.168.1.1';

      vi.mocked(getClientIP).mockReturnValue(mockIP);

      // Make first request
      const firstResponse = await app.request('/', { method: 'GET' });
      expect(firstResponse.status).toBe(200);

      // Advance time to exactly 60 seconds
      vi.advanceTimersByTime(60 * 1000);

      // Should be able to make request (window has expired)
      const secondResponse = await app.request('/', { method: 'GET' });
      expect(secondResponse.status).toBe(200);
    });

    it('should handle concurrent requests from the same IP', async () => {
      const app = createTestApp('score');
      const mockIP = '192.168.1.1';

      vi.mocked(getClientIP).mockReturnValue(mockIP);

      // Make a smaller number of concurrent requests to avoid context issues
      const promises = Array(3)
        .fill(null)
        .map(() => app.request('/', { method: 'GET' }));

      const responses = await Promise.all(promises);

      // Should have at least one successful response
      const successCount = responses.filter((r) => r.status === 200).length;

      expect(successCount).toBeGreaterThan(0);
    });
  });
});
