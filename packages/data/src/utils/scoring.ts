import type { GameState } from '../types';
import { GAME_END_STATE_WON } from '../types';

/**
 * Calculates the final score based on game performance
 * Score = Rounds Component (0-700) + Cards Component (0-200) + Time Component (0-100)
 */
export function calculateScore(gameState: GameState): number {
  if (gameState.endState !== GAME_END_STATE_WON) {
    return 0;
  }

  // Rounds component (0-700 points)
  // 10 rounds or less = 700 points, 50 rounds or more = 0 points
  const rounds = gameState.stats.currentRound;
  let roundScore: number;
  if (rounds <= 10) {
    roundScore = 700;
  } else if (rounds >= 50) {
    roundScore = 0;
  } else {
    // Linear decrease from 700 to 0 over rounds 10-50
    roundScore = 700 - ((rounds - 10) / (50 - 10)) * 700;
  }

  // Cards played component (0-200 points)
  // 10 cards or less = 200 points, (total deck size - 5) cards or more = 0 points
  // Total deck size is 30, so 25 cards or more = 0 points
  const cardsPlayed = gameState.stats.cardsPlayed;
  const maxCards = 25; // 30 total deck - 5
  let cardScore: number;
  if (cardsPlayed <= 10) {
    cardScore = 200;
  } else if (cardsPlayed >= maxCards) {
    cardScore = 0;
  } else {
    // Linear decrease from 200 to 0 over cards 10-25
    cardScore = 200 - ((cardsPlayed - 10) / (maxCards - 10)) * 200;
  }

  // Time component (0-100 points)
  // 30 seconds or less = 100 points, 5 minutes (300 seconds) or more = 0 points
  const timeMs = gameState.stats.endTime! - gameState.stats.startTime;
  const timeSeconds = timeMs / 1000;
  let timeScore: number;
  if (timeSeconds <= 30) {
    timeScore = 100;
  } else if (timeSeconds >= 300) {
    timeScore = 0;
  } else {
    // Linear decrease from 100 to 0 over 30-300 seconds
    timeScore = 100 - ((timeSeconds - 30) / (300 - 30)) * 100;
  }

  // Total score is sum of all components
  return Math.round(roundScore + cardScore + timeScore);
}
