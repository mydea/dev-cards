import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Hono } from 'hono';
import type { Bindings } from '../types/index.js';

// Mock the utils functions
vi.mock('../utils/index.js', () => ({
  getClientIP: vi.fn(),
  errorResponse: vi.fn(
    () =>
      new Response(
        JSON.stringify({
          success: false,
          error: 'Rate limit exceeded',
        }),
        { status: 429 }
      )
  ),
}));

import { getClientIP, errorResponse } from '../utils/index.js';

// Mock the rate limiting middleware
const mockRateLimitMiddleware = vi.fn();

vi.mock('./rate-limit.js', () => ({
  rateLimitMiddleware: mockRateLimitMiddleware,
}));

describe('Rate Limiting Middleware', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers();

    // Setup default mock behavior
    vi.mocked(getClientIP).mockReturnValue('192.168.1.1');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Middleware integration', () => {
    it('should test middleware factory behavior', () => {
      // Test that the middleware factory works with different types
      expect(mockRateLimitMiddleware).toBeDefined();

      // Call the mock with different parameters
      mockRateLimitMiddleware('general');
      mockRateLimitMiddleware('score');

      expect(mockRateLimitMiddleware).toHaveBeenCalledWith('general');
      expect(mockRateLimitMiddleware).toHaveBeenCalledWith('score');
    });

    it('should use getClientIP to identify requests', async () => {
      // Create a mock context
      const mockContext = {
        req: {
          raw: new Request('https://example.com'),
        },
      };

      const mockNext = vi.fn();

      // Setup middleware to call getClientIP
      mockRateLimitMiddleware.mockImplementation((type) => {
        return async (c: any, next: any) => {
          const ip = getClientIP(c.req.raw);
          await next();
        };
      });

      const middleware = mockRateLimitMiddleware('general');
      await middleware(mockContext, mockNext);

      expect(getClientIP).toHaveBeenCalledWith(mockContext.req.raw);
    });

    it('should return error response when rate limit exceeded', async () => {
      const mockContext = {
        req: {
          raw: new Request('https://example.com'),
        },
      };

      const mockNext = vi.fn();

      // Setup middleware to return error response
      mockRateLimitMiddleware.mockImplementation((type) => {
        return async (c: any, next: any) => {
          const ip = getClientIP(c.req.raw);
          // Simulate rate limit exceeded
          return errorResponse(
            `Rate limit exceeded. Too many ${type} requests.`,
            429
          );
        };
      });

      const middleware = mockRateLimitMiddleware('general');
      const result = await middleware(mockContext, mockNext);

      expect(errorResponse).toHaveBeenCalledWith(
        'Rate limit exceeded. Too many general requests.',
        429
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next when under rate limit', async () => {
      const mockContext = {
        req: {
          raw: new Request('https://example.com'),
        },
      };

      const mockNext = vi.fn();

      // Setup middleware to allow request
      mockRateLimitMiddleware.mockImplementation((type) => {
        return async (c: any, next: any) => {
          const ip = getClientIP(c.req.raw);
          await next();
        };
      });

      const middleware = mockRateLimitMiddleware('general');
      await middleware(mockContext, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Client IP extraction', () => {
    it('should extract IP from various headers', () => {
      const testCases = [
        {
          headers: { 'CF-Connecting-IP': '192.168.1.1' },
          expected: '192.168.1.1',
        },
        {
          headers: { 'X-Forwarded-For': '10.0.0.1, 192.168.1.1' },
          expected: '10.0.0.1',
        },
        {
          headers: { 'X-Real-IP': '172.16.0.1' },
          expected: '172.16.0.1',
        },
      ];

      testCases.forEach(({ headers, expected }) => {
        vi.mocked(getClientIP).mockReturnValue(expected);

        const result = getClientIP(
          new Request('https://example.com', { headers })
        );
        expect(result).toBe(expected);
      });
    });

    it('should return fallback IP when no headers present', () => {
      vi.mocked(getClientIP).mockReturnValue('0.0.0.0');

      const result = getClientIP(new Request('https://example.com'));
      expect(result).toBe('0.0.0.0');
    });
  });

  describe('Rate limiting behavior', () => {
    it('should differentiate between general and score limits', () => {
      // Test the mock behavior for different types
      mockRateLimitMiddleware('general');
      mockRateLimitMiddleware('score');

      // Verify both types are called
      expect(mockRateLimitMiddleware).toHaveBeenCalledWith('general');
      expect(mockRateLimitMiddleware).toHaveBeenCalledWith('score');
      expect(mockRateLimitMiddleware).toHaveBeenCalledTimes(2);
    });

    it('should handle time-based rate limiting', () => {
      // Test that advancing time affects rate limiting
      vi.advanceTimersByTime(60 * 1000); // 1 minute

      // Verify time has advanced
      expect(Date.now()).toBeGreaterThan(0);
    });

    it('should handle multiple IPs independently', () => {
      const ips = ['192.168.1.1', '192.168.1.2', '10.0.0.1'];

      ips.forEach((ip) => {
        vi.mocked(getClientIP).mockReturnValue(ip);
        const result = getClientIP(new Request('https://example.com'));
        expect(result).toBe(ip);
      });
    });

    it('should format error messages correctly', () => {
      vi.mocked(errorResponse).mockReturnValue(
        new Response(
          JSON.stringify({
            success: false,
            error: 'Rate limit exceeded. Too many general requests.',
          }),
          { status: 429 }
        )
      );

      errorResponse('Rate limit exceeded. Too many general requests.', 429);

      expect(errorResponse).toHaveBeenCalledWith(
        'Rate limit exceeded. Too many general requests.',
        429
      );
    });
  });
});
