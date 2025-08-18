/**
 * Card effect types that can be applied to the game state
 */
export enum EffectType {
  ADD_PROGRESS = 'ADD_PROGRESS',
  REMOVE_PROGRESS = 'REMOVE_PROGRESS',
  ADD_BUGS = 'ADD_BUGS',
  REMOVE_BUGS = 'REMOVE_BUGS',
  ADD_TECHNICAL_DEBT = 'ADD_TECHNICAL_DEBT',
  REMOVE_TECHNICAL_DEBT = 'REMOVE_TECHNICAL_DEBT',
  SHUFFLE_DISCARD_TO_DECK = 'SHUFFLE_DISCARD_TO_DECK',
  DRAW_CARDS = 'DRAW_CARDS',
}

/**
 * Card requirement types that must be met to play a card
 */
export enum RequirementType {
  SPEND_PP = 'SPEND_PP',
  DISCARD_CARDS = 'DISCARD_CARDS',
  SEND_TO_GRAVEYARD = 'SEND_TO_GRAVEYARD',
}

/**
 * Types of random effects that can be applied
 */
export enum RandomEffectType {
  COIN_FLIP = 'COIN_FLIP',
  DICE_ROLL = 'DICE_ROLL',
  STATIC = 'STATIC',
}

/**
 * Game phases during a round
 */
export enum GamePhase {
  SETUP = 'SETUP',
  PLANNING = 'PLANNING', // Player decides what to do
  PLAYING_CARDS = 'PLAYING_CARDS',
  CLEANUP = 'CLEANUP', // Discard remaining cards, draw new hand
  GAME_OVER = 'GAME_OVER',
}

/**
 * Possible game end states
 */
export enum GameEndState {
  WON = 'WON', // 100% progress, 0 bugs
  LOST_NO_CARDS = 'LOST_NO_CARDS', // Cannot draw full hand
  IN_PROGRESS = 'IN_PROGRESS',
}

/**
 * Different pile types in the game
 */
export enum PileType {
  DECK = 'DECK', // Face-down draw pile
  HAND = 'HAND', // Player's current hand
  DISCARD = 'DISCARD', // Face-down discarded cards
  GRAVEYARD = 'GRAVEYARD', // Face-down played cards (never return)
}
