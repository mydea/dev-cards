import type { Card } from '../types';
import {
  CARD_QUICK_BUG_FIX,
  CARD_WRITE_UNIT_TESTS,
  CARD_IMPLEMENT_FEATURE,
  CARD_CODE_REVIEW,
  CARD_REFACTOR_LEGACY,
  CARD_PAIR_PROGRAMMING,
  CARD_STACK_OVERFLOW,
  CARD_ALL_NIGHTER,
  CARD_DOCUMENTATION,
  CARD_EMERGENCY_HOTFIX,
  CARD_COFFEE_BREAK,
  CARD_DATABASE_MIGRATION,
  CARD_RUBBER_DUCK,
  CARD_TECH_DEBT_CLEANUP,
  CARD_INTEGRATION_TESTING,
  CARD_RUSH_IMPLEMENTATION,
  CARD_COPY_PASTE_SOLUTION,
  CARD_SKIP_CODE_REVIEW,
} from './card-definitions';

/**
 * Default deck of cards for the game
 */
export const DEFAULT_DECK: Card[] = [
  CARD_QUICK_BUG_FIX,
  CARD_WRITE_UNIT_TESTS,
  CARD_IMPLEMENT_FEATURE,
  CARD_CODE_REVIEW,
  CARD_REFACTOR_LEGACY,
  CARD_PAIR_PROGRAMMING,
  CARD_STACK_OVERFLOW,
  CARD_ALL_NIGHTER,
  CARD_DOCUMENTATION,
  CARD_EMERGENCY_HOTFIX,
  CARD_COFFEE_BREAK,
  CARD_DATABASE_MIGRATION,
  CARD_RUBBER_DUCK,
  CARD_TECH_DEBT_CLEANUP,
  CARD_INTEGRATION_TESTING,
  CARD_RUSH_IMPLEMENTATION,
  CARD_COPY_PASTE_SOLUTION,
  CARD_SKIP_CODE_REVIEW,
  // Add more copies of popular/balanced cards
  CARD_QUICK_BUG_FIX,
  CARD_IMPLEMENT_FEATURE,
  CARD_CODE_REVIEW,
  CARD_STACK_OVERFLOW,
  CARD_COFFEE_BREAK,
  CARD_RUBBER_DUCK,
  CARD_WRITE_UNIT_TESTS,
  CARD_REFACTOR_LEGACY,
  CARD_DOCUMENTATION,
  CARD_EMERGENCY_HOTFIX,
  CARD_RUSH_IMPLEMENTATION,
  CARD_COPY_PASTE_SOLUTION,
];

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
