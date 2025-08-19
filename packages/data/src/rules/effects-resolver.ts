import type { CardEffect, EffectResolution, GameState } from '../types';
import { cloneGameState } from '../utils/deep-clone';
import {
  EFFECT_TYPE_ADD_PROGRESS,
  EFFECT_TYPE_ADD_BUGS,
  EFFECT_TYPE_REMOVE_BUGS,
  EFFECT_TYPE_ADD_TECHNICAL_DEBT,
  EFFECT_TYPE_REMOVE_TECHNICAL_DEBT,
  EFFECT_TYPE_DRAW_CARDS,
  RANDOM_EFFECT_TYPE_STATIC,
  RANDOM_EFFECT_TYPE_COIN_FLIP,
} from '../types';

/**
 * Resolves a card effect and returns the resolution result
 */
export function resolveEffect(
  effect: CardEffect,
  _gameState: GameState,
  predeterminedOutcome?: 'heads' | 'tails'
): EffectResolution {
  let resolvedValue = 0;
  let randomOutcome: 'heads' | 'tails' | undefined;

  // Handle different random effect types
  switch (effect.randomType) {
    case RANDOM_EFFECT_TYPE_STATIC:
      resolvedValue = effect.value;
      break;

    case RANDOM_EFFECT_TYPE_COIN_FLIP:
      // Use predetermined outcome if provided, otherwise simulate coin flip
      if (predeterminedOutcome) {
        randomOutcome = predeterminedOutcome;
        resolvedValue =
          predeterminedOutcome === 'heads'
            ? effect.headsValue
            : effect.tailsValue;
      } else {
        const isHeads = Math.random() < 0.5;
        randomOutcome = isHeads ? 'heads' : 'tails';
        resolvedValue = isHeads ? effect.headsValue : effect.tailsValue;
      }
      break;

    default:
      throw new Error(
        `Unknown random effect type: ${(effect as any).randomType}`
      );
  }

  return {
    effect,
    resolvedValue,
    randomOutcome,
  };
}

/**
 * Applies a resolved effect to the game state
 */
export function applyEffectToGameState(
  resolution: EffectResolution,
  gameState: GameState
): GameState {
  const newState = cloneGameState(gameState);

  // Apply the effect based on its type
  switch (resolution.effect.type) {
    case EFFECT_TYPE_ADD_PROGRESS:
      newState.resources.progress = Math.min(
        100,
        newState.resources.progress + resolution.resolvedValue
      );
      break;

    case EFFECT_TYPE_ADD_BUGS:
      newState.resources.bugs = Math.max(
        0,
        newState.resources.bugs + resolution.resolvedValue
      );
      break;

    case EFFECT_TYPE_REMOVE_BUGS:
      newState.resources.bugs = Math.max(
        0,
        newState.resources.bugs - resolution.resolvedValue
      );
      break;

    case EFFECT_TYPE_ADD_TECHNICAL_DEBT:
      newState.resources.technicalDebt = Math.min(
        20,
        newState.resources.technicalDebt + resolution.resolvedValue
      );
      break;

    case EFFECT_TYPE_REMOVE_TECHNICAL_DEBT:
      newState.resources.technicalDebt = Math.max(
        0,
        newState.resources.technicalDebt - resolution.resolvedValue
      );
      break;

    case EFFECT_TYPE_DRAW_CARDS:
      // Don't actually move cards here - let the UI handle it with proper animations
      // Just store the number of cards to draw for the UI
      resolution.cardsToDraw = resolution.resolvedValue;
      break;

    default:
      throw new Error(`Unknown effect type: ${resolution.effect.type}`);
  }

  return newState;
}

/**
 * Resolves all effects from a card and applies them to the game state
 */
export function resolveAndApplyEffects(
  effects: CardEffect[],
  gameState: GameState,
  predeterminedOutcomes?: { [effectIndex: number]: 'heads' | 'tails' }
): {
  newGameState: GameState;
  resolutions: EffectResolution[];
} {
  let currentGameState = gameState;
  const resolutions: EffectResolution[] = [];

  for (let i = 0; i < effects.length; i++) {
    const effect = effects[i];
    // Resolve the effect based on current state
    const resolution = resolveEffect(
      effect,
      currentGameState,
      predeterminedOutcomes?.[i]
    );
    resolutions.push(resolution);

    // Apply the resolved effect to get new state
    currentGameState = applyEffectToGameState(resolution, currentGameState);
  }

  return {
    newGameState: currentGameState,
    resolutions,
  };
}
