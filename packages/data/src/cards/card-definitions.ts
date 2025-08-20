import type { Card } from '../types';
import {
  EFFECT_TYPE_ADD_PROGRESS,
  EFFECT_TYPE_ADD_BUGS,
  EFFECT_TYPE_REMOVE_BUGS,
  EFFECT_TYPE_ADD_TECHNICAL_DEBT,
  EFFECT_TYPE_REMOVE_TECHNICAL_DEBT,
  EFFECT_TYPE_DRAW_CARDS,
  REQUIREMENT_TYPE_SPEND_PP,
  REQUIREMENT_TYPE_DISCARD_CARDS,
  RANDOM_EFFECT_TYPE_STATIC,
  RANDOM_EFFECT_TYPE_COIN_FLIP,
} from '../types';

/**
 * Quick Bug Fix - Low cost, removes a bug
 */
export const CARD_QUICK_BUG_FIX = {
  id: 'quick-bug-fix',
  title: 'Quick Bug Fix',
  image: '/assets/images/cards/quick-bug-fix.png',
  quote: 'It was just a missing semicolon...',
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
      value: 1,
    },
    {
      type: EFFECT_TYPE_REMOVE_BUGS,
      randomType: RANDOM_EFFECT_TYPE_STATIC,
      value: 1,
    },
    {
      type: EFFECT_TYPE_ADD_TECHNICAL_DEBT,
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
  image: '/assets/images/cards/unit-tests.png',
  quote: 'Test all the things!',
  requirements: [
    {
      type: REQUIREMENT_TYPE_SPEND_PP,
      value: 11,
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
  image: '/assets/images/cards/implement-feature.png',
  quote: 'Shipping is a feature!',
  requirements: [
    {
      type: REQUIREMENT_TYPE_SPEND_PP,
      value: 15,
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
    {
      type: EFFECT_TYPE_ADD_TECHNICAL_DEBT,
      randomType: RANDOM_EFFECT_TYPE_STATIC,
      value: 2,
    },
  ],
} as const satisfies Card;

/**
 * Code Review - Collaborative improvement
 */
export const CARD_CODE_REVIEW = {
  id: 'code-review',
  title: 'Code Review',
  image: '/assets/images/cards/code-review.png',
  quote: 'Four eyes see more than two',
  requirements: [
    {
      type: REQUIREMENT_TYPE_SPEND_PP,
      value: 7,
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
      value: 3,
    },
    {
      type: EFFECT_TYPE_REMOVE_BUGS,
      randomType: RANDOM_EFFECT_TYPE_STATIC,
      value: 1,
    },
    {
      type: EFFECT_TYPE_DRAW_CARDS,
      randomType: RANDOM_EFFECT_TYPE_STATIC,
      value: 1,
    },
  ],
} as const satisfies Card;

/**
 * Refactor Legacy Code - Reduces technical debt
 */
export const CARD_REFACTOR_LEGACY = {
  id: 'refactor-legacy',
  title: 'Refactor Legacy Code',
  image: '/assets/images/cards/refactor.png',
  quote: 'Sometimes you have to go backwards to go forwards',
  requirements: [
    {
      type: REQUIREMENT_TYPE_SPEND_PP,
      value: 12,
    },
  ],
  effects: [
    {
      type: EFFECT_TYPE_ADD_PROGRESS,
      randomType: RANDOM_EFFECT_TYPE_STATIC,
      value: 1,
    },
    {
      type: EFFECT_TYPE_REMOVE_TECHNICAL_DEBT,
      randomType: RANDOM_EFFECT_TYPE_STATIC,
      value: 3,
    },
  ],
} as const satisfies Card;

/**
 * Pair Programming - Collaborative development
 */
export const CARD_PAIR_PROGRAMMING = {
  id: 'pair-programming',
  title: 'Pair Programming',
  image: '/assets/images/cards/pair-programming.png',
  quote: 'Two minds, one keyboard',
  requirements: [
    {
      type: REQUIREMENT_TYPE_SPEND_PP,
      value: 16,
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
      value: 2,
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
  image: '/assets/images/cards/stack-overflow.png',
  quote: 'Someone else has definitely solved this before',
  requirements: [
    {
      type: REQUIREMENT_TYPE_SPEND_PP,
      value: 6,
    },
  ],
  effects: [
    {
      type: EFFECT_TYPE_ADD_PROGRESS,
      randomType: RANDOM_EFFECT_TYPE_COIN_FLIP,
      headsValue: 4,
      tailsValue: 1,
    },
    {
      type: EFFECT_TYPE_ADD_TECHNICAL_DEBT,
      randomType: RANDOM_EFFECT_TYPE_COIN_FLIP,
      headsValue: 0,
      tailsValue: 2,
    },
  ],
} as const satisfies Card;

/**
 * All-Nighter - Risky but potentially rewarding
 */
export const CARD_ALL_NIGHTER = {
  id: 'all-nighter',
  title: 'Pull an All-Nighter',
  image: '/assets/images/cards/pull-all-nighter.png',
  quote: "Coffee is a programmer's best friend",
  requirements: [
    {
      type: REQUIREMENT_TYPE_SPEND_PP,
      value: 5,
    },
    {
      type: REQUIREMENT_TYPE_DISCARD_CARDS,
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
      value: 4,
    },
  ],
} as const satisfies Card;

/**
 * Documentation Sprint - Important but not exciting
 */
export const CARD_DOCUMENTATION = {
  id: 'documentation',
  title: 'Documentation Sprint',
  image: '/assets/images/cards/documentation.png',
  quote: 'Future you will thank present you',
  requirements: [
    {
      type: REQUIREMENT_TYPE_SPEND_PP,
      value: 11,
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
  image: '/assets/images/cards/emergency-bugfix.png',
  quote: 'Production is down! Ship it now!',
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
      value: 3,
    },
  ],
} as const satisfies Card;

/**
 * Coffee Break - Restore energy and perspective
 */
export const CARD_COFFEE_BREAK = {
  id: 'coffee-break',
  title: 'Coffee Break',
  image: '/assets/images/cards/coffee-break.png',
  quote: 'Sometimes the best code is written away from the keyboard',
  requirements: [
    {
      type: REQUIREMENT_TYPE_SPEND_PP,
      value: 1,
    },
  ],
  effects: [
    {
      type: EFFECT_TYPE_DRAW_CARDS,
      randomType: RANDOM_EFFECT_TYPE_STATIC,
      value: 3,
    },
  ],
} as const satisfies Card;

/**
 * Database Migration - Risky but necessary
 */
export const CARD_DATABASE_MIGRATION = {
  id: 'database-migration',
  title: 'Database Migration',
  image: '/assets/images/cards/database-migration.png',
  quote: 'Pray to the backup gods',
  requirements: [
    {
      type: REQUIREMENT_TYPE_SPEND_PP,
      value: 13,
    },
  ],
  effects: [
    {
      type: EFFECT_TYPE_ADD_PROGRESS,
      randomType: RANDOM_EFFECT_TYPE_COIN_FLIP,
      headsValue: 10,
      tailsValue: 4,
    },
    {
      type: EFFECT_TYPE_ADD_BUGS,
      randomType: RANDOM_EFFECT_TYPE_COIN_FLIP,
      headsValue: 0,
      tailsValue: 2,
    },
    {
      type: EFFECT_TYPE_ADD_TECHNICAL_DEBT,
      randomType: RANDOM_EFFECT_TYPE_COIN_FLIP,
      headsValue: 1,
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
  image: '/assets/images/cards/rubber-ducking.png',
  quote: 'Explain it to the duck',
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
      value: 1,
    },
    {
      type: EFFECT_TYPE_REMOVE_BUGS,
      randomType: RANDOM_EFFECT_TYPE_COIN_FLIP,
      headsValue: 2,
      tailsValue: 1,
    },
    {
      type: EFFECT_TYPE_ADD_TECHNICAL_DEBT,
      randomType: RANDOM_EFFECT_TYPE_COIN_FLIP,
      headsValue: 0,
      tailsValue: 1,
    },
  ],
} as const satisfies Card;

/**
 * Technical Debt Cleanup - Long-term investment
 */
export const CARD_TECH_DEBT_CLEANUP = {
  id: 'tech-debt-cleanup',
  title: 'Technical Debt Cleanup',
  image: '/assets/images/cards/tech-debt-cleanup.png',
  quote: 'Pay down the debt before it grows',
  requirements: [
    {
      type: REQUIREMENT_TYPE_SPEND_PP,
      value: 5,
    },
    {
      type: REQUIREMENT_TYPE_DISCARD_CARDS,
      value: 1,
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
  image: '/assets/images/cards/integration-testing.png',
  quote: 'Test how the pieces fit together',
  requirements: [
    {
      type: REQUIREMENT_TYPE_SPEND_PP,
      value: 14,
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
  image: '/assets/images/cards/rush-implementation.png',
  quote: "We'll fix it in the next sprint... maybe",
  requirements: [
    {
      type: REQUIREMENT_TYPE_SPEND_PP,
      value: 12,
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
      value: 3,
    },
  ],
} as const satisfies Card;

/**
 * Copy-Paste Solution - Quick progress by reusing code
 */
export const CARD_COPY_PASTE_SOLUTION = {
  id: 'copy-paste-solution',
  title: 'Copy-Paste Solution',
  image: '/assets/images/cards/copy-paste.png',
  quote: 'Why reinvent the wheel? Ctrl+C, Ctrl+V!',
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
      value: 7,
    },
    {
      type: EFFECT_TYPE_ADD_TECHNICAL_DEBT,
      randomType: RANDOM_EFFECT_TYPE_STATIC,
      value: 2,
    },
  ],
} as const satisfies Card;

/**
 * Skip Code Review - Save time but risk quality
 */
export const CARD_SKIP_CODE_REVIEW = {
  id: 'skip-code-review',
  title: 'Skip Code Review',
  image: '/assets/images/cards/skip-review.png',
  quote: 'Trust me, this code is perfect',
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
      value: 6,
    },
    {
      type: EFFECT_TYPE_ADD_BUGS,
      randomType: RANDOM_EFFECT_TYPE_COIN_FLIP,
      headsValue: 0,
      tailsValue: 2,
    },
    {
      type: EFFECT_TYPE_ADD_TECHNICAL_DEBT,
      randomType: RANDOM_EFFECT_TYPE_COIN_FLIP,
      headsValue: 1,
      tailsValue: 3,
    },
  ],
} as const satisfies Card;

/**
 * Setup Sentry - Error monitoring and bug prevention
 */
export const CARD_SETUP_SENTRY = {
  id: 'setup-sentry',
  title: 'Setup Sentry',
  image: '/assets/images/cards/setup-sentry.png',
  quote: 'Know about bugs before your users do',
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
      value: 2,
    },
    {
      type: EFFECT_TYPE_REMOVE_BUGS,
      randomType: RANDOM_EFFECT_TYPE_STATIC,
      value: 4,
    },
  ],
} as const satisfies Card;

/**
 * Implement MVP - Rapid development with consequences
 */
export const CARD_IMPLEMENT_MVP = {
  id: 'implement-mvp',
  title: 'Implement MVP',
  image: '/assets/images/cards/implement-mvp.png',
  quote: 'Ship the minimum viable product',
  requirements: [
    {
      type: REQUIREMENT_TYPE_SPEND_PP,
      value: 13,
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
      headsValue: 1,
      tailsValue: 2,
    },
    {
      type: EFFECT_TYPE_ADD_TECHNICAL_DEBT,
      randomType: RANDOM_EFFECT_TYPE_COIN_FLIP,
      headsValue: 0,
      tailsValue: 2,
    },
  ],
} as const satisfies Card;

/**
 * Deep Focus Time - High productivity through concentration
 */
export const CARD_DEEP_FOCUS_TIME = {
  id: 'deep-focus-time',
  title: 'Deep Focus Time',
  image: '/assets/images/cards/deep-focus-time.png',
  quote: 'In the zone, nothing can stop you',
  requirements: [
    {
      type: REQUIREMENT_TYPE_SPEND_PP,
      value: 20,
    },
  ],
  effects: [
    {
      type: EFFECT_TYPE_ADD_PROGRESS,
      randomType: RANDOM_EFFECT_TYPE_STATIC,
      value: 10,
    },
  ],
} as const satisfies Card;

/**
 * Vibe Coding - Productive but unpredictable session
 */
export const CARD_VIBE_CODING = {
  id: 'vibe-coding',
  title: 'Vibe Coding',
  image: '/assets/images/cards/vibe-coding.png',
  quote: 'Just feeling the flow... whatever happens, happens',
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
      headsValue: 15,
      tailsValue: 5,
    },
    {
      type: EFFECT_TYPE_ADD_TECHNICAL_DEBT,
      randomType: RANDOM_EFFECT_TYPE_COIN_FLIP,
      headsValue: 2,
      tailsValue: 5,
    },
    {
      type: EFFECT_TYPE_ADD_BUGS,
      randomType: RANDOM_EFFECT_TYPE_COIN_FLIP,
      headsValue: 1,
      tailsValue: 2,
    },
  ],
} as const satisfies Card;
