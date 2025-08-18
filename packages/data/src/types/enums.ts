/**
 * Card effect types that can be applied to the game state
 */
export const EFFECT_TYPE_ADD_PROGRESS = 'ADD_PROGRESS';
export const EFFECT_TYPE_REMOVE_PROGRESS = 'REMOVE_PROGRESS';
export const EFFECT_TYPE_ADD_BUGS = 'ADD_BUGS';
export const EFFECT_TYPE_REMOVE_BUGS = 'REMOVE_BUGS';
export const EFFECT_TYPE_ADD_TECHNICAL_DEBT = 'ADD_TECHNICAL_DEBT';
export const EFFECT_TYPE_REMOVE_TECHNICAL_DEBT = 'REMOVE_TECHNICAL_DEBT';
export const EFFECT_TYPE_SHUFFLE_DISCARD_TO_DECK = 'SHUFFLE_DISCARD_TO_DECK';
export const EFFECT_TYPE_DRAW_CARDS = 'DRAW_CARDS';

export type EffectType =
  | typeof EFFECT_TYPE_ADD_PROGRESS
  | typeof EFFECT_TYPE_REMOVE_PROGRESS
  | typeof EFFECT_TYPE_ADD_BUGS
  | typeof EFFECT_TYPE_REMOVE_BUGS
  | typeof EFFECT_TYPE_ADD_TECHNICAL_DEBT
  | typeof EFFECT_TYPE_REMOVE_TECHNICAL_DEBT
  | typeof EFFECT_TYPE_SHUFFLE_DISCARD_TO_DECK
  | typeof EFFECT_TYPE_DRAW_CARDS;

/**
 * Card requirement types that must be met to play a card
 */
export const REQUIREMENT_TYPE_SPEND_PP = 'SPEND_PP';
export const REQUIREMENT_TYPE_DISCARD_CARDS = 'DISCARD_CARDS';
export const REQUIREMENT_TYPE_SEND_TO_GRAVEYARD = 'SEND_TO_GRAVEYARD';

export type RequirementType =
  | typeof REQUIREMENT_TYPE_SPEND_PP
  | typeof REQUIREMENT_TYPE_DISCARD_CARDS
  | typeof REQUIREMENT_TYPE_SEND_TO_GRAVEYARD;

/**
 * Types of random effects that can be applied
 */
export const RANDOM_EFFECT_TYPE_COIN_FLIP = 'COIN_FLIP';
export const RANDOM_EFFECT_TYPE_STATIC = 'STATIC';

export type RandomEffectType =
  | typeof RANDOM_EFFECT_TYPE_COIN_FLIP
  | typeof RANDOM_EFFECT_TYPE_STATIC;

/**
 * Game phases during a round
 */
export const GAME_PHASE_SETUP = 'SETUP';
export const GAME_PHASE_PLANNING = 'PLANNING'; // Player decides what to do
export const GAME_PHASE_PLAYING_CARDS = 'PLAYING_CARDS';
export const GAME_PHASE_CLEANUP = 'CLEANUP'; // Discard remaining cards, draw new hand
export const GAME_PHASE_GAME_OVER = 'GAME_OVER';

export type GamePhase =
  | typeof GAME_PHASE_SETUP
  | typeof GAME_PHASE_PLANNING
  | typeof GAME_PHASE_PLAYING_CARDS
  | typeof GAME_PHASE_CLEANUP
  | typeof GAME_PHASE_GAME_OVER;

/**
 * Possible game end states
 */
export const GAME_END_STATE_WON = 'WON'; // 100% progress, 0 bugs
export const GAME_END_STATE_LOST_NO_CARDS = 'LOST_NO_CARDS'; // Cannot draw full hand
export const GAME_END_STATE_IN_PROGRESS = 'IN_PROGRESS';

export type GameEndState =
  | typeof GAME_END_STATE_WON
  | typeof GAME_END_STATE_LOST_NO_CARDS
  | typeof GAME_END_STATE_IN_PROGRESS;

/**
 * Different pile types in the game
 */
export const PILE_TYPE_DECK = 'DECK'; // Face-down draw pile
export const PILE_TYPE_HAND = 'HAND'; // Player's current hand
export const PILE_TYPE_DISCARD = 'DISCARD'; // Face-down discarded cards
export const PILE_TYPE_GRAVEYARD = 'GRAVEYARD'; // Face-down played cards (never return)

export type PileType =
  | typeof PILE_TYPE_DECK
  | typeof PILE_TYPE_HAND
  | typeof PILE_TYPE_DISCARD
  | typeof PILE_TYPE_GRAVEYARD;
