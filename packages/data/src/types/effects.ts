import { EffectType, RequirementType, RandomEffectType } from './enums';

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
  randomType: RandomEffectType.STATIC;
  value: number;
}

/**
 * Effect determined by a coin flip
 */
export interface CoinFlipEffect extends BaseEffect {
  randomType: RandomEffectType.COIN_FLIP;
  headsValue: number;
  tailsValue: number;
}

/**
 * Effect determined by a dice roll (1-6)
 */
export interface DiceRollEffect extends BaseEffect {
  randomType: RandomEffectType.DICE_ROLL;
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
  type: RequirementType.SPEND_PP;
}

/**
 * Requirement to discard cards from hand
 */
export interface DiscardCardsRequirement extends BaseRequirement {
  type: RequirementType.DISCARD_CARDS;
}

/**
 * Requirement to send cards from hand to graveyard
 */
export interface SendToGraveyardRequirement extends BaseRequirement {
  type: RequirementType.SEND_TO_GRAVEYARD;
}

/**
 * Union type for all possible requirements
 */
export type CardRequirement = SpendPPRequirement | DiscardCardsRequirement | SendToGraveyardRequirement;

/**
 * Result of resolving an effect (includes random outcome if applicable)
 */
export interface EffectResolution {
  effect: CardEffect;
  resolvedValue: number;
  randomOutcome?: 'heads' | 'tails' | number; // For coin flip or dice roll
}
