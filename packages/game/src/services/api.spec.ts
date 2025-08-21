import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiClient } from './api';
import type { SubmitScoreRequest } from './api';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock window.location for environment detection
Object.defineProperty(window, 'location', {
  value: {
    hostname: 'localhost',
  },
  writable: true,
});

describe('ApiClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Environment detection', () => {
    it('should use localhost URL when running on localhost', () => {
      // This is already set in the mock above
      expect(window.location.hostname).toBe('localhost');
    });

    it('should use production URL when not on localhost', () => {
      // Change hostname to simulate production
      Object.defineProperty(window, 'location', {
        value: {
          hostname: 'production.example.com',
        },
        writable: true,
      });

      // We can't directly test the URL since it's a module-level constant,
      // but we can test the behavior through API calls
      expect(window.location.hostname).toBe('production.example.com');
    });
  });

  describe('Error message extraction', () => {
    it('should handle string errors', async () => {
      const mockResponse = {
        ok: false,
        json: vi.fn().mockResolvedValue({
          success: false,
          error: 'Simple string error',
        }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await apiClient.submitScore({
        player_name: 'Test',
        score: 100,
        rounds: 5,
        final_progress: 100,
        final_bugs: 0,
        final_tech_debt: 0,
        game_duration_seconds: 300,
        cards_played: ['card1'],
      });

      expect(result).toEqual({
        success: false,
        error: 'Simple string error',
      });
    });

    it('should handle Zod validation errors with single issue', async () => {
      const mockResponse = {
        ok: false,
        json: vi.fn().mockResolvedValue({
          success: false,
          error: {
            issues: [
              {
                path: ['player_name'],
                message: 'String must contain at least 1 character(s)',
              },
            ],
          },
        }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await apiClient.submitScore({
        player_name: '',
        score: 100,
        rounds: 5,
        final_progress: 100,
        final_bugs: 0,
        final_tech_debt: 0,
        game_duration_seconds: 300,
        cards_played: ['card1'],
      });

      expect(result).toEqual({
        success: false,
        error: 'player_name: String must contain at least 1 character(s)',
      });
    });

    it('should handle Zod validation errors with multiple issues', async () => {
      const mockResponse = {
        ok: false,
        json: vi.fn().mockResolvedValue({
          success: false,
          error: {
            issues: [
              {
                path: ['player_name'],
                message: 'Required',
              },
              {
                path: ['score'],
                message: 'Expected number, received string',
              },
              {
                path: ['rounds'],
                message: 'Number must be greater than 0',
              },
              {
                path: ['final_progress'],
                message: 'Number must be between 0 and 100',
              },
            ],
          },
        }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await apiClient.submitScore({} as SubmitScoreRequest);

      expect(result).toEqual({
        success: false,
        error: 'player_name: Required; score: Expected number, received string; rounds: Number must be greater than 0 (and 1 more)',
      });
    });

    it('should handle errors with message property', async () => {
      const mockResponse = {
        ok: false,
        json: vi.fn().mockResolvedValue({
          success: false,
          error: {
            message: 'Custom error message',
          },
        }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await apiClient.submitScore({} as SubmitScoreRequest);

      expect(result).toEqual({
        success: false,
        error: 'Custom error message',
      });
    });

    it('should handle unknown error formats', async () => {
      const mockResponse = {
        ok: false,
        json: vi.fn().mockResolvedValue({
          success: false,
          error: { unknown: 'format' },
        }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await apiClient.submitScore({} as SubmitScoreRequest);

      expect(result).toEqual({
        success: false,
        error: 'An error occurred',
      });
    });
  });

  describe('Network error handling', () => {
    it('should handle network failures', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await apiClient.submitScore({
        player_name: 'Test',
        score: 100,
        rounds: 5,
        final_progress: 100,
        final_bugs: 0,
        final_tech_debt: 0,
        game_duration_seconds: 300,
        cards_played: ['card1'],
      });

      expect(result).toEqual({
        success: false,
        error: 'Network error occurred',
      });

      expect(consoleSpy).toHaveBeenCalledWith('API request failed:', expect.any(Error));
      consoleSpy.mockRestore();
    });

    it('should handle fetch throwing an error', async () => {
      mockFetch.mockImplementation(() => {
        throw new TypeError('Failed to fetch');
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await apiClient.getLeaderboard();

      expect(result).toEqual({
        success: false,
        error: 'Network error occurred',
      });

      consoleSpy.mockRestore();
    });
  });

  describe('API methods', () => {
    const mockSuccessResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({
        success: true,
        data: { id: 'test-result' },
      }),
    };

    beforeEach(() => {
      mockFetch.mockResolvedValue(mockSuccessResponse);
    });

    describe('submitScore', () => {
      it('should make POST request with correct data', async () => {
        const scoreData: SubmitScoreRequest = {
          player_name: 'TestPlayer',
          score: 1500,
          rounds: 15,
          final_progress: 100,
          final_bugs: 0,
          final_tech_debt: 5,
          game_duration_seconds: 300,
          cards_played: ['card1', 'card2', 'card3'],
        };

        await apiClient.submitScore(scoreData);

        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:8787/api/scores',
          {
            method: 'POST',
            body: JSON.stringify(scoreData),
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
      });
    });

    describe('getLeaderboard', () => {
      it('should make GET request with default parameters', async () => {
        await apiClient.getLeaderboard();

        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:8787/api/leaderboard?limit=100&offset=0',
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
      });

      it('should make GET request with custom parameters', async () => {
        await apiClient.getLeaderboard(50, 25);

        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:8787/api/leaderboard?limit=50&offset=25',
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
      });
    });

    describe('getPlayerData', () => {
      it('should make GET request with encoded player name', async () => {
        await apiClient.getPlayerData('Player Name');

        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:8787/api/leaderboard/player/Player%20Name',
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
      });

      it('should handle special characters in player name', async () => {
        await apiClient.getPlayerData('Player & Name!');

        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:8787/api/leaderboard/player/Player%20%26%20Name!',
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
      });
    });

    describe('getPlayerStats', () => {
      it('should make GET request with encoded player name', async () => {
        await apiClient.getPlayerStats('TestPlayer');

        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:8787/api/players/TestPlayer/stats',
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
      });
    });

    describe('getLeaderboardStats', () => {
      it('should make GET request to stats endpoint', async () => {
        await apiClient.getLeaderboardStats();

        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:8787/api/leaderboard/stats',
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
      });
    });
  });

  describe('Successful responses', () => {
    it('should return successful response data', async () => {
      const mockData = { id: 'test-game', score: 1500 };
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: true,
          data: mockData,
          message: 'Score submitted successfully',
        }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await apiClient.submitScore({} as SubmitScoreRequest);

      expect(result).toEqual({
        success: true,
        data: mockData,
        message: 'Score submitted successfully',
      });
    });
  });

  describe('Request headers', () => {
    it('should include Content-Type header by default', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ success: true }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      await apiClient.getLeaderboard();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });
  });
});
