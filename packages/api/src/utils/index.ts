import type { SubmitScore } from '../types/index.js';

/**
 * Generate a unique ID using crypto.randomUUID if available,
 * otherwise fall back to a timestamp-based approach
 */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback for environments without crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Generate a hash of the game state for basic anti-cheat validation
 */
export function generateGameStateHash(scoreData: SubmitScore): string {
  const dataString = JSON.stringify({
    player_name: scoreData.player_name,
    score: scoreData.score,
    rounds: scoreData.rounds,
    final_progress: scoreData.final_progress,
    final_bugs: scoreData.final_bugs,
    final_tech_debt: scoreData.final_tech_debt,
    cards_played: scoreData.cards_played.sort(), // Sort to ensure consistent hash
  });

  return hashString(dataString);
}

/**
 * Simple hash function for strings
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Validate that a score makes sense given the game state
 */
export function validateGameState(scoreData: SubmitScore): {
  valid: boolean;
  reason?: string;
} {
  // Basic validation rules

  // Must complete the game (100% progress) to get a score
  if (scoreData.final_progress !== 100) {
    return { valid: false, reason: 'Game must be completed (100% progress)' };
  }

  // Can't have bugs at the end
  if (scoreData.final_bugs > 0) {
    return { valid: false, reason: 'Game cannot end with bugs' };
  }

  // Score should be reasonable based on rounds
  const maxPossibleScore = 1000 + (100 - scoreData.rounds) * 10; // Rough estimate
  if (scoreData.score > maxPossibleScore) {
    return { valid: false, reason: 'Score too high for number of rounds' };
  }

  // Minimum reasonable game duration (should take at least some time)
  const minDuration = scoreData.rounds * 10; // At least 10 seconds per round
  if (scoreData.game_duration_seconds < minDuration) {
    return { valid: false, reason: 'Game completed too quickly' };
  }

  // Must have played at least some cards
  if (scoreData.cards_played.length < scoreData.rounds) {
    return {
      valid: false,
      reason: 'Not enough cards played for number of rounds',
    };
  }

  return { valid: true };
}

/**
 * Format error response
 */
export function errorResponse(message: string, status: number = 400) {
  return new Response(
    JSON.stringify({
      success: false,
      error: message,
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}

/**
 * Format success response
 */
export function successResponse(data: any, message?: string) {
  return new Response(
    JSON.stringify({
      success: true,
      data,
      message,
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}

/**
 * Get client IP for rate limiting
 */
export function getClientIP(request: Request): string {
  // Try various headers that might contain the real IP
  const forwardedFor =
    request.headers.get('CF-Connecting-IP') ||
    request.headers.get('X-Forwarded-For') ||
    request.headers.get('X-Real-IP');

  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  // Fallback to a default IP if none found
  return '0.0.0.0';
}
