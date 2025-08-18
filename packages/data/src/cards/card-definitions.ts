import type { Card } from '../types';
import {
  EFFECT_TYPE_ADD_PROGRESS,
  EFFECT_TYPE_ADD_BUGS,
  EFFECT_TYPE_REMOVE_BUGS,
  EFFECT_TYPE_ADD_TECHNICAL_DEBT,
  EFFECT_TYPE_REMOVE_TECHNICAL_DEBT,
  EFFECT_TYPE_SHUFFLE_DISCARD_TO_DECK,
  EFFECT_TYPE_DRAW_CARDS,
  REQUIREMENT_TYPE_SPEND_PP,
  REQUIREMENT_TYPE_DISCARD_CARDS,
  REQUIREMENT_TYPE_SEND_TO_GRAVEYARD,
  RANDOM_EFFECT_TYPE_STATIC,
  RANDOM_EFFECT_TYPE_COIN_FLIP,
} from '../types';

/**
 * Quick Bug Fix - Low cost, removes a bug
 */
export const CARD_QUICK_BUG_FIX = {
  id: 'quick-bug-fix',
  title: 'Quick Bug Fix',
  image: '/images/cards/quick-bug-fix.jpg',
  quote: 'It was just a missing semicolon...',
  requirements: [
    {
      type: REQUIREMENT_TYPE_SPEND_PP,
      value: 5,
    },
  ],
  effects: [
    {
      type: EFFECT_TYPE_REMOVE_BUGS,
      randomType: RANDOM_EFFECT_TYPE_STATIC,
      value: 1,
    },
  ],
} as const satisfies Card;

/**
 * Write Unit Tests - Prevents future bugs
 */
export const CARD_WRITE_UNIT_TESTS = {
  id: 'write-unit-tests',
  title: 'Write Unit Tests',
  image: '/images/cards/unit-tests.jpg',
  quote: 'Test all the things!',
  requirements: [
    {
      type: REQUIREMENT_TYPE_SPEND_PP,
      value: 7,
    },
  ],
  effects: [
    {
      type: EFFECT_TYPE_ADD_PROGRESS,
      randomType: RANDOM_EFFECT_TYPE_STATIC,
      value: 3,
    },
    {
      type: EFFECT_TYPE_REMOVE_BUGS,
      randomType: RANDOM_EFFECT_TYPE_STATIC,
      value: 2,
    },
  ],
} as const satisfies Card;

/**
 * Implement Feature - Core development work
 */
export const CARD_IMPLEMENT_FEATURE = {
  id: 'implement-feature',
  title: 'Implement Feature',
  image: '/images/cards/implement-feature.jpg',
  quote: 'Shipping is a feature!',
  requirements: [
    {
      type: REQUIREMENT_TYPE_SPEND_PP,
      value: 8,
    },
  ],
  effects: [
    {
      type: EFFECT_TYPE_ADD_PROGRESS,
      randomType: RANDOM_EFFECT_TYPE_STATIC,
      value: 8,
    },
    {
      type: EFFECT_TYPE_ADD_BUGS,
      randomType: RANDOM_EFFECT_TYPE_COIN_FLIP,
      headsValue: 0,
      tailsValue: 1,
    },
  ],
} as const satisfies Card;

/**
 * Code Review - Collaborative improvement
 */
export const CARD_CODE_REVIEW = {
  id: 'code-review',
  title: 'Code Review',
  image: '/images/cards/code-review.jpg',
  quote: 'Four eyes see more than two',
  requirements: [
    {
      type: REQUIREMENT_TYPE_SPEND_PP,
      value: 6,
    },
    {
      type: REQUIREMENT_TYPE_DISCARD_CARDS,
      value: 1,
    },
  ],
  effects: [
    {
      type: EFFECT_TYPE_ADD_PROGRESS,
      randomType: RANDOM_EFFECT_TYPE_STATIC,
      value: 2,
    },
    {
      type: EFFECT_TYPE_REMOVE_BUGS,
      randomType: RANDOM_EFFECT_TYPE_STATIC,
      value: 1,
    },
    {
      type: EFFECT_TYPE_DRAW_CARDS,
      randomType: RANDOM_EFFECT_TYPE_STATIC,
      value: 2,
    },
  ],
} as const satisfies Card;

/**
 * Refactor Legacy Code - Reduces technical debt
 */
export const CARD_REFACTOR_LEGACY = {
  id: 'refactor-legacy',
  title: 'Refactor Legacy Code',
  image: '/images/cards/refactor.jpg',
  quote: 'Sometimes you have to go backwards to go forwards',
  requirements: [
    {
      type: REQUIREMENT_TYPE_SPEND_PP,
      value: 7,
    },
  ],
  effects: [
    {
      type: EFFECT_TYPE_REMOVE_TECHNICAL_DEBT,
      randomType: RANDOM_EFFECT_TYPE_STATIC,
      value: 3,
    },
    {
      type: EFFECT_TYPE_ADD_PROGRESS,
      randomType: RANDOM_EFFECT_TYPE_STATIC,
      value: 1,
    },
  ],
} as const satisfies Card;

/**
 * Pair Programming - Collaborative development
 */
export const CARD_PAIR_PROGRAMMING = {
  id: 'pair-programming',
  title: 'Pair Programming',
  image: '/images/cards/pair-programming.jpg',
  quote: 'Two minds, one keyboard',
  requirements: [
    {
      type: REQUIREMENT_TYPE_SPEND_PP,
      value: 10,
    },
  ],
  effects: [
    {
      type: EFFECT_TYPE_ADD_PROGRESS,
      randomType: RANDOM_EFFECT_TYPE_STATIC,
      value: 6,
    },
    {
      type: EFFECT_TYPE_REMOVE_BUGS,
      randomType: RANDOM_EFFECT_TYPE_STATIC,
      value: 1,
    },
    {
      type: EFFECT_TYPE_REMOVE_TECHNICAL_DEBT,
      randomType: RANDOM_EFFECT_TYPE_STATIC,
      value: 1,
    },
  ],
} as const satisfies Card;

/**
 * Stack Overflow Research - Finding solutions
 */
export const CARD_STACK_OVERFLOW = {
  id: 'stack-overflow',
  title: 'Stack Overflow Research',
  image: '/images/cards/stack-overflow.jpg',
  quote: 'Someone else has definitely solved this before',
  requirements: [
    {
      type: REQUIREMENT_TYPE_SPEND_PP,
      value: 5,
    },
  ],
  effects: [
    {
      type: EFFECT_TYPE_ADD_PROGRESS,
      randomType: RANDOM_EFFECT_TYPE_COIN_FLIP,
      headsValue: 4,
      tailsValue: 1,
    },
  ],
} as const satisfies Card;

/**
 * All-Nighter - Risky but potentially rewarding
 */
export const CARD_ALL_NIGHTER = {
  id: 'all-nighter',
  title: 'Pull an All-Nighter',
  image: '/images/cards/all-nighter.jpg',
  quote: "Coffee is a programmer's best friend",
  requirements: [
    {
      type: REQUIREMENT_TYPE_SPEND_PP,
      value: 3,
    },
    {
      type: REQUIREMENT_TYPE_SEND_TO_GRAVEYARD,
      value: 2,
    },
  ],
  effects: [
    {
      type: EFFECT_TYPE_ADD_PROGRESS,
      randomType: RANDOM_EFFECT_TYPE_STATIC,
      value: 10,
    },
    {
      type: EFFECT_TYPE_ADD_BUGS,
      randomType: RANDOM_EFFECT_TYPE_STATIC,
      value: 2,
    },
    {
      type: EFFECT_TYPE_ADD_TECHNICAL_DEBT,
      randomType: RANDOM_EFFECT_TYPE_STATIC,
      value: 3,
    },
  ],
} as const satisfies Card;

/**
 * Documentation Sprint - Important but not exciting
 */
export const CARD_DOCUMENTATION = {
  id: 'documentation',
  title: 'Documentation Sprint',
  image: '/images/cards/documentation.jpg',
  quote: 'Future you will thank present you',
  requirements: [
    {
      type: REQUIREMENT_TYPE_SPEND_PP,
      value: 7,
    },
  ],
  effects: [
    {
      type: EFFECT_TYPE_ADD_PROGRESS,
      randomType: RANDOM_EFFECT_TYPE_STATIC,
      value: 5,
    },
    {
      type: EFFECT_TYPE_REMOVE_TECHNICAL_DEBT,
      randomType: RANDOM_EFFECT_TYPE_STATIC,
      value: 1,
    },
  ],
} as const satisfies Card;

/**
 * Emergency Hotfix - Quick but messy solution
 */
export const CARD_EMERGENCY_HOTFIX = {
  id: 'emergency-hotfix',
  title: 'Emergency Hotfix',
  image: '/images/cards/hotfix.jpg',
  quote: 'Production is down! Ship it now!',
  requirements: [
    {
      type: REQUIREMENT_TYPE_SPEND_PP,
      value: 6,
    },
  ],
  effects: [
    {
      type: EFFECT_TYPE_ADD_PROGRESS,
      randomType: RANDOM_EFFECT_TYPE_STATIC,
      value: 7,
    },
    {
      type: EFFECT_TYPE_REMOVE_BUGS,
      randomType: RANDOM_EFFECT_TYPE_STATIC,
      value: 1,
    },
    {
      type: EFFECT_TYPE_ADD_TECHNICAL_DEBT,
      randomType: RANDOM_EFFECT_TYPE_STATIC,
      value: 2,
    },
  ],
} as const satisfies Card;

/**
 * Coffee Break - Restore energy and perspective
 */
export const CARD_COFFEE_BREAK = {
  id: 'coffee-break',
  title: 'Coffee Break',
  image: '/images/cards/coffee-break.jpg',
  quote: 'Sometimes the best code is written away from the keyboard',
  requirements: [
    {
      type: REQUIREMENT_TYPE_SPEND_PP,
      value: 4,
    },
  ],
  effects: [
    {
      type: EFFECT_TYPE_SHUFFLE_DISCARD_TO_DECK,
      randomType: RANDOM_EFFECT_TYPE_STATIC,
      value: 3,
    },
    {
      type: EFFECT_TYPE_DRAW_CARDS,
      randomType: RANDOM_EFFECT_TYPE_STATIC,
      value: 1,
    },
  ],
} as const satisfies Card;

/**
 * Database Migration - Risky but necessary
 */
export const CARD_DATABASE_MIGRATION = {
  id: 'database-migration',
  title: 'Database Migration',
  image: '/images/cards/database-migration.jpg',
  quote: 'Pray to the backup gods',
  requirements: [
    {
      type: REQUIREMENT_TYPE_SPEND_PP,
      value: 9,
    },
  ],
  effects: [
    {
      type: EFFECT_TYPE_ADD_PROGRESS,
      randomType: RANDOM_EFFECT_TYPE_COIN_FLIP,
      headsValue: 12,
      tailsValue: 3,
    },
    {
      type: EFFECT_TYPE_ADD_BUGS,
      randomType: RANDOM_EFFECT_TYPE_COIN_FLIP,
      headsValue: 0,
      tailsValue: 3,
    },
  ],
} as const satisfies Card;

/**
 * Rubber Duck Debugging - Classic problem-solving
 */
export const CARD_RUBBER_DUCK = {
  id: 'rubber-duck',
  title: 'Rubber Duck Debugging',
  image: '/images/cards/rubber-duck.jpg',
  quote: 'Explain it to the duck',
  requirements: [
    {
      type: REQUIREMENT_TYPE_SPEND_PP,
      value: 5,
    },
  ],
  effects: [
    {
      type: EFFECT_TYPE_REMOVE_BUGS,
      randomType: RANDOM_EFFECT_TYPE_COIN_FLIP,
      headsValue: 2,
      tailsValue: 1,
    },
    {
      type: EFFECT_TYPE_ADD_PROGRESS,
      randomType: RANDOM_EFFECT_TYPE_STATIC,
      value: 1,
    },
  ],
} as const satisfies Card;

/**
 * Technical Debt Cleanup - Long-term investment
 */
export const CARD_TECH_DEBT_CLEANUP = {
  id: 'tech-debt-cleanup',
  title: 'Technical Debt Cleanup',
  image: '/images/cards/tech-debt-cleanup.jpg',
  quote: 'Pay down the debt before it grows',
  requirements: [
    {
      type: REQUIREMENT_TYPE_SPEND_PP,
      value: 8,
    },
    {
      type: REQUIREMENT_TYPE_DISCARD_CARDS,
      value: 2,
    },
  ],
  effects: [
    {
      type: EFFECT_TYPE_REMOVE_TECHNICAL_DEBT,
      randomType: RANDOM_EFFECT_TYPE_STATIC,
      value: 5,
    },
  ],
} as const satisfies Card;

/**
 * Integration Testing - Comprehensive validation
 */
export const CARD_INTEGRATION_TESTING = {
  id: 'integration-testing',
  title: 'Integration Testing',
  image: '/images/cards/integration-testing.jpg',
  quote: 'Test how the pieces fit together',
  requirements: [
    {
      type: REQUIREMENT_TYPE_SPEND_PP,
      value: 8,
    },
  ],
  effects: [
    {
      type: EFFECT_TYPE_ADD_PROGRESS,
      randomType: RANDOM_EFFECT_TYPE_STATIC,
      value: 4,
    },
    {
      type: EFFECT_TYPE_REMOVE_BUGS,
      randomType: RANDOM_EFFECT_TYPE_STATIC,
      value: 3,
    },
    {
      type: EFFECT_TYPE_REMOVE_TECHNICAL_DEBT,
      randomType: RANDOM_EFFECT_TYPE_STATIC,
      value: 1,
    },
  ],
} as const satisfies Card;

/**
 * Rush Implementation - Fast progress but creates technical debt
 */
export const CARD_RUSH_IMPLEMENTATION = {
  id: 'rush-implementation',
  title: 'Rush Implementation',
  image: '/images/cards/rush-implementation.jpg',
  quote: "We'll fix it in the next sprint... maybe",
  requirements: [
    {
      type: REQUIREMENT_TYPE_SPEND_PP,
      value: 6,
    },
  ],
  effects: [
    {
      type: EFFECT_TYPE_ADD_PROGRESS,
      randomType: RANDOM_EFFECT_TYPE_STATIC,
      value: 9,
    },
    {
      type: EFFECT_TYPE_ADD_TECHNICAL_DEBT,
      randomType: RANDOM_EFFECT_TYPE_STATIC,
      value: 2,
    },
  ],
} as const satisfies Card;

/**
 * Copy-Paste Solution - Quick progress by reusing code
 */
export const CARD_COPY_PASTE_SOLUTION = {
  id: 'copy-paste-solution',
  title: 'Copy-Paste Solution',
  image: '/images/cards/copy-paste.jpg',
  quote: 'Why reinvent the wheel? Ctrl+C, Ctrl+V!',
  requirements: [
    {
      type: REQUIREMENT_TYPE_SPEND_PP,
      value: 5,
    },
  ],
  effects: [
    {
      type: EFFECT_TYPE_ADD_PROGRESS,
      randomType: RANDOM_EFFECT_TYPE_STATIC,
      value: 7,
    },
    {
      type: EFFECT_TYPE_ADD_TECHNICAL_DEBT,
      randomType: RANDOM_EFFECT_TYPE_STATIC,
      value: 1,
    },
  ],
} as const satisfies Card;

/**
 * Skip Code Review - Save time but risk quality
 */
export const CARD_SKIP_CODE_REVIEW = {
  id: 'skip-code-review',
  title: 'Skip Code Review',
  image: '/images/cards/skip-review.jpg',
  quote: 'Trust me, this code is perfect',
  requirements: [
    {
      type: REQUIREMENT_TYPE_SPEND_PP,
      value: 4,
    },
  ],
  effects: [
    {
      type: EFFECT_TYPE_ADD_PROGRESS,
      randomType: RANDOM_EFFECT_TYPE_STATIC,
      value: 6,
    },
    {
      type: EFFECT_TYPE_ADD_TECHNICAL_DEBT,
      randomType: RANDOM_EFFECT_TYPE_COIN_FLIP,
      headsValue: 1,
      tailsValue: 3,
    },
  ],
} as const satisfies Card;
