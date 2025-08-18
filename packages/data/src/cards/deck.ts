import type { Card } from '../types';

/**
 * Default deck of cards for the game
 * This will be populated with actual card definitions
 */
export const DEFAULT_DECK: Card[] = [];

/**
 * Creates a shuffled deck from the default cards
 */
export function createDeck(): Card[] {
  return [...DEFAULT_DECK];
}

/**
 * Shuffles an array of cards using Fisher-Yates algorithm
 */
export function shuffleDeck<T>(deck: T[]): T[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
