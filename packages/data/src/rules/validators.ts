import type {
  GameState,
  CardInstance,
  CardValidation,
  CardRequirement,
} from '../types';
import {
  REQUIREMENT_TYPE_SPEND_PP,
  REQUIREMENT_TYPE_DISCARD_CARDS,
  REQUIREMENT_TYPE_SEND_TO_GRAVEYARD,
} from '../types';

/**
 * Validates whether a card can be played in the current game state
 */
export function validateCardPlay(
  card: CardInstance,
  gameState: GameState
): CardValidation {
  const reasons: string[] = [];
  const missingRequirements: CardRequirement[] = [];

  // Check each requirement
  for (const requirement of card.card.requirements) {
    switch (requirement.type) {
      case REQUIREMENT_TYPE_SPEND_PP:
        if (gameState.resources.productivityPoints < requirement.value) {
          reasons.push(
            `Not enough PP: need ${requirement.value}, have ${gameState.resources.productivityPoints}`
          );
          missingRequirements.push(requirement);
        }
        break;

      case REQUIREMENT_TYPE_DISCARD_CARDS:
        const availableCardsToDiscard = gameState.piles.hand.length - 1; // -1 because we're playing this card
        if (availableCardsToDiscard < requirement.value) {
          reasons.push(
            `Not enough cards to discard: need ${requirement.value}, have ${availableCardsToDiscard} available`
          );
          missingRequirements.push(requirement);
        }
        break;

      case REQUIREMENT_TYPE_SEND_TO_GRAVEYARD:
        const availableCardsToGraveyard = gameState.piles.hand.length - 1; // -1 because we're playing this card
        if (availableCardsToGraveyard < requirement.value) {
          reasons.push(
            `Not enough cards to send to graveyard: need ${requirement.value}, have ${availableCardsToGraveyard} available`
          );
          missingRequirements.push(requirement);
        }
        break;

      default:
        // This should never happen if all requirement types are handled
        reasons.push(`Unknown requirement type: ${(requirement as any).type}`);
        missingRequirements.push(requirement);
    }
  }

  return {
    canPlay: reasons.length === 0,
    reasons,
    missingRequirements,
  };
}

/**
 * Validates whether the player can discard all cards to reduce technical debt
 */
export function validateTechnicalDebtReduction(gameState: GameState): boolean {
  // Can always discard cards for TD reduction if you have cards in hand
  return gameState.piles.hand.length > 0;
}

/**
 * Validates the overall game state for consistency
 */
export function validateGameState(gameState: GameState): string[] {
  const errors: string[] = [];

  // Validate resources are within bounds
  if (gameState.resources.progress < 0 || gameState.resources.progress > 100) {
    errors.push(
      `Progress out of bounds: ${gameState.resources.progress} (should be 0-100)`
    );
  }

  if (gameState.resources.bugs < 0) {
    errors.push(`Bugs cannot be negative: ${gameState.resources.bugs}`);
  }

  if (gameState.resources.technicalDebt < 0) {
    errors.push(
      `Technical debt cannot be negative: ${gameState.resources.technicalDebt}`
    );
  }

  if (gameState.resources.technicalDebt > 20) {
    errors.push(
      `Technical debt cannot exceed 20: ${gameState.resources.technicalDebt}`
    );
  }

  if (gameState.resources.productivityPoints < 0) {
    errors.push(
      `Productivity points cannot be negative: ${gameState.resources.productivityPoints}`
    );
  }

  // Validate piles
  if (gameState.piles.hand.length < 0) {
    errors.push(
      `Hand cannot have negative cards: ${gameState.piles.hand.length}`
    );
  }

  // Validate round progression
  if (gameState.stats.currentRound < 1) {
    errors.push(
      `Round number must be at least 1: ${gameState.stats.currentRound}`
    );
  }

  return errors;
}

/**
 * Checks if the game has ended (win or lose conditions)
 */
export function checkWinCondition(gameState: GameState): boolean {
  return gameState.resources.progress >= 100 && gameState.resources.bugs === 0;
}

/**
 * Checks if the game has been lost
 */
export function checkLoseCondition(gameState: GameState): boolean {
  // Lose if unable to draw a full hand (5 cards)
  const totalAvailableCards =
    gameState.piles.deck.length + gameState.piles.discard.length;
  return totalAvailableCards < 5;
}

/**
 * Validates if a card can be targeted for discard/graveyard requirements
 */
export function validateCardForRequirement(
  cardToUse: CardInstance,
  targetCard: CardInstance,
  gameState: GameState
): boolean {
  // Cannot target the card being played
  if (cardToUse.instanceId === targetCard.instanceId) {
    return false;
  }

  // Target card must be in hand
  return gameState.piles.hand.some(
    (c) => c.instanceId === targetCard.instanceId
  );
}
