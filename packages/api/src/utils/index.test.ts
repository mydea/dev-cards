import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateId,
  generateGameStateHash,
  validateGameState,
  errorResponse,
  successResponse,
  getClientIP,
} from './index.js';
import type { SubmitScore } from '../types/index.js';

describe('Utils', () => {
  describe('generateId', () => {
    it('should generate a valid UUID format', () => {
      const id = generateId();

      // UUID v4 format: 8-4-4-4-12 characters
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

      expect(id).toMatch(uuidRegex);
    });

    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();

      expect(id1).not.toBe(id2);
    });

        it('should work when crypto.randomUUID is not available', () => {
      // Mock crypto.randomUUID to be undefined
      const originalRandomUUID = global.crypto.randomUUID;
      // @ts-ignore
      global.crypto.randomUUID = undefined;
      
      const id = generateId();
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      
      expect(id).toMatch(uuidRegex);
      
      // Restore crypto
      global.crypto.randomUUID = originalRandomUUID;
    });
  });

  describe('generateGameStateHash', () => {
    const mockScoreData: SubmitScore = {
      player_name: 'TestPlayer',
      score: 1500,
      rounds: 15,
      final_progress: 100,
      final_bugs: 0,
      final_tech_debt: 5,
      game_duration_seconds: 300,
      cards_played: ['card1', 'card2', 'card3'],
    };

    it('should generate a consistent hash for the same data', () => {
      const hash1 = generateGameStateHash(mockScoreData);
      const hash2 = generateGameStateHash(mockScoreData);

      expect(hash1).toBe(hash2);
    });

    it('should generate different hashes for different data', () => {
      const hash1 = generateGameStateHash(mockScoreData);
      const hash2 = generateGameStateHash({
        ...mockScoreData,
        score: 2000,
      });

      expect(hash1).not.toBe(hash2);
    });

    it('should sort cards_played array for consistent hashing', () => {
      const data1 = {
        ...mockScoreData,
        cards_played: ['card3', 'card1', 'card2'],
      };
      const data2 = {
        ...mockScoreData,
        cards_played: ['card1', 'card2', 'card3'],
      };

      const hash1 = generateGameStateHash(data1);
      const hash2 = generateGameStateHash(data2);

      expect(hash1).toBe(hash2);
    });
  });

  describe('validateGameState', () => {
    const validScoreData: SubmitScore = {
      player_name: 'TestPlayer',
      score: 1500,
      rounds: 15,
      final_progress: 100,
      final_bugs: 0,
      final_tech_debt: 5,
      game_duration_seconds: 300,
      cards_played: ['card1', 'card2', 'card3', 'card4', 'card5', 'card6'],
    };

    it('should validate a correct game state', () => {
      const result = validateGameState(validScoreData);

      expect(result.valid).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should reject incomplete games', () => {
      const result = validateGameState({
        ...validScoreData,
        final_progress: 85,
      });

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Game must be completed (100% progress)');
    });

    it('should reject games ending with bugs', () => {
      const result = validateGameState({
        ...validScoreData,
        final_bugs: 3,
      });

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Game cannot end with bugs');
    });

    it('should reject unreasonably high scores', () => {
      const result = validateGameState({
        ...validScoreData,
        score: 10000,
        rounds: 50,
      });

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Score too high for number of rounds');
    });

    it('should reject games completed too quickly', () => {
      const result = validateGameState({
        ...validScoreData,
        game_duration_seconds: 5,
        rounds: 20,
      });

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Game completed too quickly');
    });

    it('should reject games with too few cards played', () => {
      const result = validateGameState({
        ...validScoreData,
        cards_played: ['card1', 'card2'],
      });

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Not enough cards played');
    });
  });

  describe('errorResponse', () => {
    it('should create a proper error response with default status', () => {
      const response = errorResponse('Test error');

      expect(response.status).toBe(400);
      expect(response.headers.get('Content-Type')).toBe('application/json');
    });

    it('should create a proper error response with custom status', () => {
      const response = errorResponse('Not found', 404);

      expect(response.status).toBe(404);
    });

    it('should format the response body correctly', async () => {
      const response = errorResponse('Test error', 500);
      const body = await response.json();

      expect(body).toEqual({
        success: false,
        error: 'Test error',
      });
    });
  });

  describe('successResponse', () => {
    it('should create a proper success response', () => {
      const data = { test: 'value' };
      const response = successResponse(data);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/json');
    });

    it('should format the response body correctly with data only', async () => {
      const data = { test: 'value' };
      const response = successResponse(data);
      const body = await response.json();

      expect(body).toEqual({
        success: true,
        data,
        message: undefined,
      });
    });

    it('should format the response body correctly with message', async () => {
      const data = { test: 'value' };
      const message = 'Operation successful';
      const response = successResponse(data, message);
      const body = await response.json();

      expect(body).toEqual({
        success: true,
        data,
        message,
      });
    });
  });

  describe('getClientIP', () => {
    it('should extract IP from CF-Connecting-IP header', () => {
      const request = new Request('https://example.com', {
        headers: {
          'CF-Connecting-IP': '192.168.1.1',
        },
      });

      const ip = getClientIP(request);
      expect(ip).toBe('192.168.1.1');
    });

    it('should extract IP from X-Forwarded-For header', () => {
      const request = new Request('https://example.com', {
        headers: {
          'X-Forwarded-For': '10.0.0.1, 192.168.1.1',
        },
      });

      const ip = getClientIP(request);
      expect(ip).toBe('10.0.0.1');
    });

    it('should extract IP from X-Real-IP header', () => {
      const request = new Request('https://example.com', {
        headers: {
          'X-Real-IP': '172.16.0.1',
        },
      });

      const ip = getClientIP(request);
      expect(ip).toBe('172.16.0.1');
    });

    it('should prioritize CF-Connecting-IP over other headers', () => {
      const request = new Request('https://example.com', {
        headers: {
          'CF-Connecting-IP': '192.168.1.1',
          'X-Forwarded-For': '10.0.0.1',
          'X-Real-IP': '172.16.0.1',
        },
      });

      const ip = getClientIP(request);
      expect(ip).toBe('192.168.1.1');
    });

    it('should return fallback IP when no headers are present', () => {
      const request = new Request('https://example.com');

      const ip = getClientIP(request);
      expect(ip).toBe('0.0.0.0');
    });

    it('should handle multiple IPs in X-Forwarded-For correctly', () => {
      const request = new Request('https://example.com', {
        headers: {
          'X-Forwarded-For': '  10.0.0.1  ,  192.168.1.1  ,  172.16.0.1  ',
        },
      });

      const ip = getClientIP(request);
      expect(ip).toBe('10.0.0.1');
    });
  });
});
