import { CardEffect, CardRequirement } from './effects';

/**
 * Card definition that represents a single card in the deck
 */
export interface Card {
  /** Unique identifier for this card */
  id: string;

  /** Display name shown at the top of the card */
  title: string;

  /** Path or URL to the card image */
  image: string;

  /** Fun quote or comment displayed at the bottom (cosmetic only) */
  quote: string;

  /** Base productivity point cost to play this card (0-20) */
  productivityCost: number;

  /** List of requirements that must be met to play this card */
  requirements: CardRequirement[];

  /** List of effects that will be applied when this card is played */
  effects: CardEffect[];
}

/**
 * A card instance in a specific location/pile
 */
export interface CardInstance {
  /** The card definition */
  card: Card;

  /** Unique instance ID (for tracking specific instances) */
  instanceId: string;

  /** Whether this card can currently be played */
  isPlayable?: boolean;

  /** Visual state for animations */
  visualState?: {
    isSelected: boolean;
    isHighlighted: boolean;
    isAnimating: boolean;
    position?: { x: number; y: number };
    rotation?: number;
  };
}

/**
 * Result of attempting to play a card
 */
export interface PlayCardResult {
  /** Whether the card was successfully played */
  success: boolean;

  /** Error message if the card couldn't be played */
  error?: string;

  /** Effects that were applied (if successful) */
  appliedEffects?: Array<{
    effect: CardEffect;
    resolvedValue: number;
    randomOutcome?: string | number;
  }>;
}

/**
 * Card validation result
 */
export interface CardValidation {
  /** Whether the card can be played */
  canPlay: boolean;

  /** Reasons why the card cannot be played (if any) */
  reasons: string[];

  /** Missing requirements */
  missingRequirements: CardRequirement[];
}
