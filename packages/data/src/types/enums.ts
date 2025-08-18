/**
 * Card effect types that can be applied to the game state
 */
export const EFFECT_TYPE = {
  ADD_PROGRESS: 'ADD_PROGRESS',
  REMOVE_PROGRESS: 'REMOVE_PROGRESS',
  ADD_BUGS: 'ADD_BUGS',
  REMOVE_BUGS: 'REMOVE_BUGS',
  ADD_TECHNICAL_DEBT: 'ADD_TECHNICAL_DEBT',
  REMOVE_TECHNICAL_DEBT: 'REMOVE_TECHNICAL_DEBT',
  SHUFFLE_DISCARD_TO_DECK: 'SHUFFLE_DISCARD_TO_DECK',
  DRAW_CARDS: 'DRAW_CARDS',
} as const;

export type EffectType = (typeof EFFECT_TYPE)[keyof typeof EFFECT_TYPE];

/**
 * Card requirement types that must be met to play a card
 */
export const REQUIREMENT_TYPE = {
  SPEND_PP: 'SPEND_PP',
  DISCARD_CARDS: 'DISCARD_CARDS',
  SEND_TO_GRAVEYARD: 'SEND_TO_GRAVEYARD',
} as const;

export type RequirementType = (typeof REQUIREMENT_TYPE)[keyof typeof REQUIREMENT_TYPE];

/**
 * Types of random effects that can be applied
 */
export const RANDOM_EFFECT_TYPE = {
  COIN_FLIP: 'COIN_FLIP',
  DICE_ROLL: 'DICE_ROLL',
  STATIC: 'STATIC',
} as const;

export type RandomEffectType = (typeof RANDOM_EFFECT_TYPE)[keyof typeof RANDOM_EFFECT_TYPE];

/**
 * Game phases during a round
 */
export const GAME_PHASE = {
  SETUP: 'SETUP',
  PLANNING: 'PLANNING', // Player decides what to do
  PLAYING_CARDS: 'PLAYING_CARDS',
  CLEANUP: 'CLEANUP', // Discard remaining cards, draw new hand
  GAME_OVER: 'GAME_OVER',
} as const;

export type GamePhase = (typeof GAME_PHASE)[keyof typeof GAME_PHASE];

/**
 * Possible game end states
 */
export const GAME_END_STATE = {
  WON: 'WON', // 100% progress, 0 bugs
  LOST_NO_CARDS: 'LOST_NO_CARDS', // Cannot draw full hand
  IN_PROGRESS: 'IN_PROGRESS',
} as const;

export type GameEndState = (typeof GAME_END_STATE)[keyof typeof GAME_END_STATE];

/**
 * Different pile types in the game
 */
export const PILE_TYPE = {
  DECK: 'DECK', // Face-down draw pile
  HAND: 'HAND', // Player's current hand
  DISCARD: 'DISCARD', // Face-down discarded cards
  GRAVEYARD: 'GRAVEYARD', // Face-down played cards (never return)
} as const;

export type PileType = (typeof PILE_TYPE)[keyof typeof PILE_TYPE];
