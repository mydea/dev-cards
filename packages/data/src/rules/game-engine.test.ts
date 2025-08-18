import { describe, it, expect } from 'vitest';
import { GameEngine } from './game-engine';
import { GAME_END_STATE_IN_PROGRESS, GAME_PHASE_PLANNING } from '../types';

describe('GameEngine', () => {
  it('should create a new game with correct initial state', () => {
    const engine = new GameEngine();
    const gameState = engine.createNewGame();

    expect(gameState.phase).toBe(GAME_PHASE_PLANNING);
    expect(gameState.endState).toBe(GAME_END_STATE_IN_PROGRESS);
    expect(gameState.resources.progress).toBe(0);
    expect(gameState.resources.bugs).toBe(0);
    expect(gameState.resources.technicalDebt).toBe(0);
    expect(gameState.resources.productivityPoints).toBe(20);
    expect(gameState.stats.currentRound).toBe(1);
    expect(gameState.piles.hand.length).toBe(5);
    expect(gameState.piles.deck.length).toBeGreaterThan(0);
  });

  it('should validate card play requirements correctly', () => {
    const engine = new GameEngine();
    const gameState = engine.createNewGame();

    // Find a card that requires PP
    const cardWithPPRequirement = gameState.piles.hand.find((card) =>
      card.card.requirements.some((req) => req.type === 'SPEND_PP')
    );

    if (cardWithPPRequirement) {
      const result = engine.processAction({
        type: 'PLAY_CARD',
        cardInstanceId: cardWithPPRequirement.instanceId,
      });

      // Should succeed if we have enough PP
      const ppRequirement = cardWithPPRequirement.card.requirements.find(
        (req) => req.type === 'SPEND_PP'
      );
      if (ppRequirement && ppRequirement.value <= 20) {
        expect(result.success).toBe(true);
        expect(result.newState).toBeDefined();
        expect(result.newState!.stats.cardsPlayed).toBe(1);
      }
    }
  });

  it('should handle technical debt reduction', () => {
    const engine = new GameEngine();
    const gameState = engine.createNewGame();
    const initialHandSize = gameState.piles.hand.length;

    const result = engine.processAction({
      type: 'DISCARD_ALL_FOR_TD_REDUCTION',
    });

    expect(result.success).toBe(true);
    expect(result.newState).toBeDefined();
    
    // Should have reduced technical debt (was 0, should still be 0 but action should succeed)
    expect(result.newState!.resources.technicalDebt).toBe(0);
    
    // Should have new hand after ending turn
    expect(result.newState!.piles.hand.length).toBe(5);
    
    // Should be in next round
    expect(result.newState!.stats.currentRound).toBe(2);
    
    // Should have updated stats
    expect(result.newState!.stats.techDebtReductions).toBe(1);
  });

  it('should handle end turn correctly', () => {
    const engine = new GameEngine();
    const gameState = engine.createNewGame();

    const result = engine.processAction({
      type: 'END_TURN',
    });

    expect(result.success).toBe(true);
    expect(result.newState).toBeDefined();
    expect(result.newState!.stats.currentRound).toBe(2);
    expect(result.newState!.piles.hand.length).toBe(5);
    expect(result.newState!.resources.productivityPoints).toBe(20); // Fresh PP for new round
  });

  it('should maintain game state consistency', () => {
    const engine = new GameEngine();
    const gameState = engine.createNewGame();

    // Count total cards at start
    const totalCards =
      gameState.piles.deck.length +
      gameState.piles.hand.length +
      gameState.piles.discard.length +
      gameState.piles.graveyard.length;

    // Play a card
    const firstCard = gameState.piles.hand[0];
    const result = engine.processAction({
      type: 'PLAY_CARD',
      cardInstanceId: firstCard.instanceId,
    });

    if (result.success && result.newState) {
      // Total cards should remain the same
      const newTotalCards =
        result.newState.piles.deck.length +
        result.newState.piles.hand.length +
        result.newState.piles.discard.length +
        result.newState.piles.graveyard.length;

      expect(newTotalCards).toBe(totalCards);
    }
  });

  it('should create save state', () => {
    const engine = new GameEngine();
    engine.createNewGame();

    const saveState = engine.getSaveState();

    expect(saveState).toBeDefined();
    expect(saveState.gameState).toBeDefined();
    expect(saveState.savedAt).toBeDefined();
    expect(saveState.version).toBe('1.0.0');
  });
});
