import type { EffectType, RequirementType } from './enums';
import {
  RANDOM_EFFECT_TYPE_STATIC,
  RANDOM_EFFECT_TYPE_COIN_FLIP,
  REQUIREMENT_TYPE_SPEND_PP,
  REQUIREMENT_TYPE_DISCARD_CARDS,
} from './enums';

/**
 * Base interface for all card effects
 */
export interface BaseEffect {
  type: EffectType;
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
 * Union type for all possible effects
 */
export type CardEffect = StaticEffect | CoinFlipEffect;

/**
 * Base interface for card requirements
 */
export interface BaseRequirement {
  type: RequirementType;
  value: number;
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
 * Union type for all possible requirements
 */
export type CardRequirement = SpendPPRequirement | DiscardCardsRequirement;

/**
 * Result of resolving an effect (includes random outcome if applicable)
 */
export interface EffectResolution {
  effect: CardEffect;
  resolvedValue: number;
  randomOutcome?: 'heads' | 'tails'; // For coin flip
  cardsToDraw?: number; // Number of cards to draw from EFFECT_TYPE_DRAW_CARDS (UI handles actual drawing)
}
