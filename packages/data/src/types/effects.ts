import type { EffectType, RequirementType } from './enums';
import {
  RANDOM_EFFECT_TYPE_STATIC,
  RANDOM_EFFECT_TYPE_COIN_FLIP,
  RANDOM_EFFECT_TYPE_DICE_ROLL,
  REQUIREMENT_TYPE_SPEND_PP,
  REQUIREMENT_TYPE_DISCARD_CARDS,
  REQUIREMENT_TYPE_SEND_TO_GRAVEYARD,
} from './enums';

/**
 * Base interface for all card effects
 */
export interface BaseEffect {
  type: EffectType;
  description: string; // Human-readable description for UI
}

/**
 * Effect with a static value
 */
export interface StaticEffect extends BaseEffect {
  randomType: typeof RANDOM_EFFECT_TYPE_STATIC;
  value: number;
}

/**
 * Effect determined by a coin flip
 */
export interface CoinFlipEffect extends BaseEffect {
  randomType: typeof RANDOM_EFFECT_TYPE_COIN_FLIP;
  headsValue: number;
  tailsValue: number;
}

/**
 * Effect determined by a dice roll (1-6)
 */
export interface DiceRollEffect extends BaseEffect {
  randomType: typeof RANDOM_EFFECT_TYPE_DICE_ROLL;
  diceValues: [number, number, number, number, number, number]; // Values for 1,2,3,4,5,6
}

/**
 * Union type for all possible effects
 */
export type CardEffect = StaticEffect | CoinFlipEffect | DiceRollEffect;

/**
 * Base interface for card requirements
 */
export interface BaseRequirement {
  type: RequirementType;
  value: number;
  description: string; // Human-readable description for UI
}

/**
 * Requirement to spend Productivity Points
 */
export interface SpendPPRequirement extends BaseRequirement {
  type: typeof REQUIREMENT_TYPE_SPEND_PP;
}

/**
 * Requirement to discard cards from hand
 */
export interface DiscardCardsRequirement extends BaseRequirement {
  type: typeof REQUIREMENT_TYPE_DISCARD_CARDS;
}

/**
 * Requirement to send cards from hand to graveyard
 */
export interface SendToGraveyardRequirement extends BaseRequirement {
  type: typeof REQUIREMENT_TYPE_SEND_TO_GRAVEYARD;
}

/**
 * Union type for all possible requirements
 */
export type CardRequirement =
  | SpendPPRequirement
  | DiscardCardsRequirement
  | SendToGraveyardRequirement;

/**
 * Result of resolving an effect (includes random outcome if applicable)
 */
export interface EffectResolution {
  effect: CardEffect;
  resolvedValue: number;
  randomOutcome?: 'heads' | 'tails' | number; // For coin flip or dice roll
}
