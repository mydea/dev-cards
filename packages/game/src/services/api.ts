// API client for Draw It, Play It, Ship It leaderboard

const API_BASE_URL =
  typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:8787/api'
    : 'https://dev-cards-api-production.francesconovy.workers.dev/api';

export interface SubmitScoreRequest {
  player_name: string;
  score: number;
  rounds: number;
  final_progress: number;
  final_bugs: number;
  final_tech_debt: number;
  game_duration_seconds: number;
  cards_played: string[];
}

export interface LeaderboardEntry {
  game_id: string;
  player_name: string;
  score: number;
  rounds: number;
  final_progress: number;
  final_bugs: number;
  final_tech_debt: number;
  game_duration_seconds: number;
  completed_at: string;
  rank: number;
}

export interface PlayerStats {
  player_name: string;
  total_games: number;
  best_score: number;
  first_game: string;
  latest_game: string;
  avg_score: number;
  avg_rounds: number;
  best_rounds: number;
  avg_duration: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  pagination: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface PlayerResponse {
  player_name: string;
  stats: PlayerStats;
  games: LeaderboardEntry[];
}

export interface LeaderboardStatsResponse {
  total_games: number;
  total_players: number;
}

class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      // If the response has validation errors, extract a readable message
      if (!response.ok && data.error) {
        return {
          success: false,
          error: this.extractErrorMessage(data.error),
        };
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: 'Network error occurred',
      };
    }
  }

  private extractErrorMessage(error: any): string {
    // Handle string errors
    if (typeof error === 'string') {
      return error;
    }

    // Handle Zod validation errors with issues array
    if (error.issues && Array.isArray(error.issues)) {
      const issues = error.issues;
      if (issues.length > 0) {
        // Show multiple validation errors if there are several
        if (issues.length === 1) {
          const issue = issues[0];
          if (issue.path && issue.path.length > 0) {
            const fieldPath = issue.path.join('.');
            return `${fieldPath}: ${issue.message}`;
          }
          return issue.message;
        } else {
          // Multiple issues - show the first few with field paths
          const errorMessages = issues.slice(0, 3).map((issue: any) => {
            if (issue.path && issue.path.length > 0) {
              const fieldPath = issue.path.join('.');
              return `${fieldPath}: ${issue.message}`;
            }
            return issue.message;
          });
          const moreCount = issues.length - 3;
          const suffix = moreCount > 0 ? ` (and ${moreCount} more)` : '';
          return errorMessages.join('; ') + suffix;
        }
      }
    }

    // Handle objects with message property
    if (error.message) {
      return error.message;
    }

    // Fallback
    return 'An error occurred';
  }

  async submitScore(scoreData: SubmitScoreRequest): Promise<ApiResponse<any>> {
    return this.request('/scores', {
      method: 'POST',
      body: JSON.stringify(scoreData),
    });
  }

  async getLeaderboard(
    limit: number = 100,
    offset: number = 0
  ): Promise<ApiResponse<LeaderboardResponse>> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });
    return this.request(`/leaderboard?${params}`);
  }

  async getPlayerData(
    playerName: string
  ): Promise<ApiResponse<PlayerResponse>> {
    return this.request(
      `/leaderboard/player/${encodeURIComponent(playerName)}`
    );
  }

  async getPlayerStats(playerName: string): Promise<ApiResponse<PlayerStats>> {
    return this.request(`/players/${encodeURIComponent(playerName)}/stats`);
  }

  async getLeaderboardStats(): Promise<ApiResponse<LeaderboardStatsResponse>> {
    return this.request('/leaderboard/stats');
  }
}

export const apiClient = new ApiClient();
